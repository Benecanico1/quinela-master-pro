import numpy as np
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
            for p in range(1, 21):
                ambo = d[f"p{p}"][-2:]
                history_appearances[ambo].append(idx)

    total_observations = total_draws if target == "head" else total_draws * 20
    expected_freq = total_observations / 100.0
    std_expected = np.sqrt(total_observations * (1/100.0) * (99/100.0))
    
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
            "percentage": round(float(freq / total_observations * 100), 2),
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

    # Normalized expected frequency for chi-squared test
    sum_obs = sum(observed_counts)
    f_exp_normalized = [sum_obs / 100.0] * 100
    chi2_stat, p_val = stats.chisquare(observed_counts, f_exp=f_exp_normalized)
    
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
