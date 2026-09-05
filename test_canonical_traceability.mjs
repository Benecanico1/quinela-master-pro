import assert from 'assert';
import fs from 'fs';
import path from 'path';

import { 
  getCanonicalLedger, 
  getCanonicalPrediction, 
  getOrCreateCanonicalPrediction, 
  saveCanonicalRecord, 
  evaluateCanonicalRecord, 
  recordCouponSnapshot, 
  getCouponSnapshots 
} from './frontend/src/services/canonicalPredictionsLedger.js';

import { 
  auditDrawAgainstPredictions, 
  auditDrawDetailed,
  generateDeterministicBoard
} from './frontend/src/services/clientEngine.js';

console.log("===============================================================================");
console.log("RUNNING SUITE: TEST CANONICAL TRACEABILITY & FALSE HIT PREVENTION");
console.log("===============================================================================\n");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`✅ [PASS] Test ${total}: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ [FAIL] Test ${total}: ${name}`);
    console.error(err);
  }
}

// TEST 1: DrawsHistoryTab.jsx does NOT import or call getMLPredictions or getClientPredictions
runTest("DrawsHistoryTab.jsx static analysis: no getMLPredictions or getClientPredictions calls", () => {
  const content = fs.readFileSync(path.resolve('./frontend/src/components/DrawsHistoryTab.jsx'), 'utf-8');
  assert(!content.includes("getMLPredictions("), "DrawsHistoryTab.jsx must not invoke getMLPredictions()");
  assert(!content.includes("getClientPredictions("), "DrawsHistoryTab.jsx must not invoke getClientPredictions()");
  assert(!content.includes("from '../services/mlPredictionEngine'"), "DrawsHistoryTab.jsx must not import from mlPredictionEngine");
});

// TEST 2: clientEngine.js auditDrawDetailed and auditDrawAgainstPredictions do not call getClientPredictions or getMLPredictions
runTest("clientEngine.js audit functions static analysis: strictly canonical without dynamic inference", () => {
  const content = fs.readFileSync(path.resolve('./frontend/src/services/clientEngine.js'), 'utf-8');
  const auditStartIndex = content.indexOf("export function auditDrawDetailed");
  const auditEndIndex = content.indexOf("export function generateDeterministicBoard");
  const auditDetailedCode = content.substring(auditStartIndex, auditEndIndex);
  
  assert(!auditDetailedCode.includes("getMLPredictions("), "auditDrawDetailed must not call getMLPredictions()");
  assert(!auditDetailedCode.includes("getClientPredictions("), "auditDrawDetailed must not call getClientPredictions()");
});

// TEST 3: Pre-seeded Ciudad Nocturna Canonical Record exists, is LOCKED, and has Top 5: 13, 20, 07, 55, 63
runTest("Ciudad Nocturna canonical record has exact top 5 [13, 20, 07, 55, 63] and status LOCKED", () => {
  const rec = getCanonicalPrediction('2026-09-04', 'ciudad', 'nocturna', 'STATISTICAL');
  assert(rec !== null, "Canonical record for Ciudad Nocturna Statistical must exist");
  assert.equal(rec.status, 'LOCKED', "Status must be LOCKED");
  assert.deepEqual(rec.top_5, ['13', '20', '07', '55', '63'], "Top 5 must strictly match [13, 20, 07, 55, 63]");
  assert.equal(rec.prediction_id, 'CANONICAL_2026-09-04_CIUDAD_NOCTURNA_STATISTICAL');
});

// TEST 4: Pure Evaluation for Ciudad Nocturna against Head 82 results in head_hit == false (False hit eradicated)
runTest("Ciudad Nocturna evaluation against Head 82 yields head_hit == false", () => {
  const rec = getCanonicalPrediction('2026-09-04', 'ciudad', 'nocturna', 'STATISTICAL');
  const mockOfficialDraw = {
    p1: '6582',
    head_millar: '6582',
    p12: '1107'
  };
  const evalRes = evaluateCanonicalRecord(rec, mockOfficialDraw);
  assert.equal(evalRes.head_hit, false, "Ambo 82 is NOT in top 5, head_hit must be FALSE");
  assert.equal(evalRes.status_text, "Cabeza: SIN ACIERTO", "Status text must indicate Cabeza: SIN ACIERTO");
});

