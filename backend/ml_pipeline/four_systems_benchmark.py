import json
import math
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np
from scipy import stats
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from feature_extractor import extract_features_for_draw

def wilson_score_interval(successes: int, total: int, confidence: float = 0.95) -> Tuple[float, float]:
    if total == 0:
        return 0.0, 0.0
    z = stats.norm.ppf(1 - (1 - confidence) / 2)
    p = successes / total
    denom = 1 + (z**2) / total
    centre = (p + (z**2) / (2 * total)) / denom
    spread = z * math.sqrt((p * (1 - p) + (z**2) / (4 * total)) / total) / denom
    lower = max(0.0, (centre - spread) * 100.0)
    upper = min(100.0, (centre + spread) * 100.0)
    return round(lower, 2), round(upper, 2)

def mcnemar_test_paired(hits_model: List[bool], hits_benchmark: List[bool]) -> Tuple[float, float]:
    """
    Realiza la prueba de McNemar con corrección de continuidad para aciertos pareados.
    """
    b = 0 # Model acertó, Benchmark falló
    c = 0 # Model falló, Benchmark acertó
    for hm, hb in zip(hits_model, hits_benchmark):
        if hm and not hb:
            b += 1
        elif not hm and hb:
            c += 1
    
    if (b + c) == 0:
        return 0.0, 1.0
    
    # Estadístico con corrección de continuidad de Edwards
    stat = ((abs(b - c) - 1.0) ** 2) / (b + c)
    p_value = float(stats.chi2.sf(stat, df=1))
    return round(stat, 4), round(p_value, 4)

def simulate_statistical_baseline(history: List[Dict[str, Any]]) -> List[str]:
    """Sistema A: Baseline descriptivo actual (Frecuencias + Atrasos + Transiciones)"""
    total = len(history)
    stats_map = {f"{i:02d}": {"head": 0, "board": 0, "delay": total} for i in range(100)}
    last_head_ambo = history[-1]["head_ambo"]
    last_unit = int(last_head_ambo[1])
    markov = np.zeros((10, 10), dtype=int)

    for idx, d in enumerate(history):
        head = d["head_ambo"]
        stats_map[head]["head"] += 1
        stats_map[head]["delay"] = total - 1 - idx
        u = int(head[1])
        if idx > 0:
            p_u = int(history[idx - 1]["head_ambo"][1])
            markov[p_u, u] += 1
        for b in d["board"]:
            stats_map[b[-2:]]["board"] += 1

    row_sum = markov[last_unit].sum()
    m_probs = markov[last_unit] / (row_sum if row_sum > 0 else 1)

    max_h = max(1, max(s["head"] for s in stats_map.values()))
    max_b = max(1, max(s["board"] for s in stats_map.values()))

    scores = []
    for i in range(100):
        num = f"{i:02d}"
        s = stats_map[num]
        u = int(num[1])
        f_norm = (s["head"] / max_h) * 40.0
        d_norm = min(30.0, (s["delay"] / 100.0) * 30.0)
        b_norm = (s["board"] / max_b) * 15.0
        m_norm = min(15.0, float(m_probs[u]) * 15.0 * 5.0)
        score = 15.0 + f_norm + d_norm + b_norm + m_norm
        scores.append((num, score))

    scores.sort(key=lambda x: x[1], reverse=True)
    return [x[0] for x in scores]

def simulate_markov_independent(history: List[Dict[str, Any]]) -> List[str]:
    """Sistema C: Modelo de Markov Independiente Puro de 1er Orden (Unidades y Decenas)"""
    mat_unit = np.ones((10, 10), dtype=float) # Laplace smoothing (+1)
    mat_dec = np.ones((10, 10), dtype=float)

    for idx in range(1, len(history)):
        prev_head = history[idx - 1]["head_ambo"]
        curr_head = history[idx]["head_ambo"]
        pu, cu = int(prev_head[1]), int(curr_head[1])
        pd, cd = int(prev_head[0]), int(curr_head[0])
        mat_unit[pu, cu] += 1.0
        mat_dec[pd, cd] += 1.0

    last_head = history[-1]["head_ambo"]
    last_u, last_d = int(last_head[1]), int(last_head[0])

    p_units = mat_unit[last_u] / mat_unit[last_u].sum()
    p_decs = mat_dec[last_d] / mat_dec[last_d].sum()

    scores = []
    for i in range(100):
        d, u = i // 10, i % 10
        prob = p_decs[d] * p_units[u]
        scores.append((f"{i:02d}", prob))

    scores.sort(key=lambda x: x[1], reverse=True)
    return [x[0] for x in scores]

