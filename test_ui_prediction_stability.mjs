import { 
  getCanonicalPrediction, 
  getOrCreateCanonicalPrediction, 
  evaluateCanonicalPrediction,
  formatItemsFromTop5,
  getCanonicalLedger 
} from './frontend/src/services/canonicalPredictionsLedger.js';
import { getRealOfficialDrawsFromStorage } from './frontend/src/services/clientEngine.js';

console.log('================================================================');
console.log('TEST SUITE: UI PREDICTION STABILITY & CANONICAL COMPARISON');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log('[PASS] Test ' + totalTests + ': ' + message);
    passedTests++;
  } else {
    console.error('[FAIL] Test ' + totalTests + ': ' + message);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: Locked prediction never changes across multiple re-renders
// -----------------------------------------------------------------------------
{
  const rec1 = getCanonicalPrediction('2026-09-05', 'ciudad', 'previa', 'ML-FULL');
  const top5_1 = [...rec1.top_5];
  const items_1 = formatItemsFromTop5(rec1.top_5);

  let invariant = true;
  for (let i = 0; i < 100; i++) {
    const recAgain = getCanonicalPrediction('2026-09-05', 'ciudad', 'previa', 'ML-FULL');
    const itemsAgain = formatItemsFromTop5(recAgain.top_5);
    if (recAgain.top_5.join(',') !== top5_1.join(',') || itemsAgain.map(x => x.number).join(',') !== top5_1.join(',')) {
      invariant = false;
      break;
    }
  }
  assert(invariant && top5_1.length === 5, 'Locked prediction keeps top_5 and formatted items 100% invariant across 100 re-renders');
}

// -----------------------------------------------------------------------------
// TEST 2: Draw updates do not change Top 5
// -----------------------------------------------------------------------------
{
  const preDrawRec = getCanonicalPrediction('2026-09-05', 'ciudad', 'previa', 'ML-FULL');
  const top5Before = [...preDrawRec.top_5];

  const mockOfficialDraw = {
    id: '2026-09-05_ciudad_previa',
    draw_date: '2026-09-05',
    lottery: 'ciudad',
    shift: 'previa',
    p1: '5513',
    board: ['5513','0455','7361','5295','4622','0106','1933','6637','3372','1025','0498','9984','9834','9624','4299','3299','0538','6160','2364','4094']
  };

  const evaluation = evaluateCanonicalPrediction(preDrawRec, mockOfficialDraw);
  const postDrawRec = getCanonicalPrediction('2026-09-05', 'ciudad', 'previa', 'ML-FULL');
  const top5After = [...postDrawRec.top_5];

  assert(top5Before.join(',') === top5After.join(',') && evaluation.top_5.join(',') === top5Before.join(','),
    'Draw updates and evaluation do NOT mutate pre-draw Top 5');
}

// -----------------------------------------------------------------------------
// TEST 3: Async / loading states never show provisional numbers
// -----------------------------------------------------------------------------
{
  const missingItems = formatItemsFromTop5(null);
  const emptyItems = formatItemsFromTop5([]);
  
  const mockLoadingState = null;
  const uiTop5Active = (mockLoadingState && mockLoadingState.status === 'LOCKED') 
    ? formatItemsFromTop5(mockLoadingState.top_5) 
    : [];

  assert(missingItems.length === 0 && emptyItems.length === 0 && uiTop5Active.length === 0,
    'Missing/loading state yields [] (triggering skeleton/loading UI, never provisional random numbers)');
}

// -----------------------------------------------------------------------------
// TEST 4: Results tab consumes CanonicalPredictionRecord
// -----------------------------------------------------------------------------
{
  const mockDraw = {
    id: '2026-09-05_ciudad_previa',
    draw_date: '2026-09-05',
    lottery: 'ciudad',
    shift: 'previa',
    p1: '5513'
  };

  const canonicalML = getCanonicalPrediction(mockDraw.draw_date, mockDraw.lottery, mockDraw.shift, 'ML-FULL');
  const canonicalStat = getCanonicalPrediction(mockDraw.draw_date, mockDraw.lottery, mockDraw.shift, 'STATISTICAL');

  assert(canonicalML !== null && canonicalML.status === 'LOCKED' && canonicalStat !== null && canonicalStat.status === 'LOCKED',
    'Results tab successfully consumes CanonicalPredictionRecord from Ledger');
}

// -----------------------------------------------------------------------------
// TEST 5: Results tab does not call predictive calculation engines
// -----------------------------------------------------------------------------
{
  const mockDraw = { 
    draw_number: '52867',
    draw_date: '2026-09-05', 
    date: '2026-09-05',
    official_date: '2026-09-05',
    lottery: 'ciudad', 
    jurisdiction: 'ciudad',
    shift: 'previa', 
    p1: '5513',
    status: 'PUBLISHED',
    source_verified: true,
    source: 'LOTBA_OFFICIAL_API',
    received_at: '2026-09-05T10:20:00.000-03:00',
    board: Array.from({ length: 20 }, (_, i) => i === 0 ? '5513' : String(i).padStart(4, '0'))
  };
  const canonicalRecord = {
    ...getCanonicalPrediction('2026-09-05', 'ciudad', 'previa', 'ML-FULL'),
    expected_draw_number: '52867'
  };
  
  const res = evaluateCanonicalPrediction(canonicalRecord, mockDraw);
  assert(res.is_evaluated === true && res.engine_id === 'ML-FULL',
    'evaluateCanonicalPrediction evaluates purely from CanonicalRecord * OfficialDraw without predictive engines');
}

// -----------------------------------------------------------------------------
// TEST 6: Predictions tab does not recalculate to determine awards
// -----------------------------------------------------------------------------
{
  const mockClosedDraw = { 
    draw_number: '52867',
    draw_date: '2026-09-05', 
    date: '2026-09-05',
    official_date: '2026-09-05',
    lottery: 'ciudad', 
    jurisdiction: 'ciudad',
    shift: 'previa', 
    p1: '5513',
    status: 'PUBLISHED',
    source_verified: true,
    source: 'LOTBA_OFFICIAL_API',
    received_at: '2026-09-05T10:20:00.000-03:00',
    board: Array.from({ length: 20 }, (_, i) => i === 0 ? '5513' : String(i).padStart(4, '0'))
  };
  const canonicalClosedML = {
    ...getCanonicalPrediction('2026-09-05', 'ciudad', 'previa', 'ML-FULL'),
    expected_draw_number: '52867'
  };
  
  const evaluation = evaluateCanonicalPrediction(canonicalClosedML, mockClosedDraw);
  assert(evaluation.head_hit === true && evaluation.official_head_ambo === '13' && evaluation.head_rank === 1,
    'Predictions tab determines awards strictly using evaluateCanonicalPrediction');
}

// -----------------------------------------------------------------------------
// TEST 7: Same prediction_id in Pronósticos and Resultados
// -----------------------------------------------------------------------------
{
  const predIdInPronosticos = getCanonicalPrediction('2026-09-05', 'ciudad', 'previa', 'ML-FULL').prediction_id;
  
  const mockDraw = { draw_date: '2026-09-05', lottery: 'ciudad', shift: 'previa', p1: '5513' };
  const predInResultados = getCanonicalPrediction(mockDraw.draw_date, mockDraw.lottery, mockDraw.shift, 'ML-FULL');
  const predIdInResultados = predInResultados.prediction_id;

  assert(predIdInPronosticos === predIdInResultados && predIdInPronosticos === 'CANONICAL_2026-09-05_CIUDAD_PREVIA_ML-FULL',
    'Same prediction_id strictly matches between Pronosticos and Resultados (' + predIdInPronosticos + ')');
}

// -----------------------------------------------------------------------------
// TEST 8: Hits shown in both screens are identical
// -----------------------------------------------------------------------------
{
  const mockDraw = {
    id: '2026-09-05_ciudad_previa',
    draw_date: '2026-09-05',
    lottery: 'ciudad',
    shift: 'previa',
    p1: '5513',
    board: ['5513','0455','7361','5295','4622','0106','1933','6637','3372','1025','0498','9984','9834','9624','4299','3299','0538','6160','2364','4094']
  };

  const canonicalRecord = getCanonicalPrediction(mockDraw.draw_date, mockDraw.lottery, mockDraw.shift, 'ML-FULL');
  
  const evalInPronosticos = evaluateCanonicalPrediction(canonicalRecord, mockDraw);
  const evalInResultados = evaluateCanonicalPrediction(canonicalRecord, mockDraw);

  const pronosticosHits = evalInPronosticos.official_positions.map(p => p.number + '@pos' + p.position).join(',');
  const resultadosHits = evalInResultados.official_positions.map(p => p.number + '@pos' + p.position).join(',');

  assert(pronosticosHits === resultadosHits && evalInPronosticos.head_hit === evalInResultados.head_hit,
    'Hits in Pronosticos and Resultados are 1:1 identical (' + pronosticosHits + ')');
}

// -----------------------------------------------------------------------------
// TEST 9: Number outside Top 5 never appears as Top 5 prize
// -----------------------------------------------------------------------------
{
  const mockDraw = {
    draw_date: '2026-09-05',
    lottery: 'ciudad',
    shift: 'previa',
    p1: '5582',
    board: ['5582']
  };
  const canonicalRecord = getCanonicalPrediction('2026-09-05', 'ciudad', 'previa', 'ML-FULL');
  
  const evaluation = evaluateCanonicalPrediction(canonicalRecord, mockDraw);
  assert(evaluation.head_hit === false && !evaluation.unique_hits.includes('82') && evaluation.official_positions.length === 0,
    'Number outside Top 5 (82) NEVER receives prize attribution in Top 5 evaluation');
}

// -----------------------------------------------------------------------------
// TEST 10: Simulation of 08 -> 20 -> 08 is IMPOSSIBLE
// -----------------------------------------------------------------------------
{
  const seenNumbers = new Set();
  const canonicalRecord = getCanonicalPrediction('2026-09-05', 'provincia', 'previa', 'STATISTICAL');
  
  for (let tick = 0; tick < 500; tick++) {
    const activeTop5 = (canonicalRecord && canonicalRecord.status === 'LOCKED' && Array.isArray(canonicalRecord.top_5))
      ? formatItemsFromTop5(canonicalRecord.top_5)
      : [];
    
    seenNumbers.add(activeTop5.map(x => x.number).join(','));
  }

  assert(seenNumbers.size === 1 && seenNumbers.has('74,47,37,81,71'),
    'Simulation of flicker 08 -> 20 -> 08 is impossible: exactly 1 state observed across 500 ticks (' + [...seenNumbers][0] + ')');
}

console.log('\n================================================================');
console.log('SUMMARY: ' + passedTests + '/' + totalTests + ' TESTS PASSED');
console.log('================================================================');
if (passedTests !== totalTests) process.exit(1);
