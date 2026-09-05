"""
Lock Prospective Draw Predictions Script
Generates and cryptographically locks predictions for the upcoming eligible draw:
2026-09-04 Vespertina (Scheduled: 18:00 ART, Deadline: 17:45 ART / 20:45 UTC).
Operates for all 6 frozen models:
- ML-FULL (Champion)
- ML-TREND (Challenger 1)
- FREQUENCY-SIMPLE (Challenger 2)
- MARKOV-PURE (Challenger 3)
- HEURISTIC-BASELINE (Baseline)
- RANDOM-REFERENCE (Random)
"""

import json
import os
import sys
import hashlib
import random
import numpy as np
from datetime import datetime, timezone
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

APP_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if APP_ROOT not in sys.path:
    sys.path.insert(0, APP_ROOT)

from backend.ml_pipeline.feature_extractor import extract_features_for_draw
from backend.ml_pipeline.prospective_validation_engine import ProspectiveValidationEngine, canonical_hash

def run_lock_vespertina():
    print("=" * 65)
    print("QUINIELA MASTER PRO — PROSPECTIVE_TEST_V1 LOCK PROTOCOL")
    print("=" * 65)

    engine = ProspectiveValidationEngine()
    
    # 1. Load Draws up to current state
    draws_path = os.path.join(APP_ROOT, "frontend", "public", "api", "draws.json")
    with open(draws_path, "r", encoding="utf-8") as f:
        draws_dict = json.load(f)
    
    draws = list(draws_dict.values())
    last_known_draw = draws[-1]
    last_known_draw_id = f"{last_known_draw['draw_date']}_{last_known_draw['lottery']}_{last_known_draw['shift']}"
    
    dataset_raw = json.dumps(draws, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
    dataset_hash = hashlib.sha256(dataset_raw.encode('utf-8')).hexdigest()
    
    print(f"[*] Total draws in dataset: {len(draws)}")
    print(f"[*] Last known draw: {last_known_draw_id} (Cabeza: {last_known_draw['head_ambo']})")
    print(f"[*] Dataset SHA-256: {dataset_hash[:16]}...")

    target_date = "2026-09-04"
    target_shift = "vespertina"

    # Verify deadline
    deadline_info = engine.calculate_deadline(target_date, target_shift)
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[*] Current UTC: {now_utc}")
    print(f"[*] Deadline UTC: {deadline_info['prediction_deadline_utc']}")
    assert now_utc < deadline_info['prediction_deadline_utc'], "ERROR: Past deadline!"
    print("[+] Verified: Execution is strictly prior to deadline. Temporal rule satisfied.")

    # 2. Train ML-FULL on historical data up to evaluation start
    eval_start_idx = max(400, len(draws) - 500)
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

    # 3. Process both jurisdictions: Ciudad and Provincia
    jurisdictions = ["ciudad", "provincia"]
    locked_records = []

    for jur in jurisdictions:
        print(f"\n" + "-" * 50)
        print(f"[*] Generating and Locking Predictions for: {jur.upper()} {target_shift.upper()}")
        print("-" * 50)

        dummy_target = {
            "draw_date": target_date,
            "lottery": jur,
            "shift": target_shift,
            "head_ambo": "00",
            "board": ["0000"] * 20
        }

        X_target, _, _ = extract_features_for_draw(draws, dummy_target)
        X_target_scaled = scaler.transform(X_target)

        # --- MODEL 1: ML-FULL (Champion) ---
        probs_full = model_lr.predict_proba(X_target_scaled)[:, 1]
        ranked_full = [f"{i:02d}" for i in np.argsort(probs_full)[::-1]]
        scores_full = {f"{i:02d}": round(float(probs_full[i]), 4) for i in range(100)}

        rec_full = engine.register_prediction(
            draw_date=target_date,
            shift=target_shift,
            jurisdiction=jur,
            model_id="ML-FULL",
            top_ranking=ranked_full,
            scores=scores_full,
            dataset_hash=dataset_hash,
            last_known_draw_id=last_known_draw_id,
            training_data_count=len(draws),
            features_snapshot={"feature_names": f_names, "top1_features": {f_names[k]: round(float(X_target[int(ranked_full[0]), k]), 4) for k in range(len(f_names))}},
            model_parameters_snapshot={"C": 0.1, "penalty": "l2", "role": "CHAMPION"}
        )
        locked_records.append(rec_full["prediction"])
        print(f"[+] ML-FULL Locked: Top 5 = {ranked_full[:5]} | Hash = {rec_full['prediction']['prediction_hash'][:16]}...")

        # --- MODEL 2: ML-TREND (Challenger 1) ---
        # Features related to delay and trend: delay_head (idx 6), delay_avg (idx 7), freq_10 (idx 1), freq_20 (idx 2), shift_freq (idx 17)
        trend_score = (X_target[:, 6] * 0.3) + (X_target[:, 7] * 0.3) + (X_target[:, 1] * 20.0) + (X_target[:, 17] * 50.0)
        ranked_trend = [f"{i:02d}" for i in np.argsort(trend_score)[::-1]]
        scores_trend = {f"{i:02d}": round(float(trend_score[i]), 4) for i in range(100)}

        rec_trend = engine.register_prediction(
            draw_date=target_date,
            shift=target_shift,
            jurisdiction=jur,
            model_id="ML-TREND",
            top_ranking=ranked_trend,
            scores=scores_trend,
            dataset_hash=dataset_hash,
            last_known_draw_id=last_known_draw_id,
            training_data_count=len(draws),
            model_parameters_snapshot={"role": "CHALLENGER_1", "weights": "trend_delay_submodel"}
        )
        locked_records.append(rec_trend["prediction"])
        print(f"[+] ML-TREND Locked: Top 5 = {ranked_trend[:5]} | Hash = {rec_trend['prediction']['prediction_hash'][:16]}...")

        # --- MODEL 3: FREQUENCY-SIMPLE (Challenger 2) ---
        # freq_100 (idx 4)
        freq_100_vals = X_target[:, 4]
        ranked_freq = [f"{i:02d}" for i in np.argsort(freq_100_vals)[::-1]]
        scores_freq = {f"{i:02d}": int(freq_100_vals[i]) for i in range(100)}

        rec_freq = engine.register_prediction(
            draw_date=target_date,
            shift=target_shift,
            jurisdiction=jur,
            model_id="FREQUENCY-SIMPLE",
            top_ranking=ranked_freq,
            scores=scores_freq,
            dataset_hash=dataset_hash,
            last_known_draw_id=last_known_draw_id,
            training_data_count=len(draws),
            model_parameters_snapshot={"role": "CHALLENGER_2", "window": 100}
        )
        locked_records.append(rec_freq["prediction"])
        print(f"[+] FREQUENCY-SIMPLE Locked: Top 5 = {ranked_freq[:5]} | Hash = {rec_freq['prediction']['prediction_hash'][:16]}...")

        # --- MODEL 4: MARKOV-PURE (Challenger 3) ---
        # markov_prob (idx 21)
        markov_vals = X_target[:, 21]
        ranked_markov = [f"{i:02d}" for i in np.argsort(markov_vals)[::-1]]
        scores_markov = {f"{i:02d}": round(float(markov_vals[i]), 4) for i in range(100)}

        rec_markov = engine.register_prediction(
            draw_date=target_date,
            shift=target_shift,
            jurisdiction=jur,
            model_id="MARKOV-PURE",
            top_ranking=ranked_markov,
            scores=scores_markov,
            dataset_hash=dataset_hash,
            last_known_draw_id=last_known_draw_id,
            training_data_count=len(draws),
            model_parameters_snapshot={"role": "CHALLENGER_3", "order": 1}
        )
        locked_records.append(rec_markov["prediction"])
        print(f"[+] MARKOV-PURE Locked: Top 5 = {ranked_markov[:5]} | Hash = {rec_markov['prediction']['prediction_hash'][:16]}...")

        # --- MODEL 5: HEURISTIC-BASELINE (Baseline) ---
        # Composite score of frequency, delay and board presence
        heuristic_score = (X_target[:, 5] * 0.3) + (X_target[:, 6] * 0.3) + (X_target[:, 16] * 40.0)
        ranked_heur = [f"{i:02d}" for i in np.argsort(heuristic_score)[::-1]]
        scores_heur = {f"{i:02d}": round(float(heuristic_score[i]), 4) for i in range(100)}

        rec_heur = engine.register_prediction(
            draw_date=target_date,
            shift=target_shift,
            jurisdiction=jur,
            model_id="HEURISTIC-BASELINE",
            top_ranking=ranked_heur,
            scores=scores_heur,
            dataset_hash=dataset_hash,
            last_known_draw_id=last_known_draw_id,
            training_data_count=len(draws),
            model_parameters_snapshot={"role": "BASELINE"}
        )
        locked_records.append(rec_heur["prediction"])
        print(f"[+] HEURISTIC-BASELINE Locked: Top 5 = {ranked_heur[:5]} | Hash = {rec_heur['prediction']['prediction_hash'][:16]}...")

        # --- MODEL 6: RANDOM-REFERENCE (Random) ---
        # Reproducible random seed derived from draw_date, jur, shift
        seed_val = int(hashlib.md5(f"{target_date}_{jur}_{target_shift}".encode('utf-8')).hexdigest()[:8], 16)
        rng = random.Random(seed_val)
        rand_pool = list(range(100))
        rng.shuffle(rand_pool)
        ranked_rand = [f"{i:02d}" for i in rand_pool]
        scores_rand = {f"{i:02d}": round(1.0 / 100.0, 4) for i in range(100)}

        rec_rand = engine.register_prediction(
            draw_date=target_date,
            shift=target_shift,
            jurisdiction=jur,
            model_id="RANDOM-REFERENCE",
            top_ranking=ranked_rand,
            scores=scores_rand,
            dataset_hash=dataset_hash,
            last_known_draw_id=last_known_draw_id,
            training_data_count=len(draws),
            model_parameters_snapshot={"role": "RANDOM", "seed": seed_val}
        )
        locked_records.append(rec_rand["prediction"])
        print(f"[+] RANDOM-REFERENCE Locked: Top 5 = {ranked_rand[:5]} | Hash = {rec_rand['prediction']['prediction_hash'][:16]}...")

    # Leakage Audit on all locked predictions
    audit = engine.prospective_leakage_audit()
    print("\n" + "=" * 65)
    print(f"PROSPECTIVE LEAKAGE AUDIT VERDICT: {audit['validation_status']}")
    print(f"Temporal Leakage:  {audit['temporal_leakage']}")
    print(f"Target Leakage:    {audit['target_leakage']}")
    print(f"Dataset Leakage:   {audit['dataset_leakage']}")
    print(f"Model Leakage:     {audit['model_leakage']}")
    print(f"Selection Leakage: {audit['selection_leakage']}")
    print(f"Evaluation Leakage:{audit['evaluation_leakage']}")
    print("=" * 65)
    print(f"\n[+] Total locked predictions registered: {len(locked_records)}")
    return locked_records, audit

if __name__ == "__main__":
    run_lock_vespertina()
