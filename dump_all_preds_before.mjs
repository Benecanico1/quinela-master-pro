import { getClientPredictions } from './frontend/src/services/clientEngine.js';
import { getMLPredictions } from './frontend/src/services/mlPredictionEngine.js';

const shifts = ['la_previa', 'primera', 'matutina', 'vespertina', 'nocturna', 'todo_el_dia'];
const lots = ['all', 'ciudad', 'provincia'];

console.log('=== CLIENT PREDICTIONS (BEFORE 2026-09-04) ===');
for (const s of shifts) {
  for (const l of lots) {
    try {
      const res = getClientPredictions(l, s, 5, '2026-09-04');
      console.log('Stat', l, s, (res.top_predictions || []).map(p => p.number).join(', '));
    } catch (e) {
      console.log('Stat', l, s, 'ERROR', e.message);
    }
  }
}

console.log('=== ML PREDICTIONS (BEFORE 2026-09-04) ===');
for (const s of shifts) {
  for (const l of lots) {
    try {
      const res = getMLPredictions(l, s, 5, '2026-09-04');
      console.log('ML', l, s, (res.top_predictions || []).map(p => p.number).join(', '));
    } catch (e) {
      console.log('ML', l, s, 'ERROR', e.message);
    }
  }
}
