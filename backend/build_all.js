const fs = require('fs');

const stats_engine_code = `import numpy as np
from scipy import stats
from typing import List, Dict, Any, Optional
from database import get_all_draws
from seed_data import SIGNIFICADOS_QUINIELA

def compute_frequency_and_delays(lottery: Optional[str] = "all", shift: Optional[str] = "all", target: str = "head", start_date: Optional[str] = None, end_date: Optional[str] = None):
    draws = get_all_draws(lottery=lottery, shift=shift, start_date=start_date, end_date=end_date)
    if not draws:
        return {"error": "No data found for given criteria", "total_draws": 0}

    total_draws = len(draws)
    history_appearances = {f"{i:02d}": [] for i in range(100)}
    
    for idx, d in enumerate(draws):
        if target == "head":
            ambo = d["head_ambo"]
            history_appearances[ambo].append(idx)
        else:
            draw_ambos = set(d[f"p{p}"][-2:] for p in range(1, 21))
            for a in draw_ambos:
                history_appearances[a].append(idx)

    expected_freq = (total_draws / 100.0) if target == "head" else (total_draws * 20.0 / 100.0)
    std_expected = np.sqrt(total_draws * (1/100.0) * (99/100.0)) if target == "head" else np.sqrt(total_draws * (20/100.0) * (80/100.0))
    
    results = []
    observed_counts = []
    
    for i in range(100):
        num_str = f"{i:02d}"
        app_list = history_appearances[num_str]
        freq = len(app_list)
        observed_counts.append(freq)
        
        if app_list:
            current_delay = (total_draws - 1) - app_list[-1]
            intervals = []
            if len(app_list) > 1:
                for k in range(len(app_list) - 1):
                    intervals.append(app_list[k+1] - app_list[k])
                avg_delay = round(float(np.mean(intervals)), 2)
                max_delay = int(max(intervals))
            else:
                avg_delay = float(app_list[0]) if app_list[0] > 0 else 1.0
                max_delay = app_list[0]
            last_date = draws[app_list[-1]]["draw_date"]
            last_shift = draws[app_list[-1]]["shift"]
            last_lottery = draws[app_list[-1]]["lottery"]
        else:
            current_delay = total_draws
            avg_delay = float(total_draws)
            max_delay = total_draws
            last_date = "Nunca en el periodo"
            last_shift = "-"
            last_lottery = "-"

        z_score = round(float((freq - expected_freq) / (std_expected if std_expected > 0 else 1.0)), 3)
        delay_ratio = round(float(current_delay / (avg_delay if avg_delay > 0 else 1.0)), 2)
        
        if delay_ratio >= 2.0 or current_delay >= (avg_delay * 1.8):
            status = "CRITICO_ATRASADO"
        elif delay_ratio >= 1.3:
            status = "MADURANDO"
        elif freq >= (expected_freq + 1.5 * std_expected):
            status = "CALIENTE_FRECUENTE"
        elif freq <= (expected_freq - 1.5 * std_expected):
            status = "FRIO"
        else:
            status = "NORMAL"

        results.append({
            "number": num_str,
            "significado": SIGNIFICADOS_QUINIELA.get(num_str, ""),
            "frequency": freq,
            "percentage": round(float(freq / (total_draws if target == 'head' else total_draws * 20) * 100), 2),
            "expected_freq": round(expected_freq, 1),
            "current_delay": current_delay,
            "avg_delay": avg_delay,
            "max_delay": max_delay,
            "delay_ratio": delay_ratio,
            "z_score": z_score,
            "status": status,
            "last_seen": {
                "date": last_date,
                "shift": last_shift,
                "lottery": last_lottery
            }
        })

    chi2_stat, p_val = stats.chisquare(observed_counts, f_exp=[expected_freq]*100)
    hot_numbers = sorted(results, key=lambda x: x["frequency"], reverse=True)[:10]
    cold_numbers = sorted(results, key=lambda x: x["frequency"])[:10]
    most_delayed = sorted(results, key=lambda x: x["current_delay"], reverse=True)[:10]
    highest_delay_ratio = sorted(results, key=lambda x: x["delay_ratio"], reverse=True)[:10]

    return {
        "total_draws": total_draws,
        "target": target,
        "lottery": lottery,
        "shift": shift,
        "expected_frequency_per_num": round(expected_freq, 2),
        "chi2_test": {
            "statistic": round(float(chi2_stat), 3),
            "p_value": round(float(p_val), 4),
            "interpretation": "Distribución estadísticamente uniforme" if p_val > 0.05 else "Anomalías significativas detectadas"
        },
        "all_numbers": results,
        "rankings": {
            "hot_numbers": hot_numbers,
            "cold_numbers": cold_numbers,
            "most_delayed": most_delayed,
            "highest_delay_ratio": highest_delay_ratio
        }
    }
`;

