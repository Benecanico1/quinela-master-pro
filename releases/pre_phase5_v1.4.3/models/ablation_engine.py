"""
ablation_engine.py
FASE 4 — ABLATION TEST + VALOR INCREMENTAL DEL MACHINE LEARNING
Quiniela Master Pro

Ejecuta el protocolo riguroso de ablación sobre el conjunto congelado HISTORICAL_TEST_V1 (400 sorteos).
Evalúa:
1. Seis sistemas de referencia: Azar, Frecuencia Simple, Atraso Simple, Markov Puro, Baseline Estadístico, ML-FULL.
2. Cinco modelos de ablación de variables: ML-NO-MARKOV, ML-FREQUENCY, ML-DELAY, ML-TREND, ML-POSITION.
3. Métricas separadas: Cabeza (aciertos, %, Wilson IC 95%), Hit Rate@K, Precision@K (K in {5, 10, 20}).
4. Contrastes pareados: McNemar (Hit Rate) y Paired t-test (Precision).
5. Robustez temporal (4 ventanas de 100 sorteos con desviación estándar), por lotería y por turno.
"""

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
    b = 0 # Model acertó, Benchmark falló
    c = 0 # Model falló, Benchmark acertó
    for hm, hb in zip(hits_model, hits_benchmark):
        if hm and not hb:
            b += 1
        elif not hm and hb:
            c += 1
    
    if (b + c) == 0:
        return 0.0, 1.0
    
    stat = ((abs(b - c) - 1.0) ** 2) / (b + c)
    p_value = float(stats.chi2.sf(stat, df=1))
    return round(stat, 4), round(p_value, 4)

def paired_t_test(values_model: List[float], values_benchmark: List[float]) -> Tuple[float, float, Tuple[float, float]]:
    diffs = np.array(values_model) - np.array(values_benchmark)
    n = len(diffs)
    mean_diff = float(np.mean(diffs))
    if n <= 1:
        return 0.0, 1.0, (round(mean_diff, 4), round(mean_diff, 4))
    std_diff = float(np.std(diffs, ddof=1))
    se_diff = std_diff / math.sqrt(n) if std_diff > 0 else 1e-9
    t_stat = mean_diff / se_diff
    p_val = float(stats.t.sf(abs(t_stat), df=n - 1) * 2)
    
    # 95% CI for difference
    t_crit = stats.t.ppf(0.975, df=n - 1)
    ci_lower = mean_diff - t_crit * se_diff
    ci_upper = mean_diff + t_crit * se_diff
    return round(t_stat, 4), round(p_val, 4), (round(ci_lower, 4), round(ci_upper, 4))

def simulate_statistical_baseline(history: List[Dict[str, Any]]) -> List[str]:
    """Baseline descriptivo actual (Frecuencias + Atrasos + Transiciones)"""
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
    """Modelo de Markov Independiente Puro de 1er Orden (Unidades y Decenas)"""
    mat_unit = np.ones((10, 10), dtype=float)
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

def simulate_frequency_simple(history: List[Dict[str, Any]]) -> List[str]:
    """Frecuencia Simple Acumulada en Pizarra histórica"""
    counts = {f"{i:02d}": 0 for i in range(100)}
    for d in history:
        for b in d["board"]:
            counts[b[-2:]] += 1
    sorted_ambos = sorted(counts.keys(), key=lambda x: (counts[x], -int(x)), reverse=True)
    return sorted_ambos

def simulate_delay_simple(history: List[Dict[str, Any]]) -> List[str]:
    """Atraso Simple (mayor número de sorteos sin salir en pizarra)"""
    total = len(history)
    last_seen = {f"{i:02d}": -1 for i in range(100)}
    for idx, d in enumerate(history):
        for b in d["board"]:
            last_seen[b[-2:]] = idx
    delays = {k: (total - 1 - last_seen[k]) if last_seen[k] != -1 else total for k in last_seen}
    sorted_ambos = sorted(delays.keys(), key=lambda x: (delays[x], -int(x)), reverse=True)
    return sorted_ambos

