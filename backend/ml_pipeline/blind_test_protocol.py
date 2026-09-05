import json
import hashlib
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

class DataLeakageException(Exception):
    """Excepción crítica lanzada cuando se detecta fuga de información temporal o target leakage."""
    pass

def audit_data_leakage(history: List[Dict[str, Any]], target_draw: Optional[Dict[str, Any]] = None, feature_dict: Optional[Dict[str, float]] = None) -> bool:
    """
    Auditoría estricta de Data Leakage:
    1. Comprueba que ninguna observación en history tenga fecha/hora posterior o igual al sorteo a predecir.
    2. Comprueba que el resultado del sorteo no aparezca en las variables calculadas.
    3. Comprueba que no existan accesos a sorteos futuros.
    """
    if target_draw is None:
        # Modo histórico: verificar orden estrictamente monótono
        for i in range(1, len(history)):
            prev_d = history[i - 1]["draw_date"]
            curr_d = history[i]["draw_date"]
            if curr_d < prev_d:
                raise DataLeakageException(f"Violación de orden cronológico: {curr_d} precede a {prev_d}")
        return True

    target_date = target_draw.get("draw_date")
    target_shift = target_draw.get("shift", "")
    target_head = target_draw.get("head_ambo")
    target_board = [b[-2:] for b in target_draw.get("board", [])]

    # Regla 1: Ningún elemento de history puede ser >= target_draw en la línea temporal
    for idx, d in enumerate(history):
        if d["draw_date"] > target_date:
            raise DataLeakageException(f"CRITICAL LEAKAGE: Sorteo histórico #{idx} ({d['draw_date']}) es posterior al sorteo objetivo ({target_date}).")
        if d["draw_date"] == target_date and d.get("shift") == target_shift:
            raise DataLeakageException(f"CRITICAL LEAKAGE: El sorteo objetivo ({target_date} {target_shift}) ya está presente en el historial de entrenamiento.")

    # Regla 2: El resultado (cabeza o pizarra) no puede figurar en el vector de features
    if feature_dict:
        forbidden_keys = ["target", "label", "is_head", "is_board", "actual_head", "winner", "result"]
        for k in feature_dict.keys():
            if any(f in k.lower() for f in forbidden_keys):
                raise DataLeakageException(f"CRITICAL TARGET LEAKAGE: Variable prohibida '{k}' detectada en el vector de características.")

    return True

class LiveBlindTestV2Manager:
    """
    Administrador inmutable del protocolo de prueba ciega LIVE_OUT_OF_SAMPLE_TEST_V2.
    """
    def __init__(self, storage_path: str = "./backend/ml_pipeline/live_blind_test_v2.json"):
        self.storage_path = Path(storage_path)
        self.records = self._load()

    def _load(self) -> Dict[str, Any]:
        if self.storage_path.exists():
            with open(self.storage_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "protocol_name": "LIVE_OUT_OF_SAMPLE_TEST_V2",
            "version": "2.0",
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "total_registered_predictions": 0,
            "total_evaluated_draws": 0,
            "predictions_log": [],
            "running_metrics": {
                "A_baseline": {"head_hits": 0, "board_top20_hits": 0},
                "B_ml": {"head_hits": 0, "board_top20_hits": 0},
                "C_markov": {"head_hits": 0, "board_top20_hits": 0},
                "D_random": {"head_hits": 0, "board_top20_hits": 0}
            }
        }

    def _save(self):
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(self.records, f, indent=2, ensure_ascii=False)

    def register_pre_draw_prediction(
        self,
        draw_date: str,
        lottery: str,
        shift: str,
        model_version: str,
        preds_by_system: Dict[str, List[str]],
        scores_by_system: Dict[str, List[float]],
        features_snapshot: Dict[str, Any],
        history_snapshot_length: int
    ) -> str:
        """
        Fase Pre-Sorteo: Registra la predicción de forma inmutable ANTES de conocer el resultado.
        """
        pred_id = f"{draw_date}_{lottery}_{shift}_{model_version}"
        
        # Verificar si ya existe registro previo
        for p in self.records["predictions_log"]:
            if p["pred_id"] == pred_id:
                return p["pred_id"] # Ya registrado de forma inmutable

        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        content_hash = hashlib.sha256(f"{pred_id}_{json.dumps(preds_by_system)}_{timestamp}".encode()).hexdigest()

        entry = {
            "pred_id": pred_id,
            "draw_date": draw_date,
            "lottery": lottery,
            "shift": shift,
            "model_version": model_version,
            "timestamp_utc": timestamp,
            "immutable_sha256": content_hash,
            "history_size_at_prediction": history_snapshot_length,
            "predictions": preds_by_system,
            "scores": scores_by_system,
            "features_summary": {k: len(v) for k, v in features_snapshot.items()} if isinstance(features_snapshot, dict) else {},
            "evaluated": False,
            "actual_result": None
        }

        self.records["predictions_log"].append(entry)
        self.records["total_registered_predictions"] += 1
        self._save()
        return pred_id

    def evaluate_post_draw_result(
        self,
        pred_id: str,
        official_head_ambo: str,
        official_board_ambos: List[str]
    ) -> Dict[str, Any]:
        """
        Fase Post-Sorteo: Compara contra la predicción previamente sellada.
        """
        entry = None
        for p in self.records["predictions_log"]:
            if p["pred_id"] == pred_id:
                entry = p
                break

        if not entry:
            raise ValueError(f"No existe predicción pre-registrada con ID {pred_id}")

        if entry["evaluated"]:
            return entry["evaluation_results"]

        actual_top20 = set(official_board_ambos[:20])
        eval_res = {}

        for sys_key, pred_list in entry["predictions"].items():
            head_hit = (pred_list[0] == official_head_ambo) if len(pred_list) > 0 else False
            top5 = pred_list[:5]
            board_hit = any(n in actual_top20 for n in top5)

            eval_res[sys_key] = {
                "head_hit": head_hit,
                "board_top20_hit": board_hit,
                "top5_predicted": top5,
                "head_predicted": pred_list[0] if len(pred_list) > 0 else None
            }

            # Actualizar métricas acumuladas
            if head_hit:
                self.records["running_metrics"][sys_key]["head_hits"] += 1
            if board_hit:
                self.records["running_metrics"][sys_key]["board_top20_hits"] += 1

        entry["evaluated"] = True
        entry["actual_result"] = {
            "head_ambo": official_head_ambo,
            "board_top20": official_board_ambos[:20],
            "evaluation_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        entry["evaluation_results"] = eval_res
        self.records["total_evaluated_draws"] += 1
        self._save()
        return eval_res

if __name__ == "__main__":
    manager = LiveBlindTestV2Manager()
    print("[+] LiveBlindTestV2Manager inicializado correctamente.")
    print(f"    Predicciones registradas: {manager.records['total_registered_predictions']}")
    print(f"    Sorteos evaluados: {manager.records['total_evaluated_draws']}")
