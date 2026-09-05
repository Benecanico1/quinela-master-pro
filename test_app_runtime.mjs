import React from 'react';
import { getMLPredictions, getThreeSystemBenchmark, ML_MODEL_METADATA } from './frontend/src/services/mlPredictionEngine.js';
import { getClientPredictions, getClientFrequencies, getClientBacktest, getCurrentActiveShift } from './frontend/src/services/clientEngine.js';

console.log("=== INICIANDO PRUEBAS DE CARGA EN RUNTIME ===");

// 1. Simular LocalStorage
global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = v.toString(); },
  removeItem: function(k) { delete this.store[k]; }
};

// 2. Probar clientEngine
console.log("1. Probando clientEngine...");
const currentShift = getCurrentActiveShift();
console.log("   Current Active Shift:", currentShift.name);

const clientPreds = getClientPredictions('all', 'auto', 15);
console.log("   Client Predictions count:", clientPreds.top_predictions.length);

const clientFreqs = getClientFrequencies('all', 'all', 'head');
console.log("   Client Frequencies count:", Object.keys(clientFreqs).length);

const clientBt = getClientBacktest('all', 'auto', 30);
console.log("   Client Backtest head hit rate:", clientBt.head_hit_rate);

// 3. Probar mlPredictionEngine
console.log("2. Probando mlPredictionEngine...");
const mlPreds = getMLPredictions('all', 'auto', 15);
console.log("   ML Predictions count:", mlPreds.predictions.length);
console.log("   Top 1 ML ambo:", mlPreds.predictions[0].number, "score:", mlPreds.predictions[0].predictive_score);

const benchmark = getThreeSystemBenchmark();
console.log("   Benchmark significance statement:", benchmark.significance.statement);

// 4. Probar importación de componentes React
console.log("3. Probando importación de componentes...");
const PredictionsTabModule = await import('./frontend/src/components/PredictionsTab.jsx');
if (typeof PredictionsTabModule.default !== 'function') {
  throw new Error("PredictionsTab default export is not a function/component");
}
console.log("   OK: PredictionsTab importado exitosamente.");

const PredictiveAiModule = await import('./frontend/src/components/PredictiveAiDashboardTab.jsx');
if (typeof PredictiveAiModule.default !== 'function') {
  throw new Error("PredictiveAiDashboardTab default export is not a function/component");
}
console.log("   OK: PredictiveAiDashboardTab importado exitosamente.");

console.log("=== TODAS LAS PRUEBAS DE RUNTIME PASARON CON ÉXITO ===");
