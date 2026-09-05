/**
 * PRE-DRAW CANONICAL PREDICTIONS SERVICE (TRACEABILITY_V1)
 * 
 * Orchestrates pre-draw prediction locking:
 * 1. Generates predictions before deadline.
 * 2. Creates CanonicalPredictionRecord before displaying numbers.
 * 3. Persists record in Canonical Predictions Ledger.
 * 4. Generates SHA-256 hash.
 * 5. Locks record (status: LOCKED).
 * 6. Guarantees UI_TOP5 === CanonicalPredictionRecord.top_5.
 */

import { 
  computeSHA256, 
  getCanonicalLedger, 
  saveCanonicalRecord, 
  getCanonicalPrediction 
} from './canonicalPredictionsLedger.js';
import { 
  getClientPredictions, 
  SIGNIFICADOS, 
  OFFICIAL_SHIFTS_SCHEDULE 
} from './clientEngine.js';
import { getMLPredictions } from './mlPredictionEngine.js';

export function getOrLockUpcomingCanonicalPrediction(dateStr, jurisdiction, shift, engineId) {
  if (!dateStr || !jurisdiction || !shift || !engineId) {
    return null;
  }
  const cleanJur = String(jurisdiction).toLowerCase();
  const cleanShift = String(shift).toLowerCase().replace('la_', '');
  const cleanEngine = String(engineId).toUpperCase();
  const predId = `CANONICAL_${dateStr}_${cleanJur.toUpperCase()}_${cleanShift.toUpperCase()}_${cleanEngine}`;

  // 1. Check if already exists in Ledger
  const ledger = getCanonicalLedger();
  if (ledger[predId]) {
    return ledger[predId];
  }

  // 2. Resolve official schedule & deadline
  const shiftSchedule = OFFICIAL_SHIFTS_SCHEDULE.find(s => s.id === cleanShift) || { time: '10:15' };
  const drawDeadlineDate = new Date(`${dateStr}T${shiftSchedule.time}:00.000-03:00`);
  const now = new Date();

  // If already past deadline, retrospective generation is strictly prohibited
  if (now >= drawDeadlineDate) {
    return {
      prediction_id: predId,
      date: dateStr,
      jurisdiction: cleanJur,
      shift: cleanShift,
      draw_time: shiftSchedule.time,
      engine_id: cleanEngine,
      engine_name: cleanEngine === 'ML-FULL' ? 'ML-FULL (Champion)' : 'Motor Estadístico',
      top_5: [],
      top_10: [],
      top_20: [],
      created_at: null,
      locked_at: null,
      deadline: drawDeadlineDate.toISOString(),
      visible_to_user: false,
      status: 'INVALID',
      message: 'SIN PREDICCIÓN VÁLIDA REGISTRADA (Generación retrospectiva prohibida)',
      prediction_hash: null,
      items: []
    };
  }

  // 3. Generate predictions pre-draw
  let top5Ambos = [];
  let items = [];

  if (cleanEngine === 'ML-FULL') {
    const mlRes = getMLPredictions(cleanJur, cleanShift, 5, dateStr);
    top5Ambos = (mlRes.top_predictions || []).map(p => p.number);
    items = (mlRes.top_predictions || []).map(p => ({
      number: p.number,
      significado: p.significado || SIGNIFICADOS[p.number] || 'La Suerte',
      score: p.composite_score || 85,
      suggested_centenas: p.suggested_centenas || [`7${p.number}`],
      suggested_millar: p.suggested_millar || [`17${p.number}`]
    }));
  } else {
    const statRes = getClientPredictions(cleanJur, cleanShift, 5);
    const list = statRes.top_predictions || statRes.predictions || [];
    top5Ambos = list.slice(0, 5).map(p => p.number);
    items = list.slice(0, 5).map(p => ({
      number: p.number,
      significado: p.significado || SIGNIFICADOS[p.number] || 'La Suerte',
      score: p.composite_score || p.predictive_score || 80,
      suggested_centenas: p.suggested_centenas || [`7${p.number}`],
      suggested_millar: p.suggested_millar || [`17${p.number}`]
    }));
  }

  // 4. Compute cryptographic SHA-256 seal
  const hashString = `${predId}:${dateStr}:${cleanJur}:${cleanShift}:${cleanEngine}:${top5Ambos.join(',')}`;
  const predictionHash = computeSHA256(hashString);
  const nowIso = now.toISOString();

  // 5. Create CanonicalPredictionRecord locked pre-draw
  const record = {
    prediction_id: predId,
    date: dateStr,
    jurisdiction: cleanJur,
    shift: cleanShift,
    draw_time: shiftSchedule.time,
    engine_id: cleanEngine,
    engine_name: cleanEngine === 'ML-FULL' ? 'ML-FULL (Champion)' : 'Motor Estadístico',
    top_5: top5Ambos,
    top_10: top5Ambos,
    top_20: top5Ambos,
    created_at: nowIso,
    locked_at: nowIso,
    deadline: `${dateStr}T${shiftSchedule.time}:00.000-03:00`,
    visible_to_user: true,
    status: 'LOCKED',
    prediction_hash: predictionHash,
    items
  };

  // 6. Persist to ledger and return
  return saveCanonicalRecord(record);
}

export function ensureAllUpcomingCanonicalRecords(dateStr, shift) {
  if (!dateStr || !shift) return {};
  const cleanShift = String(shift).toLowerCase().replace('la_', '');
  const records = {
    ciudad_ml: getOrLockUpcomingCanonicalPrediction(dateStr, 'ciudad', cleanShift, 'ML-FULL'),
    ciudad_stat: getOrLockUpcomingCanonicalPrediction(dateStr, 'ciudad', cleanShift, 'STATISTICAL'),
    provincia_ml: getOrLockUpcomingCanonicalPrediction(dateStr, 'provincia', cleanShift, 'ML-FULL'),
    provincia_stat: getOrLockUpcomingCanonicalPrediction(dateStr, 'provincia', cleanShift, 'STATISTICAL'),
  };
  return records;
}