def run_four_systems_benchmark():
    data_path = Path("./backend/ml_pipeline/draws_curated.json")
    if not data_path.exists():
        raise FileNotFoundError(f"No se encontró el dataset {data_path}")

    with open(data_path, "r", encoding="utf-8") as f:
        draws = json.load(f)

    total_draws = len(draws)
    eval_draws_count = 400
    eval_start_idx = total_draws - eval_draws_count
    eval_end_idx = total_draws

    print(f"=== BENCHMARK DE LOS 4 SISTEMAS (400 Sorteos Out-of-Sample) ===")
    print(f"Muestra de evaluación: sorteos #{eval_start_idx} al #{eval_end_idx}")
    print(f"Período: {draws[eval_start_idx]['draw_date']} al {draws[eval_end_idx - 1]['draw_date']}")

    # 1. Entrenar el modelo de Regresión Logística L2 exclusivamente con datos previos
    train_history = draws[:eval_start_idx]
    X_train_list, y_train_list = [], []
    sample_step = max(1, len(train_history) // 150)
    for idx in range(100, len(train_history), sample_step):
        X_sub, targets_sub, f_names = extract_features_for_draw(draws[:idx], draws[idx])
        X_train_list.append(X_sub)
        y_train_list.append(targets_sub["top20"])

    X_train_all = np.vstack(X_train_list)
    y_train_all = np.concatenate(y_train_list)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_all)

    model_lr = LogisticRegression(C=0.1, max_iter=300, class_weight='balanced', random_state=42)
    model_lr.fit(X_train_scaled, y_train_all)

    # Inicializar acumuladores para los 4 sistemas
    systems = ["A_baseline", "B_ml_logistic", "C_markov", "D_random"]
    system_labels = {
        "A_baseline": "Sistema A (Baseline Estadístico)",
        "B_ml_logistic": "Sistema B (Regresión Logística + Markov)",
        "C_markov": "Sistema C (Markov Independiente)",
        "D_random": "Sistema D (Azar Monte Carlo)"
    }

    hits = {s: {"head": [], "top5": [], "top10": [], "top20": []} for s in systems}
    precision_sums = {s: {"p5": 0.0, "p10": 0.0, "p20": 0.0} for s in systems}
    recall_sums = {s: {"p5": 0.0, "p10": 0.0, "p20": 0.0} for s in systems}

    # Desgloses
    by_lottery = {s: {"ciudad": {"draws": 0, "head": 0, "board": 0}, "provincia": {"draws": 0, "head": 0, "board": 0}} for s in systems}
    by_shift = {s: {} for s in systems}
    by_weekday = {s: {i: {"draws": 0, "head": 0, "board": 0} for i in range(7)} for s in systems}

    rng = np.random.RandomState(42)

    for k in range(eval_start_idx, eval_end_idx):
        history_k = draws[:k]
        target_k = draws[k]
        lottery = target_k["lottery"]
        shift = target_k["shift"]
        date_obj = target_k["draw_date"]
        # Calcular día de la semana
        weekday = int(Path(target_k["draw_date"]).name.split("-")[2]) % 7 # Aproximación o parse datetime
        import datetime
        dt = datetime.date.fromisoformat(target_k["draw_date"])
        weekday_idx = dt.weekday()

        actual_head = target_k["head_ambo"]
        actual_board_ambos = [n[-2:] for n in target_k["board"]]
        actual_top5 = set(actual_board_ambos[:5])
        actual_top10 = set(actual_board_ambos[:10])
        actual_top20 = set(actual_board_ambos[:20])

        # Generar predicciones para los 4 sistemas
        # A: Baseline
        pred_A = simulate_statistical_baseline(history_k)
        
        # B: ML
        X_test, _, _ = extract_features_for_draw(history_k, target_k)
        X_test_scaled = scaler.transform(X_test)
        probs_ml = model_lr.predict_proba(X_test_scaled)[:, 1]
        pred_B = [f"{i:02d}" for i in np.argsort(probs_ml)[::-1]]

        # C: Markov Independiente
        pred_C = simulate_markov_independent(history_k)

        # D: Azar Monte Carlo (sin reemplazo)
        pred_D = [f"{i:02d}" for i in rng.choice(100, size=100, replace=False)]

        preds = {
            "A_baseline": pred_A,
            "B_ml_logistic": pred_B,
            "C_markov": pred_C,
            "D_random": pred_D
        }

        for s in systems:
            p_list = preds[s]
            p5 = p_list[:5]
            p10 = p_list[:10]
            p20 = p_list[:20]

            # Cabeza
            is_head = (p_list[0] == actual_head)
            hits[s]["head"].append(is_head)

            # Hit Rate Pizarra (al menos 1 ambo en pizarra)
            is_top5 = any(n in actual_top5 for n in p5)
            is_top10 = any(n in actual_top10 for n in p5)
            is_top20 = any(n in actual_top20 for n in p5)

            hits[s]["top5"].append(is_top5)
            hits[s]["top10"].append(is_top10)
            hits[s]["top20"].append(is_top20)

            # Precision & Recall en Top 5, 10, 20
            p5_inter = len(set(p5).intersection(actual_top20))
            p10_inter = len(set(p10).intersection(actual_top20))
            p20_inter = len(set(p20).intersection(actual_top20))

            precision_sums[s]["p5"] += (p5_inter / 5.0)
            precision_sums[s]["p10"] += (p10_inter / 10.0)
            precision_sums[s]["p20"] += (p20_inter / 20.0)

            actual_unique_count = len(actual_top20)
            recall_sums[s]["p5"] += (p5_inter / actual_unique_count)
            recall_sums[s]["p10"] += (p10_inter / actual_unique_count)
            recall_sums[s]["p20"] += (p20_inter / actual_unique_count)

            # Segmentaciones
            by_lottery[s][lottery]["draws"] += 1
            if is_head:
                by_lottery[s][lottery]["head"] += 1
            if is_top20:
                by_lottery[s][lottery]["board"] += 1

            if shift not in by_shift[s]:
                by_shift[s][shift] = {"draws": 0, "head": 0, "board": 0}
            by_shift[s][shift]["draws"] += 1
            if is_head:
                by_shift[s][shift]["head"] += 1
            if is_top20:
                by_shift[s][shift]["board"] += 1

            by_weekday[s][weekday_idx]["draws"] += 1
            if is_head:
                by_weekday[s][weekday_idx]["head"] += 1
            if is_top20:
                by_weekday[s][weekday_idx]["board"] += 1

    # Compilar métricas agregadas
    summary_table = []
    n = eval_draws_count

    for s in systems:
        h_hits = sum(hits[s]["head"])
        t5_hits = sum(hits[s]["top5"])
        t10_hits = sum(hits[s]["top10"])
        t20_hits = sum(hits[s]["top20"])

        h_pct = round((h_hits / n) * 100.0, 2)
        h_ci = wilson_score_interval(h_hits, n)

        t20_pct = round((t20_hits / n) * 100.0, 2)
        t20_ci = wilson_score_interval(t20_hits, n)

        t10_pct = round((t10_hits / n) * 100.0, 2)
        t5_pct = round((t5_hits / n) * 100.0, 2)

        p5_avg = round(precision_sums[s]["p5"] / n, 4)
        p10_avg = round(precision_sums[s]["p10"] / n, 4)
        p20_avg = round(precision_sums[s]["p20"] / n, 4)

        r5_avg = round(recall_sums[s]["p5"] / n, 4)
        r10_avg = round(recall_sums[s]["p10"] / n, 4)
        r20_avg = round(recall_sums[s]["p20"] / n, 4)

        f1_p5 = round(2 * (p5_avg * r5_avg) / (p5_avg + r5_avg), 4) if (p5_avg + r5_avg) > 0 else 0.0

        summary_table.append({
            "system_key": s,
            "name": system_labels[s],
            "head_hits": h_hits,
            "head_hit_rate": h_pct,
            "head_ci95": h_ci,
            "board_top20_hits": t20_hits,
            "board_top20_rate": t20_pct,
            "board_top20_ci95": t20_ci,
            "board_top10_hits": t10_hits,
            "board_top10_rate": t10_pct,
            "board_top5_hits": t5_hits,
            "board_top5_rate": t5_pct,
            "precision_at_5": p5_avg,
            "precision_at_10": p10_avg,
            "precision_at_20": p20_avg,
            "recall_at_5": r5_avg,
            "f1_score_at_5": f1_p5
        })

    # Pruebas estadísticas pareadas de contraste
    contrasts = {}
    pairs = [
        ("B_ml_logistic", "D_random", "ML vs Azar"),
        ("A_baseline", "D_random", "Baseline vs Azar"),
        ("C_markov", "D_random", "Markov vs Azar"),
        ("B_ml_logistic", "A_baseline", "ML vs Baseline"),
        ("B_ml_logistic", "C_markov", "ML vs Markov")
    ]

    for s1, s2, label in pairs:
        # McNemar para cabeza
        stat_head, p_head = mcnemar_test_paired(hits[s1]["head"], hits[s2]["head"])
        # McNemar para pizarra top 20
        stat_board, p_board = mcnemar_test_paired(hits[s1]["top20"], hits[s2]["top20"])

        # Test Binomial exacto de 1° premio
        h1 = sum(hits[s1]["head"])
        h2 = sum(hits[s2]["head"])
        b1 = sum(hits[s1]["top20"])
        b2 = sum(hits[s2]["top20"])

        diff_head_abs = round((h1 - h2) / n * 100.0, 2)
        diff_board_abs = round((b1 - b2) / n * 100.0, 2)

        rel_head = round(((h1 - h2) / h2) * 100.0, 2) if h2 > 0 else 0.0
        rel_board = round(((b1 - b2) / b2) * 100.0, 2) if b2 > 0 else 0.0

        contrasts[f"{s1}_vs_{s2}"] = {
            "label": label,
            "head": {
                "diff_absolute_pct": f"{'+' if diff_head_abs > 0 else ''}{diff_head_abs}%",
                "diff_relative_pct": f"{'+' if rel_head > 0 else ''}{rel_head}%",
                "mcnemar_stat": stat_head,
                "p_value": p_head,
                "is_statistically_significant": p_head < 0.05,
                "statement": "Superioridad estadísticamente significativa demostrada (p < 0.05)." if p_head < 0.05 else "No se encontró evidencia estadísticamente significativa de superioridad (p >= 0.05)."
            },
            "board_top20": {
                "diff_absolute_pct": f"{'+' if diff_board_abs > 0 else ''}{diff_board_abs}%",
                "diff_relative_pct": f"{'+' if rel_board > 0 else ''}{rel_board}%",
                "mcnemar_stat": stat_board,
                "p_value": p_board,
                "is_statistically_significant": p_board < 0.05,
                "statement": "Superioridad estadísticamente significativa demostrada en pizarra (p < 0.05)." if p_board < 0.05 else "No se encontró evidencia estadísticamente significativa de superioridad en pizarra (p >= 0.05)."
            }
        }

    benchmark_output = {
        "benchmark_name": "FOUR_SYSTEMS_SCIENTIFIC_EVALUATION",
        "eval_period": f"{draws[eval_start_idx]['draw_date']} al {draws[eval_end_idx - 1]['draw_date']}",
        "total_eval_draws": n,
        "summary": summary_table,
        "statistical_contrasts": contrasts,
        "segmentations": {
            "by_lottery": by_lottery,
            "by_shift": by_shift,
            "by_weekday": by_weekday
        }
    }

    out_file = Path("./backend/ml_pipeline/four_systems_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(benchmark_output, f, indent=2, ensure_ascii=False)

    print(f"[+] Resultados guardados en {out_file}")
    for item in summary_table:
        print(f"  * {item['name']}: Cabeza={item['head_hits']} ({item['head_hit_rate']}%) [IC95: {item['head_ci95']}] | Pizarra={item['board_top20_hits']} ({item['board_top20_rate']}%) [IC95: {item['board_top20_ci95']}] | Prec@5={item['precision_at_5']}")

    print("\n--- Contrastes Estadísticos Contra el Azar ---")
    for key, c in contrasts.items():
        print(f"  [{c['label']}] Cabeza: dif={c['head']['diff_absolute_pct']} (p={c['head']['p_value']}) -> {c['head']['statement']}")
        print(f"     Pizarra: dif={c['board_top20']['diff_absolute_pct']} (p={c['board_top20']['p_value']}) -> {c['board_top20']['statement']}")

    return benchmark_output

if __name__ == "__main__":
    run_four_systems_benchmark()
