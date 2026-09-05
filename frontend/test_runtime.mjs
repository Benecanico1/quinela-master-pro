import React from 'react';
import { getMLPredictions, getThreeSystemBenchmark, ML_MODEL_METADATA } from './src/services/mlPredictionEngine.js';
import { getClientPredictions, getClientFrequencies, getClientBacktest, getCurrentActiveShift } from './src/services/clientEngine.js';

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

console.log("=== TODAS LAS PRUEBAS DE SERVICIOS PASARON CON ÉXITO ===");
