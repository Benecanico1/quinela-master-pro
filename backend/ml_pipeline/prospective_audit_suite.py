"""
PROSPECTIVE AUDIT SUITE & STATISTICAL COMPARISON ENGINE (FASE 5)
Confidence Intervals, McNemar Tests, Windowing, Multiplicity Adjustments, and Exporting.
"""

import os
import sys
import json
import csv
import math
from typing import Dict, List, Any, Tuple
from datetime import datetime

def wilson_score_interval(successes: int, total: int, confidence: float = 0.95) -> Tuple[float, float]:
    """Calculates Wilson score 95% confidence interval for a proportion."""
    if total == 0:
        return (0.0, 0.0)
    z = 1.95996  # for 95% CI
    p_hat = successes / total
    denominator = 1 + (z**2) / total
    centre_adjusted_probability = p_hat + (z**2) / (2 * total)
    adjusted_std_err = z * math.sqrt((p_hat * (1 - p_hat) + (z**2) / (4 * total)) / total)
    lower = max(0.0, (centre_adjusted_probability - adjusted_std_err) / denominator)
    upper = min(1.0, (centre_adjusted_probability + adjusted_std_err) / denominator)
    return (round(lower, 4), round(upper, 4))

def mcnemar_test(model_a_binary: List[bool], model_b_binary: List[bool]) -> Dict[str, Any]:
    """
    Computes McNemar's test for paired binary outcomes.
    Uses exact binomial test when discordant pairs (b + c) < 25.
    """
    assert len(model_a_binary) == len(model_b_binary), "Sequences must be equal length"
    n = len(model_a_binary)
    if n == 0:
        return {"chi2": 0.0, "p_value_str": "N/A", "test_used": "None", "significant": False}

    b = sum(1 for a, b_val in zip(model_a_binary, model_b_binary) if a and not b_val)
    c = sum(1 for a, b_val in zip(model_a_binary, model_b_binary) if not a and b_val)
    discordant = b + c

    if discordant == 0:
        return {
            "b": 0, "c": 0, "discordant_pairs": 0,
            "chi2": 0.0, "p_value": 1.0, "p_value_str": "1.0000",
            "test_used": "McNemar", "significant": False
        }

    # Continuity corrected chi2
    chi2 = ((abs(b - c) - 1)**2) / discordant
    
    # Exact binomial p-value when discordant < 25
    if discordant < 25:
        # Two-sided binomial with p=0.5
        min_bc = min(b, c)
        prob = sum(math.comb(discordant, i) * (0.5**discordant) for i in range(min_bc + 1))
        p_val = min(1.0, 2.0 * prob)
        test_used = "Exact Binomial McNemar"
    else:
        # Approximate p-value from chi2 df=1
        # Survival function approximation
        p_val = math.erfc(math.sqrt(chi2 / 2.0))
        test_used = "Continuity-Corrected McNemar Chi2"

    p_val_str = "< 0.0001" if p_val < 0.0001 else f"{p_val:.4f}"

    return {
        "b": b,
        "c": c,
        "discordant_pairs": discordant,
        "chi2": round(chi2, 4),
        "p_value": round(p_val, 6),
        "p_value_str": p_val_str,
        "test_used": test_used,
        "significant": p_val < 0.05
    }

def holm_bonferroni_correction(p_values: List[Tuple[str, float]]) -> List[Tuple[str, float, float, bool]]:
    """
    Applies Holm-Bonferroni correction to multiple testing comparisons.
    Returns: [(comparison_name, uncorrected_p, adjusted_p, is_significant)]
    """
    sorted_p = sorted(p_values, key=lambda x: x[1])
    m = len(sorted_p)
    results = []
    
    for rank, (name, p) in enumerate(sorted_p, 1):
        adjusted_p = min(1.0, p * (m - rank + 1))
        sig = adjusted_p < 0.05
        results.append((name, p, adjusted_p, sig))
        
    return results

