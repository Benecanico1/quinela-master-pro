import numpy as np
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
        {"ending": f"Terminaci�n {u}", "digit": u, "probability": float(prob_endings[last_d2][u]), "count": int(ending_transitions[last_d2][u])}
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
