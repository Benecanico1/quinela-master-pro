import { 
  getCanonicalPrediction, 
  evaluateCanonicalPrediction,
  formatItemsFromTop5,
  ALLOWED_OFFICIAL_SOURCES
} from './frontend/src/services/canonicalPredictionsLedger.js';

console.log('================================================================');
console.log('TEST SUITE: PREMATURE RESULT, SHIFT ISOLATION & GATE HARDENING');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] Test ${totalTests}: ${message}`);
    passedTests++;
  } else {
    console.error(`[FAIL] Test ${totalTests}: ${message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// TEST 1: Draw time alcanzado sin resultado oficial -> Ningún premio aparece
// -----------------------------------------------------------------------------
{
  const matutinaRecord = {
    ...getCanonicalPrediction('2026-09-05', 'ciudad', 'matutina', 'ML-FULL'),
    expected_draw_number: '52869'
  };
  const res = evaluateCanonicalPrediction(matutinaRecord, null);
  assert(
    res.is_evaluated === false &&
    res.evaluation_allowed === false &&
    res.head_hit === false &&
    res.is_hit === false &&
    res.unique_hits.length === 0 &&
    res.official_positions.length === 0 &&
    res.status_text === 'ESPERANDO RESULTADO OFICIAL',
    'Draw time alcanzado sin resultado oficial: CERO premios, CERO aciertos, status ESPERANDO RESULTADO OFICIAL'
  );
}

// -----------------------------------------------------------------------------
// TEST 2: Resultado de Primera cargado mientras se evalúa Matutina -> No se evalúa
// -----------------------------------------------------------------------------
{
  const matutinaRecord = {
    ...getCanonicalPrediction('2026-09-05', 'ciudad', 'matutina', 'ML-FULL'),
    expected_draw_number: '52869'
  };
  const primeraDraw = {
    draw_number: '52868',
    date: '2026-09-05',
    official_date: '2026-09-05',
    shift: 'primera',
    jurisdiction: 'ciudad',
    status: 'PUBLISHED',
    source_verified: true,
    source: 'LOTBA_OFFICIAL_API',
    received_at: '2026-09-05T12:15:00.000-03:00',
    board: Array.from({ length: 20 }, (_, i) => String(i).padStart(4, '0'))
  };
  const res = evaluateCanonicalPrediction(matutinaRecord, primeraDraw);
  assert(
    res.is_evaluated === false &&
    res.is_hit === false &&
    res.status_text === 'ESPERANDO RESULTADO OFICIAL',
    'Resultado de Primera recibido no puede evaluar Matutina (Shift & Draw Number mismatch rejected)'
  );
}

// -----------------------------------------------------------------------------
// TEST 3: Resultado Matutina Ciudad no puede evaluar Provincia
// -----------------------------------------------------------------------------
{
  const provinciaRecord = {
    ...getCanonicalPrediction('2026-09-05', 'provincia', 'matutina', 'ML-FULL'),
    expected_draw_number: '49727'
  };
  const ciudadDraw = {
    draw_number: '52869',
    date: '2026-09-05',
    official_date: '2026-09-05',
    shift: 'matutina',
    jurisdiction: 'ciudad',
    status: 'PUBLISHED',
    source_verified: true,
    source: 'LOTBA_OFFICIAL_API',
    received_at: '2026-09-05T15:20:00.000-03:00',
    board: Array.from({ length: 20 }, (_, i) => String(i).padStart(4, '0'))
  };
  const res = evaluateCanonicalPrediction(provinciaRecord, ciudadDraw);
  assert(
    res.is_evaluated === false &&
    res.is_hit === false &&
    res.status_text === 'ESPERANDO RESULTADO OFICIAL',
    'Resultado Matutina Ciudad no puede evaluar Provincia (Jurisdiction & Draw Number mismatch rejected)'
  );
}

// -----------------------------------------------------------------------------
// TEST 4: Resultado de fecha anterior no puede evaluar fecha actual
// -----------------------------------------------------------------------------
{
  const todayRecord = {
    ...getCanonicalPrediction('2026-09-05', 'ciudad', 'matutina', 'ML-FULL'),
    expected_draw_number: '52869'
  };
  const yesterdayDraw = {
    draw_number: '52864',
    date: '2026-09-04',
    official_date: '2026-09-04',
    shift: 'matutina',
    jurisdiction: 'ciudad',
    status: 'PUBLISHED',
    source_verified: true,
    source: 'LOTBA_OFFICIAL_API',
    received_at: '2026-09-04T15:20:00.000-03:00',
    board: Array.from({ length: 20 }, (_, i) => String(i).padStart(4, '0'))
  };
  const res = evaluateCanonicalPrediction(todayRecord, yesterdayDraw);
  assert(
    res.is_evaluated === false &&
    res.is_hit === false &&
    res.status_text === 'ESPERANDO RESULTADO OFICIAL',
    'Resultado de fecha anterior (2026-09-04) no puede evaluar fecha actual (Date mismatch rejected)'
  );
}

// -----------------------------------------------------------------------------
// TEST 5: Matutina -> Vespertina: Top5 Matutina jamás aparece en Vespertina
// -----------------------------------------------------------------------------
{
  const matutinaML = getCanonicalPrediction('2026-09-05', 'ciudad', 'matutina', 'ML-FULL');
  const matutinaTop5 = matutinaML ? matutinaML.top_5.join(',') : '';

  const vespertinaML = getCanonicalPrediction('2026-09-05', 'ciudad', 'vespertina', 'ML-FULL');
  const vespertinaRenderedTop5 = vespertinaML ? vespertinaML.top_5.join(',') : '';

  assert(
    matutinaTop5 !== '' &&
    vespertinaRenderedTop5 !== matutinaTop5,
    `Top 5 Matutina (${matutinaTop5}) jamás se transfiere ni arrastra a Vespertina (Rendered: "${vespertinaRenderedTop5}")`
  );
}

// -----------------------------------------------------------------------------
// TEST 6: Turno sin registrar (Nocturna) devuelve null y lista vacía []
// -----------------------------------------------------------------------------
{
  const vespertinaRecord = getCanonicalPrediction('2026-09-05', 'ciudad', 'vespertina', 'ML-FULL');
  const nocturnaRecord = getCanonicalPrediction('2026-09-05', 'ciudad', 'nocturna', 'ML-FULL');
  const nocturnaItems = nocturnaRecord ? formatItemsFromTop5(nocturnaRecord.top_5) : [];
  assert(
    vespertinaRecord !== null && vespertinaRecord.status === 'LOCKED' &&
    nocturnaRecord === null && nocturnaItems.length === 0,
    'Vespertina tiene registro LOCKED válido; Turno sin registrar (Nocturna) devuelve null y lista vacía [] (Garantiza "SIN PRONÓSTICO SELLADO")'
  );
}

// =============================================================================
// HARDENED OFFICIAL RESULT GATE UNIT TESTS (TRACEABILITY_V1 REQUIREMENTS)
// =============================================================================

const baseValidRecord = {
  prediction_id: 'CANONICAL_2026-09-05_CIUDAD_VESPERTINA_ML-FULL',
  date: '2026-09-05',
  jurisdiction: 'ciudad',
  shift: 'vespertina',
  draw_time: '18:00',
  deadline: '2026-09-05T18:00:00.000-03:00',
  expected_draw_number: '52870',
  top_5: ['10', '20', '30', '40', '50'],
  status: 'LOCKED',
  prediction_hash: 'aabbcc112233'
};

const baseValidDraw = {
  draw_number: '52870',
  date: '2026-09-05',
  official_date: '2026-09-05',
  extract_date: '2026-09-05',
  shift: 'vespertina',
  jurisdiction: 'ciudad',
  status: 'PUBLISHED',
  source_verified: true,
  source: 'LOTBA_OFFICIAL_API',
  received_at: '2026-09-05T18:25:00.000-03:00',
  p1: '7610',
  board: [
    '7610', '1234', '5678', '9012', '3456',
    '7890', '2345', '6789', '0123', '4567',
    '8901', '2345', '6789', '0123', '4567',
    '8901', '2345', '6789', '0123', '4567'
  ]
};

// -----------------------------------------------------------------------------
// TEST 7: expected_draw_number ausente -> rechazo con INVALID_MISSING_EXPECTED_DRAW_NUMBER
// -----------------------------------------------------------------------------
{
  const recordMissingExpected = {
    ...baseValidRecord,
    expected_draw_number: undefined
  };
  const res = evaluateCanonicalPrediction(recordMissingExpected, baseValidDraw);
  assert(
    res.is_evaluated === false &&
    res.evaluation_allowed === false &&
    res.status === 'INVALID_MISSING_EXPECTED_DRAW_NUMBER' &&
    res.status_text === '❌ Sin número de sorteo esperado',
    'expected_draw_number ausente -> rechazo con status INVALID_MISSING_EXPECTED_DRAW_NUMBER'
  );
}

// -----------------------------------------------------------------------------
// TEST 8: draw_number mismatch -> rechazo
// -----------------------------------------------------------------------------
{
  const drawMismatch = {
    ...baseValidDraw,
    draw_number: '52871' // Mismatch vs expected 52870
  };
  const res = evaluateCanonicalPrediction(baseValidRecord, drawMismatch);
  assert(
    res.is_evaluated === false &&
    res.evaluation_allowed === false &&
    res.status === 'WAITING_OFFICIAL_RESULT',
    'draw_number mismatch (52871 vs 52870) -> rechazo genérico (WAITING_OFFICIAL_RESULT)'
  );
}

// -----------------------------------------------------------------------------
// TEST 9: source_verified undefined -> rechazo
// -----------------------------------------------------------------------------
{
  const drawUndefinedSourceVerified = {
    ...baseValidDraw,
    source_verified: undefined
  };
  const res = evaluateCanonicalPrediction(baseValidRecord, drawUndefinedSourceVerified);
  assert(
    res.is_evaluated === false &&
    res.evaluation_allowed === false &&
    res.status === 'WAITING_OFFICIAL_RESULT',
    'source_verified undefined -> rechazo'
  );
}

// -----------------------------------------------------------------------------
// TEST 10: source_verified false -> rechazo
// -----------------------------------------------------------------------------
{
  const drawFalseSourceVerified = {
    ...baseValidDraw,
    source_verified: false
  };
  const res = evaluateCanonicalPrediction(baseValidRecord, drawFalseSourceVerified);
  assert(
    res.is_evaluated === false &&
    res.evaluation_allowed === false &&
    res.status === 'WAITING_OFFICIAL_RESULT',
    'source_verified false -> rechazo'
  );
}

// -----------------------------------------------------------------------------
// TEST 11: official date ausente -> rechazo
// -----------------------------------------------------------------------------
{
  const drawMissingOfficialDate = {
    ...baseValidDraw,
    official_date: undefined,
    extract_date: undefined,
    verified_date: undefined
  };
  const res = evaluateCanonicalPrediction(baseValidRecord, drawMissingOfficialDate);
  assert(
    res.is_evaluated === false &&
    res.evaluation_allowed === false &&
    res.status === 'WAITING_OFFICIAL_RESULT',
    'official date metadata ausente (sin official_date/extract_date/verified_date) -> rechazo'
  );
}

// -----------------------------------------------------------------------------
// TEST 12: resultado oficial válido completo -> PASS
// -----------------------------------------------------------------------------
{
  const res = evaluateCanonicalPrediction(baseValidRecord, baseValidDraw);
  assert(
    res.is_evaluated === true &&
    res.evaluation_allowed === true &&
    res.head_hit === true &&
    res.official_head_ambo === '10' &&
    res.head_rank === 1 &&
    res.head_multiplier === '70x (A la Cabeza)' &&
    res.expected_draw_number === '52870' &&
    res.official_draw_number === '52870',
    'resultado oficial válido completo -> PASS (is_evaluated=true, evaluation_allowed=true, CABEZA 70x verificado)'
  );
}

// -----------------------------------------------------------------------------
// TEST 13: sorteo histórico con draw_number diferente -> rechazo genérico
// -----------------------------------------------------------------------------
{
  const historicalDraw = {
    ...baseValidDraw,
    draw_number: '52864', // Draw number from Friday Matutina
    official_date: '2026-09-05' // Injected date attempt
  };
  const res = evaluateCanonicalPrediction(baseValidRecord, historicalDraw);
  assert(
    res.is_evaluated === false &&
    res.evaluation_allowed === false &&
    res.status === 'WAITING_OFFICIAL_RESULT',
    'sorteo histórico con draw_number diferente (52864 vs 52870) -> rechazo genérico sin hardcode'
  );
}

// -----------------------------------------------------------------------------
// TEST 14: officialDraw status != PUBLISHED -> is_evaluated = false
// -----------------------------------------------------------------------------
{
  const draftDraw = {
    ...baseValidDraw,
    status: 'DRAFT_ESTIMATED'
  };
  const res = evaluateCanonicalPrediction(baseValidRecord, draftDraw);
  assert(
    res.is_evaluated === false && res.head_hit === false,
    'officialDraw con status distinto a PUBLISHED produce is_evaluated = false'
  );
}

// -----------------------------------------------------------------------------
// TEST 15: officialDraw.board.length != 20 -> is_evaluated = false
// -----------------------------------------------------------------------------
{
  const incompleteDraw = {
    ...baseValidDraw,
    board: ['2663', '2061'] // only 2 numbers
  };
  const res = evaluateCanonicalPrediction(baseValidRecord, incompleteDraw);
  assert(
    res.is_evaluated === false && res.head_hit === false,
    'officialDraw con board incompleto (longitud != 20) produce is_evaluated = false'
  );
}

console.log('\n================================================================');
console.log(`SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('================================================================');
if (passedTests !== totalTests) process.exit(1);
