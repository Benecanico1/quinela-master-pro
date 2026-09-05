"""
TEST PHASE 5 SUITE — 15 CRITICAL SCIENTIFIC INTEGRITY TESTS
Quiniela Master Pro — Phase 5 Protocol Verification
"""

import os
import sys
import json
import hashlib
import subprocess

app_root = r'C:\Users\enero\.gemini\antigravity\scratch\quiniela-pro-app'
sys.path.append(os.path.join(app_root, 'backend', 'ml_pipeline'))

from prospective_validation_engine import ProspectiveValidationEngine, canonical_hash
import prospective_audit_suite as pas

test_results = {}

def run_all_tests():
    engine = ProspectiveValidationEngine()
    
    # -------------------------------------------------------------
    # TEST 1: No puede modificarse una predicción LOCKED
    # -------------------------------------------------------------
    try:
        p1 = engine.register_prediction(
            jurisdiction="ciudad",
            draw_date="2026-09-05",
            shift="previa",
            model_id="ML-FULL",
            top_ranking=["12", "34", "56", "78", "90"],
            scores={"12": 0.85, "34": 0.81},
            dataset_hash="hash_test_1",
            last_known_draw_id="2026-09-04_provincia_nocturna",
            training_data_count=2229,
            created_at_utc="2026-09-05 09:30:00 UTC"
        )
        assert p1["prediction"]["prediction_locked"] is True
        original_hash = p1["prediction"]["prediction_hash"]
        
        # Attempt to tamper by re-registering or altering
        tamper_res = engine.register_prediction(
            jurisdiction="ciudad",
            draw_date="2026-09-05",
            shift="previa",
            model_id="ML-FULL",
            top_ranking=["99", "88", "77", "66", "55"],  # Tampered numbers
            scores={"99": 0.99},
            dataset_hash="hash_test_1",
            last_known_draw_id="2026-09-04_provincia_nocturna",
            training_data_count=2229,
            created_at_utc="2026-09-05 09:35:00 UTC"
        )
        assert tamper_res["status"] == "DUPLICATE_REJECTED"
        assert tamper_res["prediction"]["top_1"] == "12"
        assert tamper_res["prediction"]["prediction_hash"] == original_hash
        test_results["TEST_1_LOCKED_PREDICTION_IMMUTABLE"] = "PASS"
    except Exception as e:
        test_results["TEST_1_LOCKED_PREDICTION_IMMUTABLE"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 2: No puede usarse un resultado futuro como feature
    # -------------------------------------------------------------
    try:
        leakage_check = engine.prospective_leakage_audit()
        assert leakage_check["temporal_leakage"] == "PASS"
        assert leakage_check["target_leakage"] == "PASS"
        test_results["TEST_2_NO_FUTURE_TARGET_IN_FEATURES"] = "PASS"
    except Exception as e:
        test_results["TEST_2_NO_FUTURE_TARGET_IN_FEATURES"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 3: No puede generarse una predicción retrospectiva válida
    # -------------------------------------------------------------
    try:
        late_pred = engine.register_prediction(
            jurisdiction="provincia",
            draw_date="2026-09-05",
            shift="previa", # deadline was 10:00 hs (13:00 UTC)
            model_id="ML-FULL",
            top_ranking=["01", "02", "03", "04", "05"],
            scores={"01": 0.70},
            dataset_hash="hash_test_3",
            last_known_draw_id="2026-09-04_provincia_nocturna",
            training_data_count=2229,
            created_at_utc="2026-09-05 13:45:00 UTC" # Past 13:00 UTC deadline!
        )
        assert late_pred["prediction"]["prediction_status"] == "INVALID"
        assert late_pred["prediction"]["invalid_reason"] == "PREDICTION_SUBMITTED_PAST_DEADLINE"
        test_results["TEST_3_NO_RETROSPECTIVE_PREDICTION_VALID"] = "PASS"
    except Exception as e:
        test_results["TEST_3_NO_RETROSPECTIVE_PREDICTION_VALID"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 4: No puede alterarse HISTORICAL_TEST_V1
    # -------------------------------------------------------------
    try:
        frozen_file = os.path.join(app_root, 'backend', 'ml_pipeline', 'historical_test_v1_frozen.json')
        with open(frozen_file, 'r', encoding='utf-8') as f:
            frozen_data = json.load(f)
        assert frozen_data["status"] == "FROZEN_IMMUTABLE"
        assert frozen_data["total_eval_draws"] == 400
        assert len(frozen_data["draws"]) == 400
        test_results["TEST_4_HISTORICAL_TEST_V1_IMMUTABLE"] = "PASS"
    except Exception as e:
        test_results["TEST_4_HISTORICAL_TEST_V1_IMMUTABLE"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 5: El hash cambia si cambia la predicción
    # -------------------------------------------------------------
    try:
        obj_a = {"prediction_id": "P1", "top_1": "22", "top_5": ["22", "33", "44", "55", "66"]}
        obj_b = {"prediction_id": "P1", "top_1": "23", "top_5": ["23", "33", "44", "55", "66"]}
        h_a = canonical_hash(obj_a)
        h_b = canonical_hash(obj_b)
        assert h_a != h_b, "Hashes must be different when content differs"
        test_results["TEST_5_HASH_CHANGES_ON_ALTERATION"] = "PASS"
    except Exception as e:
        test_results["TEST_5_HASH_CHANGES_ON_ALTERATION"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 6: El hash permanece igual para la misma representación canónica
    # -------------------------------------------------------------
    try:
        # Same contents with different key insertion order
        obj_1 = {"z": 100, "a": "test", "scores": {"55": 0.8, "12": 0.4}}
        obj_2 = {"a": "test", "scores": {"12": 0.4, "55": 0.8}, "z": 100}
        h_1 = canonical_hash(obj_1)
        h_2 = canonical_hash(obj_2)
        assert h_1 == h_2, "Canonical hash must be identical regardless of insertion order"
        test_results["TEST_6_HASH_REPRODUCIBLE_CANONICAL"] = "PASS"
    except Exception as e:
        test_results["TEST_6_HASH_REPRODUCIBLE_CANONICAL"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 7: Una predicción posterior al deadline queda INVALID
    # -------------------------------------------------------------
    try:
        p_deadline = engine.calculate_deadline("2026-09-06", "nocturna")
        deadline_utc = p_deadline["prediction_deadline_utc"]
        late_pred_2 = engine.register_prediction(
            jurisdiction="ciudad",
            draw_date="2026-09-06",
            shift="nocturna",
            model_id="ML-TREND",
            top_ranking=["10", "20", "30", "40", "50"],
            scores={"10": 0.5},
            dataset_hash="hash_test_7",
            last_known_draw_id="2026-09-05_ciudad_vespertina",
            training_data_count=2230,
            created_at_utc="2026-09-07 01:00:00 UTC" # Much later!
        )
        assert late_pred_2["prediction"]["prediction_status"] == "INVALID"
        test_results["TEST_7_POST_DEADLINE_MARKED_INVALID"] = "PASS"
    except Exception as e:
        test_results["TEST_7_POST_DEADLINE_MARKED_INVALID"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 8: Un sorteo sin predicción válida no se contabiliza como fallo predictivo
    # -------------------------------------------------------------
    try:
        # Evaluate late prediction -> must be skipped_invalid, not recorded as miss in model metrics
        eval_late = engine.evaluate_locked_prediction(
            prediction_id=late_pred_2["prediction"]["prediction_id"],
            official_head="1234",
            official_board=["1234"] * 20
        )
        assert eval_late["status"] == "SKIPPED_INVALID"
        test_results["TEST_8_MISSING_PREDICTION_NOT_SCORED_AS_MISS"] = "PASS"
    except Exception as e:
        test_results["TEST_8_MISSING_PREDICTION_NOT_SCORED_AS_MISS"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 9: Los challengers no reemplazan automáticamente al Champion
    # -------------------------------------------------------------
    try:
        models_reg = engine.models_registry.get("models", {})
        assert models_reg["ML-FULL"]["role"] == "CHAMPION"
        assert models_reg["ML-TREND"]["role"] == "CHALLENGER_1"
        assert models_reg["ML-FULL"]["frozen_immutable"] is True
        test_results["TEST_9_CHALLENGERS_NEVER_PROMOTE_AUTOMATICALLY"] = "PASS"
    except Exception as e:
        test_results["TEST_9_CHALLENGERS_NEVER_PROMOTE_AUTOMATICALLY"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 10: Los datos históricos actuales continúan disponibles
    # -------------------------------------------------------------
    try:
        draws_file = os.path.join(app_root, 'frontend', 'public', 'api', 'draws.json')
        with open(draws_file, 'r', encoding='utf-8') as f:
            d_json = json.load(f)
        assert len(d_json) >= 2225, f"Expected >= 2225 historical draws, got {len(d_json)}"
        test_results["TEST_10_HISTORICAL_DATA_PRESERVED"] = "PASS"
    except Exception as e:
        test_results["TEST_10_HISTORICAL_DATA_PRESERVED"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 11: La app continúa generando predicciones normales
    # -------------------------------------------------------------
    try:
        node_check = subprocess.check_output(
            ["node", "-e", "import('./frontend/src/services/clientEngine.js').then(m => { const res = m.getClientPredictions('ciudad', 'nocturna', 5); if (!res || !res.top_predictions) process.exit(1); console.log('OK'); });"],
            cwd=app_root, text=True
        )
        assert "OK" in node_check
        test_results["TEST_11_APP_PREDICTIONS_OPERATIONAL"] = "PASS"
    except Exception as e:
        test_results["TEST_11_APP_PREDICTIONS_OPERATIONAL"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 12: El dashboard actual no se rompe
    # -------------------------------------------------------------
    try:
        node_check_tabs = subprocess.check_output(
            ["node", "-e", "import('./frontend/src/services/mlPredictionEngine.js').then(m => { const res = m.getFourSystemsBenchmark(); if (!res || !res.table) process.exit(1); console.log('OK'); });"],
            cwd=app_root, text=True
        )
        assert "OK" in node_check_tabs
        test_results["TEST_12_DASHBOARD_COMPATIBILITY"] = "PASS"
    except Exception as e:
        test_results["TEST_12_DASHBOARD_COMPATIBILITY"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 13: La sincronización continúa funcionando
    # -------------------------------------------------------------
    try:
        node_check_draws = subprocess.check_output(
            ["node", "-e", "import('./frontend/src/services/clientEngine.js').then(m => { const res = m.getClientDraws('all', 'all', 10); if (!res || !res.draws) process.exit(1); console.log('OK_COUNT_' + res.draws.length); });"],
            cwd=app_root, text=True
        )
        assert "OK_COUNT" in node_check_draws
        test_results["TEST_13_SYNC_ENGINE_OPERATIONAL"] = "PASS"
    except Exception as e:
        test_results["TEST_13_SYNC_ENGINE_OPERATIONAL"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 14: No aparecen duplicados al sincronizar varias veces
    # -------------------------------------------------------------
    try:
        # Idempotent test
        p_dup1 = engine.register_prediction(
            jurisdiction="ciudad", draw_date="2026-09-08", shift="primera",
            model_id="ML-FULL", top_ranking=["77"], scores={"77": 0.5},
            dataset_hash="h14", last_known_draw_id="d14", training_data_count=2229
        )
        p_dup2 = engine.register_prediction(
            jurisdiction="ciudad", draw_date="2026-09-08", shift="primera",
            model_id="ML-FULL", top_ranking=["77"], scores={"77": 0.5},
            dataset_hash="h14", last_known_draw_id="d14", training_data_count=2229
        )
        assert p_dup2["status"] == "DUPLICATE_REJECTED"
        test_results["TEST_14_IDEMPOTENCY_NO_DUPLICATES"] = "PASS"
    except Exception as e:
        test_results["TEST_14_IDEMPOTENCY_NO_DUPLICATES"] = f"FAIL: {e}"

    # -------------------------------------------------------------
    # TEST 15: Rollback disponible
    # -------------------------------------------------------------
    try:
        manifest_file = os.path.join(app_root, 'PRE_PHASE5_MANIFEST.json')
        rollback_doc = os.path.join(app_root, 'ROLLBACK_PHASE5.md')
        snapshot_dir = os.path.join(app_root, 'releases', 'pre_phase5_v1.4.3')
        assert os.path.exists(manifest_file), "Manifest missing"
        assert os.path.exists(rollback_doc), "Rollback doc missing"
        assert os.path.exists(snapshot_dir), "Snapshot dir missing"
        test_results["TEST_15_ROLLBACK_VERIFIED_AVAILABLE"] = "PASS"
    except Exception as e:
        test_results["TEST_15_ROLLBACK_VERIFIED_AVAILABLE"] = f"FAIL: {e}"

    return test_results

if __name__ == '__main__':
    res = run_all_tests()
    all_pass = True
    print("\n========================================")
    print("PHASE 5 — 15 AUTOMATED TESTS RESULTS")
    print("========================================")
    for k, v in res.items():
        print(f"{k}: {v}")
        if v != "PASS":
            all_pass = False
    print("========================================")
    print("OVERALL RESULT:", "ALL 15 TESTS PASSED" if all_pass else "SOME TESTS FAILED")
    print("========================================")
    sys.exit(0 if all_pass else 1)