const pattern_engine_code = `import numpy as np
from typing import List, Dict, Any, Optional
from database import get_all_draws

def analyze_patterns(lottery: Optional[str] = "all", shift: Optional[str] = "all", start_date: Optional[str] = None, end_date: Optional[str] = None):
    draws = get_all_draws(lottery=lottery, shift=shift, start_date=start_date, end_date=end_date)
    if not draws:
        return {"error": "No draws available"}

    total = len(draws)
    parity_counts = {"PAR_PAR": 0, "PAR_IMPAR": 0, "IMPAR_PAR": 0, "IMPAR_IMPAR": 0}
    high_low_counts = {"BAJO_00_49": 0, "ALTO_50_99": 0}
    sum_distribution = {s: 0 for s in range(19)}
    decade_counts = {f"{d}0s": 0 for d in range(10)}
    ending_counts = {str(u): 0 for u in range(10)}
    centena_counts = {str(c): 0 for c in range(10)}

    for d in draws:
        ambo = d["head_ambo"]
        centena = d["head_centena"]
        d1, d2 = int(ambo[0]), int(ambo[1])
        
        p_dec = "PAR" if d1 % 2 == 0 else "IMPAR"
        p_uni = "PAR" if d2 % 2 == 0 else "IMPAR"
        parity_counts[f"{p_dec}_{p_uni}"] += 1
        
        if int(ambo) <= 49:
            high_low_counts["BAJO_00_49"] += 1
        else:
            high_low_counts["ALTO_50_99"] += 1
            
        s = d1 + d2
        sum_distribution[s] += 1
        decade_counts[f"{d1}0s"] += 1
        ending_counts[str(d2)] += 1
        centena_counts[str(centena[0])] += 1

    sum_analysis = []
    for s in range(19):
        observed = sum_distribution[s]
        theo_ways = min(s + 1, 19 - s)
        theo_expected = total * (theo_ways / 100.0)
        diff = observed - theo_expected
        sum_analysis.append({
            "sum": s,
            "observed": observed,
            "expected": round(theo_expected, 1),
            "percentage": round(observed / total * 100, 2),
            "theoretical_pct": float(theo_ways),
            "difference": round(diff, 1)
        })

    return {
        "total_draws": total,
        "parity": [
            {"pattern": "Par - Par (ej: 24, 88)", "count": parity_counts["PAR_PAR"], "percentage": round(parity_counts["PAR_PAR"]/total*100, 2), "expected_pct": 25.0},
            {"pattern": "Par - Impar (ej: 27, 41)", "count": parity_counts["PAR_IMPAR"], "percentage": round(parity_counts["PAR_IMPAR"]/total*100, 2), "expected_pct": 25.0},
            {"pattern": "Impar - Par (ej: 36, 72)", "count": parity_counts["IMPAR_PAR"], "percentage": round(parity_counts["IMPAR_PAR"]/total*100, 2), "expected_pct": 25.0},
            {"pattern": "Impar - Impar (ej: 13, 95)", "count": parity_counts["IMPAR_IMPAR"], "percentage": round(parity_counts["IMPAR_IMPAR"]/total*100, 2), "expected_pct": 25.0}
        ],
        "high_low": [
            {"category": "Bajos (00-49)", "count": high_low_counts["BAJO_00_49"], "percentage": round(high_low_counts["BAJO_00_49"]/total*100, 2), "expected_pct": 50.0},
            {"category": "Altos (50-99)", "count": high_low_counts["ALTO_50_99"], "percentage": round(high_low_counts["ALTO_50_99"]/total*100, 2), "expected_pct": 50.0}
        ],
        "decades": [
            {"decade": k, "count": v, "percentage": round(v/total*100, 2), "expected_pct": 10.0}
            for k, v in sorted(decade_counts.items())
        ],
        "endings": [
            {"ending": f"Termina en {k}", "digit": k, "count": v, "percentage": round(v/total*100, 2), "expected_pct": 10.0}
            for k, v in sorted(ending_counts.items())
        ],
        "centenas": [
            {"centena": f"Centena {k}xx", "digit": k, "count": v, "percentage": round(v/total*100, 2), "expected_pct": 10.0}
            for k, v in sorted(centena_counts.items())
        ],
        "sums": sum_analysis
    }

def analyze_cross_lottery():
    all_draws = get_all_draws(limit=5000)
    by_date = {}
    for d in all_draws:
        date_str = d["draw_date"]
        if date_str not in by_date:
            by_date[date_str] = []
        by_date[date_str].append(d)
        
    same_day_head_matches = []
    board_to_head_jumps = []
    
    for date_str, d_list in by_date.items():
        ciudad_draws = [d for d in d_list if d["lottery"] == "ciudad"]
        prov_draws = [d for d in d_list if d["lottery"] == "provincia"]
        
        c_heads = set(d["head_ambo"] for d in ciudad_draws)
        p_heads = set(d["head_ambo"] for d in prov_draws)
        
        common_heads = c_heads.intersection(p_heads)
        for num in common_heads:
            same_day_head_matches.append({
                "date": date_str,
                "number": num,
                "detail": f"El ambo {num} salió a la cabeza en ambas loterías el mismo día"
            })
            
        all_board_ambos_early = set()
        for d in sorted(d_list, key=lambda x: x["id"]):
            head = d["head_ambo"]
            if head in all_board_ambos_early:
                board_to_head_jumps.append({
                    "date": date_str,
                    "number": head,
                    "lottery": d["lottery"],
                    "shift": d["shift"],
                    "note": f"El ambo {head} salió previamente en los 20 y saltó a la cabeza en {d['shift']} de {d['lottery']}."
                })
            for pos in range(1, 21):
                all_board_ambos_early.add(d[f"p{pos}"][-2:])
                
    return {
        "same_day_head_coincidences": len(same_day_head_matches),
        "recent_same_day_matches": same_day_head_matches[-10:],
        "board_to_head_jumps_count": len(board_to_head_jumps),
        "recent_jumps": board_to_head_jumps[-15:]
    }
`;

