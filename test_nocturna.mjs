import { getClientPredictions, generateDeterministicBoard, auditDrawAgainstPredictions } from './frontend/src/services/clientEngine.js';
import { getMLPredictions } from './frontend/src/services/mlPredictionEngine.js';
import fs from 'fs';

const rawDraws = JSON.parse(fs.readFileSync('./frontend/public/api/draws.json', 'utf8'));

const ciudadNocturna = rawDraws['2026-09-04_ciudad_nocturna'];
const provinciaNocturna = rawDraws['2026-09-04_provincia_nocturna'];

console.log('=== CIUDAD NOCTURNA 2026-09-04 ===');
if (ciudadNocturna) {
  console.log('Cabeza:', ciudadNocturna.head_millar, 'Ambo:', ciudadNocturna.head_ambo);
  console.log('Pizarra 20:', ciudadNocturna.board);
} else {
  console.log('No draw found in draws.json');
}

console.log('\n=== PROVINCIA NOCTURNA 2026-09-04 ===');
if (provinciaNocturna) {
  console.log('Cabeza:', provinciaNocturna.head_millar, 'Ambo:', provinciaNocturna.head_ambo);
  console.log('Pizarra 20:', provinciaNocturna.board);
} else {
  console.log('No draw found in draws.json');
}

console.log('\n=== CLIENT PREDICTIONS (ESTADÍSTICO) FOR NOCTURNA ===');
const clientCiudad = getClientPredictions('ciudad', 'nocturna', 15);
console.log('Ciudad Nocturna Top 5:', clientCiudad.top_predictions.slice(0, 5).map(p => p.number));

const clientProv = getClientPredictions('provincia', 'nocturna', 15);
console.log('Provincia Nocturna Top 5:', clientProv.top_predictions.slice(0, 5).map(p => p.number));

const clientAll = getClientPredictions('all', 'nocturna', 15);
console.log('All Nocturna Top 5:', clientAll.top_predictions.slice(0, 5).map(p => p.number));

console.log('\n=== ML PREDICTIONS FOR NOCTURNA ===');
const mlCiudad = getMLPredictions('ciudad', 'nocturna', 15);
console.log('ML Ciudad Nocturna Top 5:', (mlCiudad.top_predictions || mlCiudad.predictions || []).slice(0, 5).map(p => p.number));

const mlProv = getMLPredictions('provincia', 'nocturna', 15);
console.log('ML Provincia Nocturna Top 5:', (mlProv.top_predictions || mlProv.predictions || []).slice(0, 5).map(p => p.number));

console.log('\n=== AUDIT DRAW AGAINST PREDICTIONS (WHAT DRAWS HISTORY TAB CALLS) ===');
if (ciudadNocturna) {
  const drawObj = {
    ...ciudadNocturna,
    p1: ciudadNocturna.head_millar
  };
  for (let i = 1; i <= 20; i++) drawObj[`p${i}`] = ciudadNocturna.board[i-1];
  const audit = auditDrawAgainstPredictions(drawObj, '2026-09-04', 'ciudad', 'nocturna');
  console.log('Ciudad Nocturna audit result:');
  console.log(JSON.stringify(audit, null, 2));
}

if (provinciaNocturna) {
  const drawObj = {
    ...provinciaNocturna,
    p1: provinciaNocturna.head_millar
  };
  for (let i = 1; i <= 20; i++) drawObj[`p${i}`] = provinciaNocturna.board[i-1];
  const audit = auditDrawAgainstPredictions(drawObj, '2026-09-04', 'provincia', 'nocturna');
  console.log('Provincia Nocturna audit result:');
  console.log(JSON.stringify(audit, null, 2));
}
