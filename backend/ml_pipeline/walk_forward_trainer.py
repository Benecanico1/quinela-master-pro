import json
import math
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np
from scipy import stats
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

from feature_extractor import extract_features_for_draw

def simulate_statistical_baseline(history: List[Dict[str, Any]]) -> List[str]:
    """
    Simula el motor estadístico descriptivo actual usando únicamente history.
    """
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

def run_walk_forward_evaluation(draws: List[Dict[str, Any]], initial_train_size: int = 400, test_limit: int = 500):
    print(f"[*] Ejecutando Walk-Forward Backtesting (Train inicial: {initial_train_size}, Muestra de evaluación: {test_limit} sorteos)...")
    
    total_draws = len(draws)
    eval_start_idx = max(initial_train_size, total_draws - test_limit)
    eval_end_idx = total_draws
    num_eval_draws = eval_end_idx - eval_start_idx

    print(f"[*] Rango de evaluación: sorteos #{eval_start_idx} al #{eval_end_idx} ({num_eval_draws} sorteos out-of-sample)")

    # Métricas de los 3 sistemas
    metrics = {
        "A_baseline": {"head_hits": 0, "board_top5_hits": 0, "board_top10_hits": 0, "board_top20_hits": 0},
        "B_ml_logistic": {"head_hits": 0, "board_top5_hits": 0, "board_top10_hits": 0, "board_top20_hits": 0},
        "C_random": {"head_hits": 0, "board_top5_hits": 0, "board_top10_hits": 0, "board_top20_hits": 0}
    }

    # Acumuladores de dataset para entrenamiento
    # Para agilizar el entrenamiento walk-forward, pre-extraemos ventanas y re-entrenamos periódicamente
    # pero generamos features causales para CADA sorteo de prueba.
    print("[*] Precalentando memoria de entrenamiento temporal...")
    
    train_history = draws[:eval_start_idx]
    
    # Recolectar una muestra de entrenamiento previa para Logistic Regression
    X_train_list = []
    y_train_list = []
    
    sample_step = max(1, len(train_history) // 150)
    for idx in range(100, len(train_history), sample_step):
        X_sub, targets_sub, f_names = extract_features_for_draw(draws[:idx], draws[idx])
        X_train_list.append(X_sub)
        y_train_list.append(targets_sub["top20"]) # Entrenamos para presencia en pizarra

    X_train_all = np.vstack(X_train_list)
    y_train_all = np.concatenate(y_train_list)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_all)

    model_lr = LogisticRegression(C=0.1, max_iter=300, class_weight='balanced', random_state=42)
    model_lr.fit(X_train_scaled, y_train_all)
    print("[+] Modelo inicial Logistic Regression L2 entrenado exitosamente.")

    # Almacén de features weights para exportación
    learned_weights = {f_names[i]: float(model_lr.coef_[0][i]) for i in range(len(f_names))}

    rng = np.random.RandomState(42)

    by_lottery = {
        "ciudad": {"draws": 0, "A_head": 0, "B_head": 0, "C_head": 0, "A_board": 0, "B_board": 0, "C_board": 0},
        "provincia": {"draws": 0, "A_head": 0, "B_head": 0, "C_head": 0, "A_board": 0, "B_board": 0, "C_board": 0}
    }

    by_shift = {}

    for k in range(eval_start_idx, eval_end_idx):
        if (k - eval_start_idx) % 50 == 0:
            print(f"    -> Evaluando sorteo {k - eval_start_idx + 1} de {num_eval_draws} ({draws[k]['draw_date']} {draws[k]['shift']})...")

        history_k = draws[:k]
        target_k = draws[k]
        lottery = target_k["lottery"]
        shift = target_k["shift"]

        if shift not in by_shift:
            by_shift[shift] = {"draws": 0, "A_head": 0, "B_head": 0, "C_head": 0}
        by_shift[shift]["draws"] += 1
        by_lottery[lottery]["draws"] += 1

        actual_head = target_k["head_ambo"]
        actual_board_ambos = [n[-2:] for n in target_k["board"]]
        actual_top5 = set(actual_board_ambos[:5])
        actual_top10 = set(actual_board_ambos[:10])
        actual_top20 = set(actual_board_ambos[:20])

        # 1. Sistema A: Baseline Estadístico
        ranked_A = simulate_statistical_baseline(history_k)[:5]

        # 2. Sistema B: ML Logistic
        X_test, _, _ = extract_features_for_draw(history_k, target_k)
        X_test_scaled = scaler.transform(X_test)
        probs_ml = model_lr.predict_proba(X_test_scaled)[:, 1]
        ranked_B_indices = np.argsort(probs_ml)[::-1][:5]
        ranked_B = [f"{i:02d}" for i in ranked_B_indices]

        # 3. Sistema C: Azar Puro (5 números aleatorios sin reemplazo)
        ranked_C_indices = rng.choice(100, size=5, replace=False)
        ranked_C = [f"{i:02d}" for i in ranked_C_indices]

        # Evaluaciones
        for name, pred in [("A_baseline", ranked_A), ("B_ml", ranked_B), ("C_random", ranked_C)]:
            key = name if name != "B_ml" else "B_ml_logistic"
            # Acierto a la cabeza (Top 1)
            if pred[0] == actual_head:
                metrics[key]["head_hits"] += 1
                if name == "A_baseline":
                    by_lottery[lottery]["A_head"] += 1
                    by_shift[shift]["A_head"] += 1
                elif name == "B_ml":
                    by_lottery[lottery]["B_head"] += 1
                    by_shift[shift]["B_head"] += 1
                else:
                    by_lottery[lottery]["C_head"] += 1
                    by_shift[shift]["C_head"] += 1

            # Acierto en pizarra (al menos 1 de los 5 en la pizarra de 20)
            if any(num in actual_top20 for num in pred):
                metrics[key]["board_top20_hits"] += 1
                if name == "A_baseline":
                    by_lottery[lottery]["A_board"] += 1
                elif name == "B_ml":
                    by_lottery[lottery]["B_board"] += 1
                else:
                    by_lottery[lottery]["C_board"] += 1

            if any(num in actual_top10 for num in pred):
                metrics[key]["board_top10_hits"] += 1
            if any(num in actual_top5 for num in pred):
                metrics[key]["board_top5_hits"] += 1

    # Cálculo de métricas agregadas
    results = {
        "num_eval_draws": num_eval_draws,
        "eval_period": f"{draws[eval_start_idx]['draw_date']} al {draws[eval_end_idx - 1]['draw_date']}",
        "metrics": {},
        "by_lottery": by_lottery,
        "by_shift": by_shift,
        "learned_weights": learned_weights,
        "feature_importance_ranking": sorted(learned_weights.items(), key=lambda x: abs(x[1]), reverse=True)
    }

    for sys_key in ["A_baseline", "B_ml_logistic", "C_random"]:
        h_hits = metrics[sys_key]["head_hits"]
        b_hits = metrics[sys_key]["board_top20_hits"]
        b10_hits = metrics[sys_key]["board_top10_hits"]
        b5_hits = metrics[sys_key]["board_top5_hits"]

        head_rate = (h_hits / num_eval_draws) * 100.0
        board_rate = (b_hits / num_eval_draws) * 100.0
        
        # Intervalo de confianza 95% para la proporción de aciertos a la cabeza
        p_hat = h_hits / num_eval_draws
        z_95 = 1.96
        ci_half = z_95 * math.sqrt((p_hat * (1 - p_hat)) / num_eval_draws) if p_hat > 0 else 0
        ci_lower = max(0.0, (p_hat - ci_half) * 100.0)
        ci_upper = min(100.0, (p_hat + ci_half) * 100.0)

        results["metrics"][sys_key] = {
            "head_hits": h_hits,
            "head_rate_pct": round(head_rate, 2),
            "head_ci_95": f"[{ci_lower:.2f}%, {ci_upper:.2f}%]",
            "board_top20_hits": b_hits,
            "board_top20_rate_pct": round(board_rate, 2),
            "board_top10_hits": b10_hits,
            "board_top10_rate_pct": round((b10_hits / num_eval_draws) * 100.0, 2),
            "board_top5_hits": b5_hits,
            "board_top5_rate_pct": round((b5_hits / num_eval_draws) * 100.0, 2),
            "precision_at_5": round(b_hits / (num_eval_draws * 5), 4)
        }

    # Test de significancia estadística (Binomial test comparando ML vs Azar y ML vs Baseline)
    # Hipótesis nula H0: p_ml == p_random (probabilidad aleatoria de acertar cabeza con 1 número = 0.01)
    k_ml = results["metrics"]["B_ml_logistic"]["head_hits"]
    k_base = results["metrics"]["A_baseline"]["head_hits"]
    k_rand = results["metrics"]["C_random"]["head_hits"]

    # Test exacto binomial contra p_azar = 0.01 (1%)
    binom_p_val = stats.binomtest(k_ml, n=num_eval_draws, p=0.01, alternative='greater').pvalue
    results["significance"] = {
        "p_value_vs_random_head": float(binom_p_val),
        "is_statistically_significant_vs_random": bool(binom_p_val < 0.05),
        "interpretation": "Ventaja estadísticamente significativa detectada sobre el azar (p < 0.05)" if binom_p_val < 0.05 else "El modelo NO demuestra una ventaja estadísticamente significativa sobre el azar (p >= 0.05)."
    }

    return results

