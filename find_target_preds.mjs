import { getClientPredictions, getClientFrequencies, getClientBacktest } from './frontend/src/services/clientEngine.js';
import { getMLPredictions } from './frontend/src/services/mlPredictionEngine.js';

const target = ['13', '20', '07', '55', '63'];
console.log('Searching for target set:', target);

const lotteries = ['all', 'ciudad', 'provincia'];
const shifts = ['auto', 'todo_el_dia', 'la_previa', 'primera', 'matutina', 'vespertina', 'nocturna'];
const dates = [null, '2026-09-04', '2026-09-03', '2026-09-02'];

for (const lot of lotteries) {
  for (const sh of shifts) {
    for (const d of dates) {
      try {
        const resStat = getClientPredictions(lot, sh, 10, d);
        const statNums = (resStat.top_predictions || []).map(p => p.number);
        const matchStat = target.filter(n => statNums.includes(n));
        if (matchStat.length >= 3) {
          console.log('MATCH Stat:', lot, sh, d, statNums.slice(0, 7), 'matched:', matchStat);
        }

        const resMl = getMLPredictions(lot, sh, 10, d);
        const mlNums = (resMl.top_predictions || []).map(p => p.number);
        const matchMl = target.filter(n => mlNums.includes(n));
        if (matchMl.length >= 3) {
          console.log('MATCH ML:', lot, sh, d, mlNums.slice(0, 7), 'matched:', matchMl);
        }
      } catch (e) {}
    }
  }
}