def compute_model_metrics(evaluated_predictions: List[Dict]) -> Dict[str, Any]:
    """
    Computes standard Phase 5 metrics for evaluated prospective predictions.
    """
    n = len(evaluated_predictions)
    if n == 0:
        return {
            "total_evaluated": 0,
            "status": "INSUFFICIENT_DATA",
            "top1_rate": None,
            "hit_rate_at_5": None,
            "precision_at_5": None,
            "hit_rate_at_10": None,
            "precision_at_10": None,
            "hit_rate_at_20": None,
            "precision_at_20": None
        }

    top1_hits = sum(1 for p in evaluated_predictions if p.get("evaluation_results", {}).get("hit_head_top1"))
    hit5_count = sum(1 for p in evaluated_predictions if p.get("evaluation_results", {}).get("hit_board_at_5"))
    hit10_count = sum(1 for p in evaluated_predictions if p.get("evaluation_results", {}).get("hit_board_at_10"))
    hit20_count = sum(1 for p in evaluated_predictions if p.get("evaluation_results", {}).get("hit_board_at_20"))

    total_board_hits_5 = sum(p.get("evaluation_results", {}).get("board_hits_count_top5", 0) for p in evaluated_predictions)
    total_board_hits_10 = sum(p.get("evaluation_results", {}).get("board_hits_count_top10", 0) for p in evaluated_predictions)
    total_board_hits_20 = sum(p.get("evaluation_results", {}).get("board_hits_count_top20", 0) for p in evaluated_predictions)

    prec5 = total_board_hits_5 / (n * 5.0)
    prec10 = total_board_hits_10 / (n * 10.0)
    prec20 = total_board_hits_20 / (n * 20.0)

    top1_ci = wilson_score_interval(top1_hits, n)
    hit5_ci = wilson_score_interval(hit5_count, n)
    hit10_ci = wilson_score_interval(hit10_count, n)
    hit20_ci = wilson_score_interval(hit20_count, n)

    return {
        "total_evaluated": n,
        "status": "EVALUATED",
        "top1_hits": top1_hits,
        "top1_rate": round(top1_hits / n, 4),
        "top1_ci95": top1_ci,
        "hit_rate_at_5": round(hit5_count / n, 4),
        "hit_rate_at_5_ci95": hit5_ci,
        "precision_at_5": round(prec5, 4),
        "hit_rate_at_10": round(hit10_count / n, 4),
        "hit_rate_at_10_ci95": hit10_ci,
        "precision_at_10": round(prec10, 4),
        "hit_rate_at_20": round(hit20_count / n, 4),
        "hit_rate_at_20_ci95": hit20_ci,
        "precision_at_20": round(prec20, 4)
    }

def export_ledger_to_csv(ledger_data: Dict, output_csv_path: str):
    """Exports prediction audit ledger to flat CSV format."""
    predictions = ledger_data.get("predictions", [])
    if not predictions:
        with open(output_csv_path, 'w', encoding='utf-8', newline='') as f:
            f.write("prediction_id,status,message\nNO_DATA,EMPTY,Ledger has 0 records\n")
        return

    headers = [
        "prediction_id", "jurisdiction", "draw_date", "shift", "model_id", "prediction_role",
        "prediction_created_at", "prediction_locked_at", "prediction_deadline", "prediction_status",
        "top_1", "top_5", "prediction_hash", "official_result_received_at", "official_head",
        "hit_head_top1", "hit_board_at_5", "precision_at_5"
    ]

    with open(output_csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for p in predictions:
            eval_res = p.get("evaluation_results", {})
            writer.writerow([
                p.get("prediction_id"),
                p.get("jurisdiction"),
                p.get("draw_date"),
                p.get("shift"),
                p.get("model_id"),
                p.get("prediction_role"),
                p.get("prediction_created_at"),
                p.get("prediction_locked_at"),
                p.get("prediction_deadline"),
                p.get("prediction_status"),
                p.get("top_1"),
                " ".join(p.get("top_5", [])),
                p.get("prediction_hash"),
                p.get("official_result_received_at"),
                p.get("official_head"),
                eval_res.get("hit_head_top1"),
                eval_res.get("hit_board_at_5"),
                eval_res.get("precision_at_5")
            ])