const markov_model_code = `import numpy as np
from typing import List, Dict, Any, Optional
from database import get_all_draws

def compute_markov_transitions(lottery: Optional[str] = "all", shift: Optional[str] = "all"):
    draws = get_all_draws(lottery=lottery, shift=shift)
    if len(draws) < 2:
        return {"error": "Insufficient draws"}

    ending_transitions = np.zeros((10, 10), dtype=int)
    decade_transitions = np.zeros((10, 10), dtype=int)
    ambo_transitions = np.zeros((100, 100), dtype=int)

    for i in range(len(draws) - 1):
        cur_ambo = draws[i]["head_ambo"]
        nxt_ambo = draws[i+1]["head_ambo"]
        
        cur_d1, cur_d2 = int(cur_ambo[0]), int(cur_ambo[1])
        nxt_d1, nxt_d2 = int(nxt_ambo[0]), int(nxt_ambo[1])
        
        decade_transitions[cur_d1][nxt_d1] += 1
        ending_transitions[cur_d2][nxt_d2] += 1
        ambo_transitions[int(cur_ambo)][int(nxt_ambo)] += 1

    def normalize_matrix(mat):
        row_sums = mat.sum(axis=1, keepdims=True)
        row_sums[row_sums == 0] = 1
        return (mat / row_sums).round(4)

    prob_endings = normalize_matrix(ending_transitions)
    prob_decades = normalize_matrix(decade_transitions)

    last_draw = draws[-1]
    last_ambo = last_draw["head_ambo"]
    last_d1 = int(last_ambo[0])
    last_d2 = int(last_ambo[1])
    last_idx = int(last_ambo)

    next_ending_probs = [
        {"ending": f"Terminación {u}", "digit": u, "probability": float(prob_endings[last_d2][u]), "count": int(ending_transitions[last_d2][u])}
        for u in range(10)
    ]
    next_ending_probs = sorted(next_ending_probs, key=lambda x: x["probability"], reverse=True)

    next_decade_probs = [
        {"decade": f"Decena {d}0s", "digit": d, "probability": float(prob_decades[last_d1][d]), "count": int(decade_transitions[last_d1][d])}
        for d in range(10)
    ]
    next_decade_probs = sorted(next_decade_probs, key=lambda x: x["probability"], reverse=True)

    last_ambo_row = ambo_transitions[last_idx]
    top_ambo_indices = np.argsort(last_ambo_row)[::-1][:10]
    top_ambos_markov = [
        {
            "number": f"{idx:02d}",
            "historical_transitions": int(last_ambo_row[idx]),
            "conditional_score": round(float(last_ambo_row[idx] / (last_ambo_row.sum() if last_ambo_row.sum() > 0 else 1)), 4)
        }
        for idx in top_ambo_indices if last_ambo_row[idx] > 0
    ]

    return {
        "last_draw_head": last_ambo,
        "last_draw_info": {
            "date": last_draw["draw_date"],
            "shift": last_draw["shift"],
            "lottery": last_draw["lottery"]
        },
        "next_ending_probabilities": next_ending_probs,
        "next_decade_probabilities": next_decade_probs,
        "top_ambos_markov": top_ambos_markov,
        "ending_matrix": prob_endings.tolist(),
        "decade_matrix": prob_decades.tolist()
    }
`;

