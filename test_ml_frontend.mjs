import { getMLPredictions, getThreeSystemBenchmark, ML_MODEL_METADATA } from './frontend/src/services/mlPredictionEngine.js';
import fs from 'fs';

console.log("=== INICIANDO TEST DE INTEGRACIÓN ML ENGINE ===");

// 1. Verificar metadata
console.log("1. Verificando Metadata...");
if (!ML_MODEL_METADATA.version || ML_MODEL_METADATA.evaluation.p_value !== 0.214) {
  throw new Error("Metadata inválida");
}
console.log("   OK: Version =", ML_MODEL_METADATA.version);

// 2. Verificar Benchmark
console.log("2. Verificando Benchmark de los 3 Sistemas...");
const bm = getThreeSystemBenchmark();
if (bm.table.length !== 5 || bm.significance.is_significant !== false) {
  throw new Error("Benchmark inválido");
}
console.log("   OK: Diagnóstico honesto verificado ->", bm.significance.statement);

// 3. Simular predicción con sorteos reales cargados de draws_curated.json
console.log("3. Simulando predicción con draws_curated.json...");
const rawDraws = JSON.parse(fs.readFileSync('./backend/ml_pipeline/draws_curated.json', 'utf8'));

// Simular entorno localStorage
global.localStorage = {
  getItem: (key) => {
    if (key === 'quiniela_official_draws') {
      return JSON.stringify(rawDraws);
    }
    return null;
  }
};

const result = getMLPredictions({ lottery: 'ciudad', shift: 'nocturna', limit: 10 });
console.log("   Predicciones generadas:", result.predictions.length);
console.log("   Total ambos calificados:", result.all_ranked.length);
console.log("   Sorteos evaluados:", result.total_draws_analyzed);

if (result.all_ranked.length !== 100) {
  throw new Error(`Se esperaban 100 ambos, se obtuvieron ${result.all_ranked.length}`);
}

const top1 = result.predictions[0];
console.log(`   Top 1: Número ${top1.number} (${top1.significado}) - Score: ${top1.predictive_score}/100`);
console.log("   Top factores de contribución:");
top1.top_contributing_features.forEach(f => {
  console.log(`     * ${f.label} (${f.feature}): valor=${f.value.toFixed(4)}, impacto=${f.impact.toFixed(4)}`);
});

// Comprobar que no hay NaN o undefined en ningún ambo
for (const p of result.all_ranked) {
  if (isNaN(p.predictive_score) || !p.number) {
    throw new Error(`Ambo ${p.number} tiene valores inválidos: score=${p.predictive_score}`);
  }
}
console.log("   OK: Todos los 100 ambos tienen scores y probabilidades válidas (0 NaN).");
console.log("=== TEST DE INTEGRACIÓN ML ENGINE COMPLETADO CON ÉXITO ===");