// TEST 5: Pure Evaluation for Ciudad Nocturna with Ambo 07 at pos 12 yields hit_20 == true (Posición #12, 3.5x)
runTest("Ciudad Nocturna evaluation for Ambo 07 at pos 12 yields secondary hit at position 12 (3.5x)", () => {
  const rec = getCanonicalPrediction('2026-09-04', 'ciudad', 'nocturna', 'STATISTICAL');
  const mockOfficialDraw = {
    p1: '6582',
    head_millar: '6582',
    p12: '1107'
  };
  const evalRes = evaluateCanonicalRecord(rec, mockOfficialDraw);
  assert.equal(evalRes.is_hit, true, "is_hit must be true due to position 12");
  assert.equal(evalRes.hit_type, 'PIZARRA', "hit_type must be PIZARRA");
  const hit12 = evalRes.board_hits.find(h => h.position === 12);
  assert(hit12 !== undefined, "Hit at position 12 must be present");
  assert.equal(hit12.ambo, '07', "Hit ambo must be 07");
  assert.equal(hit12.multiplier, '3.5x (A los 20)', "Multiplier must be 3.5x (A los 20)");
});

// TEST 6: ML-FULL for Ciudad Nocturna returns INVALID or SIN PREDICCIÓN VÁLIDA REGISTRADA (No false cross-engine leak)
runTest("ML-FULL for Ciudad Nocturna has no pre-draw snapshot and returns INVALID", () => {
  const mlRec = getCanonicalPrediction('2026-09-04', 'ciudad', 'nocturna', 'ML-FULL');
  assert(mlRec !== null, "ML record should be registered as INVALID");
  assert.equal(mlRec.status, 'INVALID', "ML-FULL status must be INVALID");
  
  const mockOfficialDraw = { p1: '6582', p12: '1107' };
  const evalRes = evaluateCanonicalRecord(mlRec, mockOfficialDraw);
  assert.equal(evalRes.is_evaluated, false, "Invalid record must not evaluate hits");
  assert.equal(evalRes.message, "SIN PREDICCIÓN VÁLIDA REGISTRADA");
});

// TEST 7: Cross-Engine Isolation verified in auditDrawDetailed
runTest("auditDrawDetailed cross-engine isolation: Statistical has 07 at pos 12, ML has INVALID", () => {
  const mockOfficialDraw = { p1: '6582', p12: '1107' };
  const dualAudit = auditDrawDetailed(mockOfficialDraw, '2026-09-04', 'ciudad', 'nocturna');
  
  assert.equal(dualAudit.statistical.is_hit, true, "Statistical must register hit");
  assert.equal(dualAudit.statistical.hit_type, 'PIZARRA', "Statistical hit_type must be PIZARRA");
  assert.equal(dualAudit.statistical.number, '07', "Statistical hit number must be 07");
  
  assert.equal(dualAudit.ml.is_hit, false, "ML must not claim any hit");
  assert.equal(dualAudit.ml.hit_type, 'NO_RECORD', "ML hit_type must be NO_RECORD");
  assert.equal(dualAudit.ml.status_text, 'SIN PREDICCIÓN VÁLIDA REGISTRADA');
});

// TEST 8: Immutability invariant: attempting to modify a LOCKED record throws Error
runTest("Immutability violation check: attempting to modify a LOCKED record throws Error", () => {
  const rec = getCanonicalPrediction('2026-09-04', 'ciudad', 'nocturna', 'STATISTICAL');
  assert.throws(() => {
    saveCanonicalRecord({
      ...rec,
      top_5: ['82', '20', '07', '55', '63'] // Tampering attempt with 82
    });
  }, /CRITICAL_IMMUTABILITY_VIOLATION/);
});

// TEST 9: Prohibiting retrospective prediction generation after draw deadline
runTest("Retrospective generation after deadline returns INVALID with message", () => {
  const pastRec = getOrCreateCanonicalPrediction('2026-09-01', 'ciudad', 'matutina', 'STATISTICAL');
  assert.equal(pastRec.status, 'INVALID', "Record created after deadline must be INVALID");
  assert(pastRec.message.includes("Generación retrospectiva prohibida"));
});

// TEST 10: Coupon snapshot recording stores exact prediction_id and exact_top5_displayed
runTest("Coupon snapshot recording stores exact prediction_id and exact_top5_displayed", () => {
  const snapshot = recordCouponSnapshot({
    prediction_id: 'CANONICAL_2026-09-04_CIUDAD_NOCTURNA_STATISTICAL',
    exact_top5_displayed: ['13', '20', '07', '55', '63'],
    engine: 'STATISTICAL',
    jurisdiction: 'ciudad',
    shift: 'nocturna'
  });

  assert.equal(snapshot.prediction_id, 'CANONICAL_2026-09-04_CIUDAD_NOCTURNA_STATISTICAL');
  assert.deepEqual(snapshot.exact_top5_displayed, ['13', '20', '07', '55', '63']);
  assert.equal(snapshot.engine, 'STATISTICAL');
});

console.log("\n===============================================================================");
console.log(`TEST RESULTS: ${passed} / ${total} SUCCEEDED (${((passed / total) * 100).toFixed(1)}%)`);
console.log("===============================================================================");

if (passed !== total) {
  process.exit(1);
} else {
  console.log("ALL MANDATORY REQUIREMENTS VERIFIED.");
}