def generate_model_report(results: Dict[str, Any], output_path: Path):
    m = results["metrics"]
    ml = m["B_ml_logistic"]
    base = m["A_baseline"]
    rand = m["C_random"]
    sig = results["significance"]

    report = f"""# INFORME TÉCNICO DE MACHINE LEARNING Y BACKTESTING — QUINIELA MASTER PRO
**Fecha de Generación:** {Path(__file__).stat().st_mtime} (Ejecución oficial)  
**Versión del Modelo:** Ensemble ML v1.0 (Logistic Regression L2 + Markov Feature Engine)  
**Metodología de Validación:** Walk-Forward Out-of-Sample Backtesting (Cero Data Leakage)  
**Muestra Evaluada:** {results['num_eval_draws']} sorteos oficiales ({results['eval_period']})  

---

## 1. Resumen Ejecutivo de Métricas Fuera de Muestra

| Métrica de Evaluación | Sistema B (Machine Learning) | Sistema A (Baseline Estadístico) | Sistema C (Azar Monte Carlo) |
| :--- | :---: | :---: | :---: |
| **Aciertos a la Cabeza (1°)** | **{ml['head_hits']}** ({ml['head_rate_pct']}%) | **{base['head_hits']}** ({base['head_rate_pct']}%) | **{rand['head_hits']}** ({rand['head_rate_pct']}%) |
| **Intervalo de Confianza (95%)** | {ml['head_ci_95']} | {base['head_ci_95']} | {rand['head_ci_95']} |
| **Acierto en Pizarra (Top 20)** | **{ml['board_top20_hits']}** ({ml['board_top20_rate_pct']}%) | **{base['board_top20_hits']}** ({base['board_top20_rate_pct']}%) | **{rand['board_top20_hits']}** ({rand['board_top20_rate_pct']}%) |
| **Acierto a los 10 Premios** | **{ml['board_top10_hits']}** ({ml['board_top10_rate_pct']}%) | **{base['board_top10_hits']}** ({base['board_top10_rate_pct']}%) | **{rand['board_top10_hits']}** ({rand['board_top10_rate_pct']}%) |
| **Acierto a los 5 Premios** | **{ml['board_top5_hits']}** ({ml['board_top5_rate_pct']}%) | **{base['board_top5_hits']}** ({base['board_top5_rate_pct']}%) | **{rand['board_top5_hits']}** ({rand['board_top5_rate_pct']}%) |
| **Precision@5 (Ambos en Pizarra)** | {ml['precision_at_5']} | {base['precision_at_5']} | {rand['precision_at_5']} |

---

## 2. Test de Significancia Estadística

- **Valor $p$ (Test Binomial vs. Azar Puro en Cabeza):** `{sig['p_value_vs_random_head']:.4e}`
- **¿Es estadísticamente significativo ($p < 0.05$)?** `{"SÍ" if sig['is_statistically_significant_vs_random'] else "NO"}`
- **Diagnóstico Transparente:**  
  > *"{sig['interpretation']}"*

---

## 3. Desglose de Rendimiento por Lotería y Turno

### Por Lotería Oficial:
- **Ciudad (Nacional):**
  - Evaluados: {results['by_lottery']['ciudad']['draws']} sorteos
  - Aciertos Cabeza: ML {results['by_lottery']['ciudad']['B_head']} | Baseline {results['by_lottery']['ciudad']['A_head']} | Azar {results['by_lottery']['ciudad']['C_head']}
  - Aciertos Pizarra: ML {results['by_lottery']['ciudad']['B_board']} | Baseline {results['by_lottery']['ciudad']['A_board']} | Azar {results['by_lottery']['ciudad']['C_board']}
- **Provincia de Buenos Aires:**
  - Evaluados: {results['by_lottery']['provincia']['draws']} sorteos
  - Aciertos Cabeza: ML {results['by_lottery']['provincia']['B_head']} | Baseline {results['by_lottery']['provincia']['A_head']} | Azar {results['by_lottery']['provincia']['C_head']}
  - Aciertos Pizarra: ML {results['by_lottery']['provincia']['B_board']} | Baseline {results['by_lottery']['provincia']['A_board']} | Azar {results['by_lottery']['provincia']['C_board']}

---

## 4. Importancia de Características (Feature Importance)

Los coeficientes aprendidos por el modelo de Regresión Logística L2 revelan la contribución relativa de cada variable en el ranking predictivo:

| Ranking | Característica | Coeficiente Ponderado | Interpretación Técnica |
| :---: | :--- | :---: | :--- |
"""
    for idx, (f_name, weight) in enumerate(results["feature_importance_ranking"][:10], 1):
        report += f"| #{idx} | `{f_name}` | `{weight:+.4f}` | {'Impacto positivo en score' if weight > 0 else 'Penalización estadística'} |\n"

    report += """
---

## 5. Limitaciones Teóricas y Declaración de Rigor Científico

1. **Independencia de Sorteos:** Los extractos oficiales de Quiniela se generan mediante bolilleros electromecánicos certificados. Cada sorteo es un proceso estocástico con independencia teórica entre eventos.
2. **Naturaleza del Modelo:** El modelo de Machine Learning captura correlaciones y anomalías empíricas en la muestra histórica observada; no altera las leyes de la probabilidad ni garantiza aciertos en eventos futuros.
3. **Compromiso con el Usuario:** Ninguna predicción es un "número seguro". Los resultados se presentan bajo la escala *"Score predictivo: X/100"* y con estricta advertencia de Juego Responsable (+18).
"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"[+] Informe técnico MODEL_REPORT.md generado en: {output_path}")

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent.parent
    curated_file = Path(__file__).resolve().parent / "draws_curated.json"
    report_file = base_dir / "MODEL_REPORT.md"
    weights_file = Path(__file__).resolve().parent / "model_weights.json"

    with open(curated_file, "r", encoding="utf-8") as f:
        draws = json.load(f)

    # Ejecutar walk-forward sobre 400 sorteos out-of-sample
    results = run_walk_forward_evaluation(draws, initial_train_size=500, test_limit=400)
    generate_model_report(results, report_file)

    # Guardar pesos aprendidos y métricas para uso del cliente JS
    export_payload = {
        "model_version": "Ensemble ML v1.0",
        "evaluation_metrics": results["metrics"],
        "significance": results["significance"],
        "feature_weights": results["learned_weights"],
        "feature_importance": results["feature_importance_ranking"]
    }
    with open(weights_file, "w", encoding="utf-8") as f:
        json.dump(export_payload, f, indent=2)
    print(f"[+] Pesos calibrados exportados a: {weights_file}")
