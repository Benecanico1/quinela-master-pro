import { 
  getMLPredictions, 
  getFourSystemsBenchmark, 
  getHistoricalTestV1Frozen, 
  simulateEconomicPerformanceClient, 
  detectPerformanceDegradation,
  auditDataLeakage,
  ML_MODEL_METADATA 
} from './src/services/mlPredictionEngine.js';

console.log("=== INICIANDO SUITE CIENTÍFICA AUTOMATIZADA (FASE 3) ===");

// 1. Simular LocalStorage
global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = v.toString(); },
  removeItem: function(k) { delete this.store[k]; }
};

// 2. Verificar Nomenclatura del Modelo
console.log("1. Verificando Nomenclatura Rigurosa...");
if (ML_MODEL_METADATA.version !== "Logistic Regression + Markov Features v1.0") {
  throw new Error(`Nomenclatura incorrecta: ${ML_MODEL_METADATA.version}`);
}
console.log("   OK: Versión =", ML_MODEL_METADATA.version);

// 3. Verificar Auditoría de Data Leakage
console.log("2. Verificando Función de Auditoría de Data Leakage...");
const validHistory = [
  { draw_date: "2026-08-01", shift: "primera" },
  { draw_date: "2026-08-02", shift: "matutina" }
];
auditDataLeakage(validHistory, "2026-08-03", "vespertina");
console.log("   OK: Historial válido aprobado.");

let leakageBlocked = false;
try {
  // Intentar predecir 2026-08-01 pasando historial que contiene 2026-08-02 (fuga futura)
  auditDataLeakage(validHistory, "2026-08-01", "primera");
} catch (e) {
  leakageBlocked = true;
  console.log("   OK: Data leakage detectado y bloqueado exitosamente ->", e.message);
}
if (!leakageBlocked) {
  throw new Error("FALLÓ LA DETECCIÓN DE DATA LEAKAGE: No se bloqueó fecha posterior");
}

// 4. Verificar Benchmark de los 4 Sistemas
console.log("3. Verificando Benchmark de los 4 Sistemas...");
const bm = getFourSystemsBenchmark();
if (bm.table.length !== 4) {
  throw new Error(`Se esperaban 4 sistemas, se obtuvieron ${bm.table.length}`);
}
console.log("   Sistemas evaluados:", bm.table.map(t => t.name).join(", "));
console.log("   ML Cabeza:", bm.table[0].head_hits, "| Pizarra:", bm.table[0].board_hits);
console.log("   Markov Cabeza:", bm.table[1].head_hits, "| Pizarra:", bm.table[1].board_hits);
console.log("   Azar Cabeza:", bm.table[2].head_hits, "| Pizarra:", bm.table[2].board_hits);
console.log("   Baseline Cabeza:", bm.table[3].head_hits, "| Pizarra:", bm.table[3].board_hits);

// 5. Verificar Histórico Congelado
console.log("4. Verificando Conjunto Congelado HISTORICAL_TEST_V1...");
const frozen = getHistoricalTestV1Frozen();
if (frozen.status !== "FROZEN_IMMUTABLE" || frozen.total_eval_draws !== 400) {
  throw new Error("Estado o tamaño de test congelado inválido");
}
console.log("   OK: HISTORICAL_TEST_V1 sellado inmutablemente con 400 sorteos.");

// 6. Probar Simulador Económico
console.log("5. Probando Simulador Económico...");
const econ = simulateEconomicPerformanceClient(100, "board", 5);
if (econ.totalDraws !== 400 || !econ.systems.ml || !econ.disclaimer) {
  throw new Error("Simulador económico falló");
}
console.log("   OK: ML Costo=$" + econ.systems.ml.totalCost + " | Retorno=$" + econ.systems.ml.grossReturn + " | ROI=" + econ.systems.ml.roiPct + "%");
console.log("   OK: Azar Costo=$" + econ.systems.random.totalCost + " | Retorno=$" + econ.systems.random.grossReturn + " | ROI=" + econ.systems.random.roiPct + "%");

// 7. Probar Monitor de Deterioro
console.log("6. Probando Monitor de Deterioro...");
const deg = detectPerformanceDegradation(50);
console.log("   OK: Estado =", deg.status_alert);

console.log("=== TODAS LAS PRUEBAS CIENTÍFICAS PASARON CON 100% DE ÉXITO ===");