def run_ablation_engine():
    data_path = Path("./backend/ml_pipeline/draws_curated.json")
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset no encontrado en {data_path}")

    with open(data_path, "r", encoding="utf-8") as f:
        draws = json.load(f)

    total_draws = len(draws)
    eval_draws_count = 400
    eval_start_idx = total_draws - eval_draws_count
    eval_end_idx = total_draws

    print("==================================================================")
    print("FASE 4: AUDITORIA DE ABLACION Y VALOR INCREMENTAL DE ML")
    print(f"Dataset congelado: {eval_draws_count} sorteos (#{eval_start_idx} al #{eval_end_idx})")
    print(f"Periodo: {draws[eval_start_idx]['draw_date']} al {draws[eval_end_idx - 1]['draw_date']}")
    print("==================================================================")

    train_history = draws[:eval_start_idx]
    X_train_list, y_train_list = [], []
    sample_step = max(1, len(train_history) // 150)
    for idx in range(100, len(train_history), sample_step):
        X_sub, targets_sub, f_names = extract_features_for_draw(draws[:idx], draws[idx])
        X_train_list.append(X_sub)
        y_train_list.append(targets_sub["top20"])

    X_train_all = np.vstack(X_train_list)
    y_train_all = np.concatenate(y_train_list)

    feature_subsets = {
        "ML-FULL": list(range(22)),
        "ML-NO-MARKOV": [i for i in range(22) if i != 21],
        "ML-FREQUENCY": [0, 1, 2, 3, 4, 5, 17, 18, 19, 20],
        "ML-DELAY": [6, 7, 8, 9],
        "ML-TREND": [10, 11, 12],
        "ML-POSITION": [13, 14, 15, 16]
    }

    trained_models = {}
    scalers = {}

    for k, idxs in feature_subsets.items():
        sub_X = X_train_all[:, idxs]
        sc = StandardScaler()
        sub_X_sc = sc.fit_transform(sub_X)
        clf = LogisticRegression(C=0.1, max_iter=300, class_weight="balanced", random_state=42)
        clf.fit(sub_X_sc, y_train_all)
        trained_models[k] = clf
        scalers[k] = sc

    all_evaluated_systems = [
        "REF-RANDOM",
        "REF-FREQ-SIMPLE",
        "REF-DELAY-SIMPLE",
        "REF-MARKOV-PURO",
        "REF-BASELINE",
        "ML-FULL",
        "ML-NO-MARKOV",
        "ML-FREQUENCY",
        "ML-DELAY",
        "ML-TREND",
        "ML-POSITION"
    ]

    system_labels = {
        "REF-RANDOM": "Azar Monte Carlo (seed 42)",
        "REF-FREQ-SIMPLE": "Frecuencia Simple (Acumulada)",
        "REF-DELAY-SIMPLE": "Atraso Simple (Sin Salir)",
        "REF-MARKOV-PURO": "Markov Puro 1er Orden",
        "REF-BASELINE": "Baseline Estadistico (Actual)",
        "ML-FULL": "ML Completo (22 variables)",
        "ML-NO-MARKOV": "ML sin Markov (21 variables)",
        "ML-FREQUENCY": "ML solo Frecuencia (10 variables)",
        "ML-DELAY": "ML solo Atraso (4 variables)",
        "ML-TREND": "ML solo Tendencia (3 variables)",
        "ML-POSITION": "ML solo Posicion (4 variables)"
    }

    per_draw_metrics = {
        s: {
            "head": [],
            "hit_at_5": [],
            "hit_at_10": [],
            "hit_at_20": [],
            "prec_at_5": [],
            "prec_at_10": [],
            "prec_at_20": []
        }
        for s in all_evaluated_systems
    }

    window_metrics = {
        w_idx: {s: {"hit_at_20": [], "hit_at_10": [], "hit_at_5": [], "prec_at_5": []} for s in all_evaluated_systems}
        for w_idx in range(4)
    }
    lottery_metrics = {
        "ciudad": {s: {"draws": 0, "head": 0, "hit_at_20": 0, "prec_at_5_sum": 0.0} for s in all_evaluated_systems},
        "provincia": {s: {"draws": 0, "head": 0, "hit_at_20": 0, "prec_at_5_sum": 0.0} for s in all_evaluated_systems}
    }
    shift_metrics = {
        s_name: {s: {"draws": 0, "head": 0, "hit_at_20": 0, "prec_at_5_sum": 0.0} for s in all_evaluated_systems}
        for s_name in ["previa", "primera", "matutina", "vespertina", "nocturna"]
    }

    rng = np.random.RandomState(42)

    print("Evaluando 400 sorteos congelados paso a paso...")
    for eval_idx, k in enumerate(range(eval_start_idx, eval_end_idx)):
        history_k = draws[:k]
        target_k = draws[k]
        lottery = target_k["lottery"]
        shift = target_k["shift"]

        actual_head = target_k["head_ambo"]
        actual_board_ambos = [n[-2:] for n in target_k["board"]]
        actual_top20_set = set(actual_board_ambos[:20])

        X_k, _, _ = extract_features_for_draw(history_k, target_k)

        preds = {}
        preds["REF-RANDOM"] = [f"{i:02d}" for i in rng.choice(100, size=100, replace=False)]
        preds["REF-FREQ-SIMPLE"] = simulate_frequency_simple(history_k)
        preds["REF-DELAY-SIMPLE"] = simulate_delay_simple(history_k)
        preds["REF-MARKOV-PURO"] = simulate_markov_independent(history_k)
        preds["REF-BASELINE"] = simulate_statistical_baseline(history_k)

        for model_name, idxs in feature_subsets.items():
            sub_X_k = X_k[:, idxs]
            sub_X_k_sc = scalers[model_name].transform(sub_X_k)
            probs = trained_models[model_name].predict_proba(sub_X_k_sc)[:, 1]
            sorted_indices = np.argsort(probs)[::-1]
            preds[model_name] = [f"{i:02d}" for i in sorted_indices]

        window_idx = eval_idx // 100

        for s in all_evaluated_systems:
            p_list = preds[s]
            p5 = p_list[:5]
            p10 = p_list[:10]
            p20 = p_list[:20]

            is_head = (p_list[0] == actual_head)
            per_draw_metrics[s]["head"].append(is_head)

            is_hit_5 = any(n in actual_top20_set for n in p5)
            is_hit_10 = any(n in actual_top20_set for n in p10)
            is_hit_20 = any(n in actual_top20_set for n in p20)

            per_draw_metrics[s]["hit_at_5"].append(is_hit_5)
            per_draw_metrics[s]["hit_at_10"].append(is_hit_10)
            per_draw_metrics[s]["hit_at_20"].append(is_hit_20)

            prec_5 = len(set(p5).intersection(actual_top20_set)) / 5.0
            prec_10 = len(set(p10).intersection(actual_top20_set)) / 10.0
            prec_20 = len(set(p20).intersection(actual_top20_set)) / 20.0

            per_draw_metrics[s]["prec_at_5"].append(prec_5)
            per_draw_metrics[s]["prec_at_10"].append(prec_10)
            per_draw_metrics[s]["prec_at_20"].append(prec_20)

            window_metrics[window_idx][s]["hit_at_20"].append(is_hit_20)
            window_metrics[window_idx][s]["hit_at_10"].append(is_hit_10)
            window_metrics[window_idx][s]["hit_at_5"].append(is_hit_5)
            window_metrics[window_idx][s]["prec_at_5"].append(prec_5)

            if lottery in lottery_metrics:
                lottery_metrics[lottery][s]["draws"] += 1
                if is_head:
                    lottery_metrics[lottery][s]["head"] += 1
                if is_hit_20:
                    lottery_metrics[lottery][s]["hit_at_20"] += 1
                lottery_metrics[lottery][s]["prec_at_5_sum"] += prec_5

            if shift in shift_metrics:
                shift_metrics[shift][s]["draws"] += 1
                if is_head:
                    shift_metrics[shift][s]["head"] += 1
                if is_hit_20:
                    shift_metrics[shift][s]["hit_at_20"] += 1
                shift_metrics[shift][s]["prec_at_5_sum"] += prec_5

    n = eval_draws_count

    results_table = []
    for s in all_evaluated_systems:
        m = per_draw_metrics[s]
        head_count = sum(m["head"])
        head_rate = round((head_count / n) * 100.0, 2)
        head_ci = wilson_score_interval(head_count, n)

        hit_20_count = sum(m["hit_at_20"])
        hit_20_rate = round((hit_20_count / n) * 100.0, 2)
        hit_20_ci = wilson_score_interval(hit_20_count, n)

        hit_10_count = sum(m["hit_at_10"])
        hit_10_rate = round((hit_10_count / n) * 100.0, 2)
        hit_10_ci = wilson_score_interval(hit_10_count, n)

        hit_5_count = sum(m["hit_at_5"])
        hit_5_rate = round((hit_5_count / n) * 100.0, 2)
        hit_5_ci = wilson_score_interval(hit_5_count, n)

        prec_5_mean = round(float(np.mean(m["prec_at_5"])), 4)
        prec_10_mean = round(float(np.mean(m["prec_at_10"])), 4)
        prec_20_mean = round(float(np.mean(m["prec_at_20"])), 4)

        results_table.append({
            "system_key": s,
            "label": system_labels[s],
            "category": "REFERENCIA" if s.startswith("REF-") else "ABLACION",
            "head_hits": head_count,
            "head_rate_pct": head_rate,
            "head_ci95": head_ci,
            "hit_rate_20_pct": hit_20_rate,
            "hit_rate_20_count": hit_20_count,
            "hit_rate_20_ci95": hit_20_ci,
            "hit_rate_10_pct": hit_10_rate,
            "hit_rate_10_count": hit_10_count,
            "hit_rate_10_ci95": hit_10_ci,
            "hit_rate_5_pct": hit_5_rate,
            "hit_rate_5_count": hit_5_count,
            "hit_rate_5_ci95": hit_5_ci,
            "precision_at_5": prec_5_mean,
            "precision_at_10": prec_10_mean,
            "precision_at_20": prec_20_mean
        })

    comparisons = [
        ("REF-FREQ-SIMPLE", "ML vs Frecuencia Simple"),
        ("REF-DELAY-SIMPLE", "ML vs Atraso Simple"),
        ("REF-MARKOV-PURO", "ML vs Markov Puro"),
        ("REF-BASELINE", "ML vs Baseline Estadistico"),
        ("REF-RANDOM", "ML vs Azar Monte Carlo"),
        ("ML-NO-MARKOV", "ML Completo vs ML sin Markov"),
        ("ML-FREQUENCY", "ML Completo vs ML solo Frecuencia"),
        ("ML-DELAY", "ML Completo vs ML solo Atraso"),
        ("ML-TREND", "ML Completo vs ML solo Tendencia"),
        ("ML-POSITION", "ML Completo vs ML solo Posicion")
    ]

    statistical_contrasts = {}
    ml_m = per_draw_metrics["ML-FULL"]

    for ref_key, comp_label in comparisons:
        ref_m = per_draw_metrics[ref_key]

        mcn_head_stat, mcn_head_p = mcnemar_test_paired(ml_m["head"], ref_m["head"])
        diff_head_abs = round((sum(ml_m["head"]) - sum(ref_m["head"])) / n * 100.0, 2)
        ref_head_count = sum(ref_m["head"])
        diff_head_rel = round(((sum(ml_m["head"]) - ref_head_count) / ref_head_count * 100.0), 2) if ref_head_count > 0 else 0.0

        mcn_hit20_stat, mcn_hit20_p = mcnemar_test_paired(ml_m["hit_at_20"], ref_m["hit_at_20"])
        diff_hit20_abs = round((sum(ml_m["hit_at_20"]) - sum(ref_m["hit_at_20"])) / n * 100.0, 2)
        ref_hit20_count = sum(ref_m["hit_at_20"])
        diff_hit20_rel = round(((sum(ml_m["hit_at_20"]) - ref_hit20_count) / ref_hit20_count * 100.0), 2) if ref_hit20_count > 0 else 0.0

        mcn_hit5_stat, mcn_hit5_p = mcnemar_test_paired(ml_m["hit_at_5"], ref_m["hit_at_5"])
        diff_hit5_abs = round((sum(ml_m["hit_at_5"]) - sum(ref_m["hit_at_5"])) / n * 100.0, 2)
        ref_hit5_count = sum(ref_m["hit_at_5"])
        diff_hit5_rel = round(((sum(ml_m["hit_at_5"]) - ref_hit5_count) / ref_hit5_count * 100.0), 2) if ref_hit5_count > 0 else 0.0

        t_stat_p5, t_p_p5, ci_p5 = paired_t_test(ml_m["prec_at_5"], ref_m["prec_at_5"])
        diff_p5_mean = round(float(np.mean(ml_m["prec_at_5"])) - float(np.mean(ref_m["prec_at_5"])), 4)

        statistical_contrasts[ref_key] = {
            "comparison_label": comp_label,
            "head": {
                "diff_abs_pct": f"{'+' if diff_head_abs > 0 else ''}{diff_head_abs}%",
                "diff_rel_pct": f"{'+' if diff_head_rel > 0 else ''}{diff_head_rel}%",
                "mcnemar_stat": mcn_head_stat,
                "p_value": mcn_head_p,
                "significant": mcn_head_p < 0.05
            },
            "hit_rate_at_20": {
                "diff_abs_pct": f"{'+' if diff_hit20_abs > 0 else ''}{diff_hit20_abs}%",
                "diff_rel_pct": f"{'+' if diff_hit20_rel > 0 else ''}{diff_hit20_rel}%",
                "mcnemar_stat": mcn_hit20_stat,
                "p_value": mcn_hit20_p,
                "significant": mcn_hit20_p < 0.05
            },
            "hit_rate_at_5": {
                "diff_abs_pct": f"{'+' if diff_hit5_abs > 0 else ''}{diff_hit5_abs}%",
                "diff_rel_pct": f"{'+' if diff_hit5_rel > 0 else ''}{diff_hit5_rel}%",
                "mcnemar_stat": mcn_hit5_stat,
                "p_value": mcn_hit5_p,
                "significant": mcn_hit5_p < 0.05
            },
            "precision_at_5": {
                "diff_mean": diff_p5_mean,
                "ci95_diff": ci_p5,
                "t_stat": t_stat_p5,
                "p_value": t_p_p5,
                "significant": t_p_p5 < 0.05
            }
        }

    robustness_summary = {}
    for s in all_evaluated_systems:
        w_rates_20 = [round((sum(window_metrics[w][s]["hit_at_20"]) / 100.0) * 100.0, 2) for w in range(4)]
        w_rates_5 = [round((sum(window_metrics[w][s]["hit_at_5"]) / 100.0) * 100.0, 2) for w in range(4)]
        w_prec_5 = [round(float(np.mean(window_metrics[w][s]["prec_at_5"])), 4) for w in range(4)]

        sigma_hit20 = round(float(np.std(w_rates_20, ddof=1)), 2)
        sigma_hit5 = round(float(np.std(w_rates_5, ddof=1)), 2)
        sigma_prec5 = round(float(np.std(w_prec_5, ddof=1)), 4)

        robustness_summary[s] = {
            "label": system_labels[s],
            "window_hit20_rates": w_rates_20,
            "sigma_hit20": sigma_hit20,
            "window_hit5_rates": w_rates_5,
            "sigma_hit5": sigma_hit5,
            "window_prec5": w_prec_5,
            "sigma_prec5": sigma_prec5
        }

    lottery_summary = {}
    for lot_name in ["ciudad", "provincia"]:
        lottery_summary[lot_name] = {}
        for s in all_evaluated_systems:
            d_count = lottery_metrics[lot_name][s]["draws"]
            h_count = lottery_metrics[lot_name][s]["head"]
            b20_count = lottery_metrics[lot_name][s]["hit_at_20"]
            p5_sum = lottery_metrics[lot_name][s]["prec_at_5_sum"]

            lottery_summary[lot_name][s] = {
                "draws": d_count,
                "head_hits": h_count,
                "head_pct": round((h_count / d_count) * 100.0, 2) if d_count > 0 else 0.0,
                "hit20_pct": round((b20_count / d_count) * 100.0, 2) if d_count > 0 else 0.0,
                "prec5_avg": round(p5_sum / d_count, 4) if d_count > 0 else 0.0
            }

    shift_summary = {}
    for s_name in ["previa", "primera", "matutina", "vespertina", "nocturna"]:
        shift_summary[s_name] = {}
        for s in all_evaluated_systems:
            d_count = shift_metrics[s_name][s]["draws"]
            h_count = shift_metrics[s_name][s]["head"]
            b20_count = shift_metrics[s_name][s]["hit_at_20"]
            p5_sum = shift_metrics[s_name][s]["prec_at_5_sum"]

            shift_summary[s_name][s] = {
                "draws": d_count,
                "head_hits": h_count,
                "head_pct": round((h_count / d_count) * 100.0, 2) if d_count > 0 else 0.0,
                "hit20_pct": round((b20_count / d_count) * 100.0, 2) if d_count > 0 else 0.0,
                "prec5_avg": round(p5_sum / d_count, 4) if d_count > 0 else 0.0
            }

    final_output = {
        "protocol": "ABLATION_TEST_V1",
        "freeze_set": "HISTORICAL_TEST_V1",
        "total_draws": n,
        "results_table": results_table,
        "statistical_contrasts": statistical_contrasts,
        "robustness_summary": robustness_summary,
        "lottery_summary": lottery_summary,
        "shift_summary": shift_summary
    }

    out_file = Path("./backend/ml_pipeline/ablation_results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)

    print(f"\n[+] Resultados completos de Ablacion guardados en {out_file}")

    print("\n=== TABLA COMPARATIVA GENERAL ===")
    print(f"{'Sistema':<36} | {'Cabeza':<12} | {'HitRate@20':<14} | {'HitRate@10':<14} | {'HitRate@5':<14} | {'Prec@5':<8}")
    print("-" * 110)
    for r in results_table:
        print(f"{r['label']:<36} | {r['head_hits']} ({r['head_rate_pct']}%) | {r['hit_rate_20_count']} ({r['hit_rate_20_pct']}%) | {r['hit_rate_10_count']} ({r['hit_rate_10_pct']}%) | {r['hit_rate_5_count']} ({r['hit_rate_5_pct']}%) | {r['precision_at_5']}")

    print("\n=== VALOR INCREMENTAL DE ML-FULL vs SISTEMAS DE REFERENCIA ===")
    for ref_key in ["REF-FREQ-SIMPLE", "REF-DELAY-SIMPLE", "REF-MARKOV-PURO", "REF-BASELINE", "REF-RANDOM"]:
        c = statistical_contrasts[ref_key]
        print(f"-> {c['comparison_label']}:")
        print(f"   HitRate@20: dif={c['hit_rate_at_20']['diff_abs_pct']} (rel={c['hit_rate_at_20']['diff_rel_pct']}), McNemar p={c['hit_rate_at_20']['p_value']} ({'SIG' if c['hit_rate_at_20']['significant'] else 'NO SIG'})")
        print(f"   HitRate@5 : dif={c['hit_rate_at_5']['diff_abs_pct']} (rel={c['hit_rate_at_5']['diff_rel_pct']}), McNemar p={c['hit_rate_at_5']['p_value']} ({'SIG' if c['hit_rate_at_5']['significant'] else 'NO SIG'})")
        print(f"   Prec@5    : dif={c['precision_at_5']['diff_mean']}, t-test p={c['precision_at_5']['p_value']} ({'SIG' if c['precision_at_5']['significant'] else 'NO SIG'}), CI95={c['precision_at_5']['ci95_diff']}")

    print("\n=== IMPACTO DE LA ABLACION DE FEATURES (vs ML-FULL) ===")
    for ab_key in ["ML-NO-MARKOV", "ML-FREQUENCY", "ML-DELAY", "ML-TREND", "ML-POSITION"]:
        c = statistical_contrasts[ab_key]
        print(f"-> {c['comparison_label']}:")
        print(f"   HitRate@20: dif={c['hit_rate_at_20']['diff_abs_pct']}, McNemar p={c['hit_rate_at_20']['p_value']} ({'SIG' if c['hit_rate_at_20']['significant'] else 'NO SIG'})")
        print(f"   HitRate@5 : dif={c['hit_rate_at_5']['diff_abs_pct']}, McNemar p={c['hit_rate_at_5']['p_value']} ({'SIG' if c['hit_rate_at_5']['significant'] else 'NO SIG'})")
        print(f"   Prec@5    : dif={c['precision_at_5']['diff_mean']}, t-test p={c['precision_at_5']['p_value']} ({'SIG' if c['precision_at_5']['significant'] else 'NO SIG'})")

    return final_output

if __name__ == "__main__":
    run_ablation_engine()