const predictor_code = `import numpy as np
from typing import List, Dict, Any, Optional
from database import get_all_draws
from stats_engine import compute_frequency_and_delays
from pattern_engine import analyze_patterns
from markov_model import compute_markov_transitions
from seed_data import SIGNIFICADOS_QUINIELA

def calculate_composite_predictions(lottery: Optional[str] = "all", shift: Optional[str] = "all", top_k: int = 10):
    stats_data = compute_frequency_and_delays(lottery=lottery, shift=shift, target="head")
    stats_all20 = compute_frequency_and_delays(lottery=lottery, shift=shift, target="all20")
    markov_data = compute_markov_transitions(lottery=lottery, shift=shift)
    
    if "error" in stats_data:
        return {"error": stats_data["error"]}

    total_draws = stats_data["total_draws"]
    all_numbers_stats = {item["number"]: item for item in stats_data["all_numbers"]}
    all20_stats = {item["number"]: item for item in stats_all20["all_numbers"]}

    markov_dict = {}
    if "top_ambos_markov" in markov_data:
        for m in markov_data["top_ambos_markov"]:
            markov_dict[m["number"]] = m["conditional_score"]

    ending_pref = {item["digit"]: item["probability"] for item in markov_data.get("next_ending_probabilities", [])}
    decade_pref = {item["digit"]: item["probability"] for item in markov_data.get("next_decade_probabilities", [])}

    scored_candidates = []

    for i in range(100):
        num_str = f"{i:02d}"
        item = all_numbers_stats[num_str]
        item20 = all20_stats.get(num_str, {})
        
        d1 = int(num_str[0])
        d2 = int(num_str[1])

        delay_ratio = item["delay_ratio"]
        if delay_ratio >= 2.0:
            delay_score = 95.0
        elif delay_ratio >= 1.4:
            delay_score = 80.0 + (delay_ratio - 1.4) * 25.0
        elif delay_ratio >= 1.0:
            delay_score = 60.0 + (delay_ratio - 1.0) * 50.0
        else:
            delay_score = max(10.0, delay_ratio * 50.0)
            
        freq20 = item20.get("frequency", 0)
        exp20 = item20.get("expected_freq", 1)
        res_ratio = freq20 / exp20 if exp20 > 0 else 1.0
        resonance_score = min(100.0, max(20.0, res_ratio * 70.0))

        m_prob = markov_dict.get(num_str, 0.0)
        e_prob = ending_pref.get(d2, 0.1)
        dec_prob = decade_pref.get(d1, 0.1)
        markov_score = min(100.0, (m_prob * 300.0) + (e_prob * 250.0) + (dec_prob * 250.0))

        s = d1 + d2
        if 7 <= s <= 11:
            sum_score = 90.0
        elif 5 <= s <= 13:
            sum_score = 75.0
        else:
            sum_score = 45.0
            
        pattern_score = sum_score

        freq_ratio = item["frequency"] / (item["expected_freq"] if item["expected_freq"] > 0 else 1)
        freq_score = min(100.0, max(20.0, freq_ratio * 70.0))

        composite_score = (
            0.25 * delay_score +
            0.20 * resonance_score +
            0.20 * markov_score +
            0.20 * freq_score +
            0.15 * pattern_score
        )

        composite_score = round(float(composite_score), 1)

        reasons = []
        if delay_ratio >= 1.4:
            reasons.append(f"Atraso crítico ({item['current_delay']} sorteos sin salir a la cabeza)")
        if e_prob > 0.12:
            reasons.append(f"Alta transición para terminación {d2} ({round(e_prob*100,1)}%)")
        if res_ratio > 1.15:
            reasons.append(f"Fuerte presencia en los 20 premios ({freq20} salidas)")
        if 7 <= s <= 11:
            reasons.append(f"Suma óptima ({s}) en campana gaussiana")
        if not reasons:
            reasons.append("Equilibrio armónico en la curva de frecuencias")

        scored_candidates.append({
            "number": num_str,
            "significado": SIGNIFICADOS_QUINIELA.get(num_str, ""),
            "composite_score": composite_score,
            "delay_score": round(delay_score, 1),
            "markov_score": round(markov_score, 1),
            "resonance_score": round(resonance_score, 1),
            "current_delay": item["current_delay"],
            "avg_delay": item["avg_delay"],
            "reasons": reasons,
            "suggested_centenas": [f"{c}{num_str}" for c in [3, 7, 9]],
            "suggested_millar": [f"{m}{c}{num_str}" for m, c in [(2, 4), (5, 8), (8, 3)]]
        })

    top_candidates = sorted(scored_candidates, key=lambda x: x["composite_score"], reverse=True)[:top_k]

    suggested_redoblonas = []
    for a_idx in range(min(5, len(top_candidates))):
        for b_idx in range(a_idx + 1, min(6, len(top_candidates))):
            num_a = top_candidates[a_idx]
            num_b = top_candidates[b_idx]
            if num_a["number"][1] != num_b["number"][1]:
                pair_score = round((num_a["composite_score"] + num_b["composite_score"]) / 2.0, 1)
                suggested_redoblonas.append({
                    "pair": f"{num_a['number']} y {num_b['number']}",
                    "significados": f"{num_a['significado']} + {num_b['significado']}",
                    "pair_score": pair_score,
                    "ambo_1": num_a["number"],
                    "ambo_2": num_b["number"]
                })
    suggested_redoblonas = sorted(suggested_redoblonas, key=lambda x: x["pair_score"], reverse=True)[:5]

    return {
        "analysis_scope": {
            "total_analyzed_draws": total_draws,
            "lottery": lottery,
            "shift": shift
        },
        "top_predictions": top_candidates,
        "suggested_redoblonas": suggested_redoblonas
    }

def run_backtesting(lottery: Optional[str] = "all", shift: Optional[str] = "all", test_draws_count: int = 50):
    all_draws = get_all_draws(lottery=lottery, shift=shift)
    if len(all_draws) <= test_draws_count + 30:
        return {"error": "No hay suficientes sorteos para realizar backtesting"}

    start_idx = len(all_draws) - test_draws_count
    head_hits = 0
    board_hits = 0
    simulated_history = []

    for i in range(start_idx, len(all_draws)):
        actual_draw = all_draws[i]
        actual_head = actual_draw["head_ambo"]
        actual_board = set(actual_draw[f"p{p}"][-2:] for p in range(1, 21))

        recent_subset = all_draws[max(0, i-50):i]
        freq_map = {}
        for d in recent_subset:
            a = d["head_ambo"]
            freq_map[a] = freq_map.get(a, 0) + 1
        
        candidates = sorted(
            [f"{num:02d}" for num in range(100)],
            key=lambda x: (-(i - max([idx for idx, d in enumerate(recent_subset) if d["head_ambo"] == x] + [-1])), freq_map.get(x, 0))
        )[:5]

        is_head_hit = actual_head in candidates
        is_board_hit = len(set(candidates).intersection(actual_board)) > 0
        
        if is_head_hit:
            head_hits += 1
        if is_board_hit:
            board_hits += 1

        if len(simulated_history) < 15:
            simulated_history.append({
                "date": actual_draw["draw_date"],
                "shift": actual_draw["shift"],
                "lottery": actual_draw["lottery"],
                "actual_head": actual_head,
                "predicted_top5": candidates,
                "hit_head": is_head_hit,
                "hit_board": is_board_hit
            })

    head_hit_rate = round(float(head_hits / test_draws_count * 100), 2)
    board_hit_rate = round(float(board_hits / test_draws_count * 100), 2)
    baseline_head_rate = round(float(5 / 100.0 * 100), 2)
    baseline_board_rate = 67.2

    return {
        "test_draws_evaluated": test_draws_count,
        "head_hits": head_hits,
        "head_hit_rate": head_hit_rate,
        "baseline_head_rate": baseline_head_rate,
        "board_hits": board_hits,
        "board_hit_rate": board_hit_rate,
        "baseline_board_rate": baseline_board_rate,
        "performance_lift": f"+{round(head_hit_rate - baseline_head_rate, 1)}% sobre el azar",
        "sample_history": simulated_history
    }
`;

