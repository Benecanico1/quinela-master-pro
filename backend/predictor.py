import numpy as np
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
            reasons.append(f"Atraso cr�tico ({item['current_delay']} sorteos sin salir a la cabeza)")
        if e_prob > 0.12:
            reasons.append(f"Alta transici�n para terminaci�n {d2} ({round(e_prob*100,1)}%)")
        if res_ratio > 1.15:
            reasons.append(f"Fuerte presencia en los 20 premios ({freq20} salidas)")
        if 7 <= s <= 11:
            reasons.append(f"Suma �ptima ({s}) en campana gaussiana")
        if not reasons:
            reasons.append("Equilibrio arm�nico en la curva de frecuencias")

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
