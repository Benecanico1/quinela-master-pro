import json
import copy
from pathlib import Path
import numpy as np
from feature_extractor import extract_features_for_draw

def run_leakage_tests():
    print("[*] Iniciando suite de pruebas de Data Leakage y Aislamiento Temporal...")
    curated_file = Path(__file__).resolve().parent / "draws_curated.json"
    if not curated_file.exists():
        raise FileNotFoundError(f"No existe {curated_file}. Ejecute dataset_cleaner.py primero.")

    with open(curated_file, "r", encoding="utf-8") as f:
        draws = json.load(f)

    total = len(draws)
    print(f"[*] Total de sorteos para la prueba: {total}")
    assert total >= 500, "Se requieren al menos 500 sorteos para la prueba."

    # Test 1: Invarianza ante modificaciones en el sorteo objetivo (Lookahead Bias Test)
    target_idx = 1000
    history = draws[:target_idx]
    target = draws[target_idx]

    X_orig, targets_orig, f_names = extract_features_for_draw(history, target)

    # Alteramos deliberadamente el sorteo target (cambiando su cabeza y toda su pizarra)
    tampered_target = copy.deepcopy(target)
    tampered_target["head_ambo"] = "99" if target["head_ambo"] != "99" else "00"
    tampered_target["board"] = ["9999"] * 20

    X_tampered, targets_tampered, _ = extract_features_for_draw(history, tampered_target)

    # La matriz de features X DEBE SER EXACTAMENTE IDÉNTICA
    diff = np.max(np.abs(X_orig - X_tampered))
    print(f"[+] Test 1 (Invarianza de Features ante cambio en sorteo objetivo): diff = {diff:.2e}")
    assert diff == 0.0, f"DATA LEAKAGE DETECTADO: Las features cambiaron ({diff}) al modificar el sorteo objetivo!"

    # Test 2: Invarianza ante adición o alteración de sorteos futuros
    tampered_future_draws = copy.deepcopy(draws)
    for f_idx in range(target_idx, len(tampered_future_draws)):
        tampered_future_draws[f_idx]["head_ambo"] = "77"
        tampered_future_draws[f_idx]["board"] = ["7777"] * 20

    history_future_tampered = tampered_future_draws[:target_idx]
    X_future_tampered, _, _ = extract_features_for_draw(history_future_tampered, target)

    diff_future = np.max(np.abs(X_orig - X_future_tampered))
    print(f"[+] Test 2 (Invarianza de Features ante manipulación del futuro): diff = {diff_future:.2e}")
    assert diff_future == 0.0, f"DATA LEAKAGE DETECTADO: El futuro influyó en las features ({diff_future})!"

    # Test 3: Causalidad temporal en ventanas móviles (Frecuencia 5)
    # Verificamos que freq_5 refleje exactamente los últimos 5 sorteos previos de esa lotería y ni uno más
    active_history = [d for d in history if d["lottery"] == target["lottery"]]
    last_5_heads = [d["head_ambo"] for d in active_history[-5:]]
    f5_idx = f_names.index("freq_5")
    for i in range(100):
        num_str = f"{i:02d}"
        expected_f5 = last_5_heads.count(num_str)
        actual_f5 = X_orig[i, f5_idx]
        assert actual_f5 == expected_f5, f"Discrepancia en freq_5 para {num_str}: esperado {expected_f5}, obtenido {actual_f5}"
    print("[+] Test 3 (Causalidad estricta en ventana freq_5): Verificado OK")

    # Test 4: Target Alignment
    # Verificar que el target pertenezca únicamente al sorteo target
    actual_head_target = target["head_ambo"]
    head_int = int(actual_head_target)
    assert targets_orig["head"][head_int] == 1, "Target no coincide con la cabeza del sorteo objetivo!"
    assert targets_orig["head"].sum() == 1, "Debe haber exactamente un ambo objetivo a la cabeza!"
    print("[+] Test 4 (Alineación exacta de etiqueta supervisada): Verificado OK")

    print("\n[OK - EXITO]: Todos los tests de Data Leakage pasaron con CERO discrepancias.")

if __name__ == "__main__":
    run_leakage_tests()