const main_code = `from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import uvicorn

from database import init_db, get_all_draws, get_draw_count
from seed_data import generate_quiniela_draws_2026, SIGNIFICADOS_QUINIELA
from stats_engine import compute_frequency_and_delays
from pattern_engine import analyze_patterns, analyze_cross_lottery
from markov_model import compute_markov_transitions
from predictor import calculate_composite_predictions, run_backtesting

app = FastAPI(
    title="Quiniela Pattern Predictor API - Argentina",
    description="Motor profesional de análisis estadístico, detección de patrones y predicción para Quiniela de la Ciudad y Provincia.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    generate_quiniela_draws_2026()

@app.get("/")
def read_root():
    return {
        "app": "Quiniela Pattern Predictor API",
        "status": "online",
        "total_draws": get_draw_count(),
        "lotteries": ["ciudad", "provincia"],
        "shifts": ["previa", "primera", "matutina", "vespertina", "nocturna"]
    }

@app.get("/api/draws")
def get_draws(
    lottery: Optional[str] = Query("all", description="ciudad, provincia o all"),
    shift: Optional[str] = Query("all", description="previa, primera, matutina, vespertina, nocturna o all"),
    limit: Optional[int] = Query(50, description="Número máximo de sorteos a retornar")
):
    draws = get_all_draws(lottery=lottery, shift=shift, limit=limit)
    return {"total": len(draws), "draws": draws}

@app.get("/api/stats/frequencies")
def get_frequencies(
    lottery: Optional[str] = Query("all"),
    shift: Optional[str] = Query("all"),
    target: Optional[str] = Query("head", description="head o all20")
):
    return compute_frequency_and_delays(lottery=lottery, shift=shift, target=target)

@app.get("/api/patterns")
def get_patterns(
    lottery: Optional[str] = Query("all"),
    shift: Optional[str] = Query("all")
):
    return analyze_patterns(lottery=lottery, shift=shift)

@app.get("/api/patterns/cross")
def get_cross_analysis():
    return analyze_cross_lottery()

@app.get("/api/markov")
def get_markov(
    lottery: Optional[str] = Query("all"),
    shift: Optional[str] = Query("all")
):
    return compute_markov_transitions(lottery=lottery, shift=shift)

@app.get("/api/predictions")
def get_predictions(
    lottery: Optional[str] = Query("all"),
    shift: Optional[str] = Query("all"),
    top_k: Optional[int] = Query(10)
):
    return calculate_composite_predictions(lottery=lottery, shift=shift, top_k=top_k)

@app.get("/api/backtest")
def get_backtest(
    lottery: Optional[str] = Query("all"),
    shift: Optional[str] = Query("all"),
    draws_count: Optional[int] = Query(50)
):
    return run_backtesting(lottery=lottery, shift=shift, test_draws_count=draws_count)

@app.get("/api/meanings")
def get_meanings():
    return {"meanings": SIGNIFICADOS_QUINIELA}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
`;

fs.writeFileSync('stats_engine.py', stats_engine_code, 'utf8');
fs.writeFileSync('pattern_engine.py', pattern_engine_code, 'utf8');
fs.writeFileSync('markov_model.py', markov_model_code, 'utf8');
fs.writeFileSync('predictor.py', predictor_code, 'utf8');
fs.writeFileSync('main.py', main_code, 'utf8');

console.log('All backend files generated successfully!');
