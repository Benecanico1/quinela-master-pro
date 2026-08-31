import numpy as np
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
                "detail": f"El ambo {num} sali� a la cabeza en ambas loter�as el mismo d�a"
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
                    "note": f"El ambo {head} sali� previamente en los 20 y salt� a la cabeza en {d['shift']} de {d['lottery']}."
                })
            for pos in range(1, 21):
                all_board_ambos_early.add(d[f"p{pos}"][-2:])
                
    return {
        "same_day_head_coincidences": len(same_day_head_matches),
        "recent_same_day_matches": same_day_head_matches[-10:],
        "board_to_head_jumps_count": len(board_to_head_jumps),
        "recent_jumps": board_to_head_jumps[-15:]
    }
