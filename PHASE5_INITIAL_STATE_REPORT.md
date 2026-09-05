# PHASE 5 — INITIAL STATE AUDIT REPORT
**Fecha UTC:** 2026-09-04T18:24:03.817217+00:00  
**Fecha Local:** 2026-09-04 15:24:03  
**Versión App:** 1.4.3  
**Versión Android:** 1.4.3 (Build 75)  
**Versión Web:** 1.4.3  
**Prediction Engine Version:** v1.0  
**Git Branch / Commit:** `main` / `e1034e781d7706dd4b400fe3285bf738197305c8`  

## 1. Directorios Auditados
- `/frontend/src/`: Código React + Vite (App.jsx, main.jsx)
- `/frontend/src/services/`: Motor cliente estadístico (`clientEngine.js`), motor ML (`mlPredictionEngine.js`), telemetría y autenticación
- `/frontend/src/components/`: Componentes de interfaz (`DrawsHistoryTab.jsx`, `PredictionsTab.jsx`, `PredictiveAiDashboardTab.jsx`)
- `/frontend/public/api/`: Dataset oficial unificado `draws.json` (2.229 sorteos oficiales)
- `/backend/ml_pipeline/`: Modelos ML, pesos (`model_weights.json`), test congelado (`historical_test_v1_frozen.json`), datasets curados
- `/releases/pre_phase5_v1.4.3/`: Snapshot inmutable completo de resguardo

## 2. Inventario de Modelos Actuales
1. **CHAMPION**: `ML-FULL` (`Logistic Regression + Markov Features v1.0`)
   - Pesos congelados en `model_weights.json`
   - Features: Markov orden 1 y 2, delay dinámico, frecuencias ponderadas (10, 30, 50, 100 sorteos), paridad y decenas
2. **CHALLENGER 1**: `ML-TREND` (Logistic Regression con subconjunto de features de tendencia y delay)
3. **CHALLENGER 2**: `Frequency Simple` (Ranking por frecuencia de aparición)
4. **CHALLENGER 3**: `Markov Pure` (Matriz de transición pura sin regresión)
5. **BASELINE**: Heuristic Baseline histórico
6. **RANDOM REFERENCE**: Baseline aleatorio de referencia

## 3. Estado de Datasets
- Total sorteos históricos: 2.229 sorteos (2026-01-01 a 2026-09-04)
- Conjunto congelado HISTORICAL_TEST_V1: 400 sorteos exactos (2026-07-19 a 2026-09-03)
- Sorteos del día de hoy: 4 confirmados (Previa y Primera de Ciudad y Provincia)

## 4. Checksum SHA-256 de Archivos Críticos
| Archivo | Tamaño (bytes) | SHA-256 |
|---|---|---|
| `backend/ml_pipeline/ablation_engine.py` | 24,155 | `cc3e6f54817d2d54e0f2f464...` |
| `backend/ml_pipeline/ablation_results.json` | 35,312 | `3b061470e90f1cb72ae57fbc...` |
| `backend/ml_pipeline/blind_test_protocol.py` | 7,574 | `95aed6d224451033f9f432ee...` |
| `backend/ml_pipeline/draws_curated.json` | 1,161,913 | `4736ff9932a6f6e1da6cebb4...` |
| `backend/ml_pipeline/economic_backtest_simulator.py` | 3,050 | `8b951867e21f896231221b9f...` |
| `backend/ml_pipeline/feature_extractor.py` | 7,097 | `5dfc6ae72f03fc7580550eb3...` |
| `backend/ml_pipeline/four_systems_results.json` | 12,523 | `0b05f3bbb2d750758a291bd1...` |
| `backend/ml_pipeline/historical_test_v1_frozen.json` | 234,571 | `ab3991069aa5a381c3b4f3c0...` |
| `backend/ml_pipeline/model_weights.json` | 3,799 | `e0590f5d8802fd037dd0029b...` |
| `backend/ml_pipeline/test_ml_leakage.py` | 3,689 | `dc4adf0daaf5e235d8075d0c...` |
| `backend/ml_pipeline/walk_forward_trainer.py` | 15,976 | `d31e7afc7eed2977b2a25a04...` |
| `frontend/android/app/build.gradle` | 2,784 | `22e264217b80782bb481d17f...` |
| `frontend/package.json` | 821 | `97a15fd0de75006ca2aa8b39...` |
| `frontend/public/api/draws.json` | 1,180,346 | `ff246163d61f5e2a300eee47...` |
| `frontend/src/App.jsx` | 34,657 | `79051274270f82938ac6bb57...` |
| `frontend/src/components/DrawsHistoryTab.jsx` | 60,927 | `73fb53439744e2cd2bad4031...` |
| `frontend/src/components/PredictionsTab.jsx` | 45,145 | `e03d99bd3bd946cff4a47489...` |
| `frontend/src/components/PredictiveAiDashboardTab.jsx` | 62,168 | `ffb540a0eb43a10fd91547e9...` |
| `frontend/src/main.jsx` | 2,325 | `2a44b6c3a27571deeaf551fe...` |
| `frontend/src/services/clientEngine.js` | 114,491 | `8bafc7b3fad0fda0c07f3e15...` |
| `frontend/src/services/firebaseClient.js` | 6,082 | `56c3d13e65c4112d7be33fbf...` |
| `frontend/src/services/mlPredictionEngine.js` | 30,123 | `4bb1338a2f1244f1e8719f83...` |
| `frontend/src/services/notificationService.js` | 8,409 | `c4213966ef2d9d1591783769...` |
| `frontend/src/services/telemetryService.js` | 5,345 | `9dacbcc40e41e47ec5357cee...` |
| `frontend/vite.config.js` | 350 | `70f6978f57ca935a16188c26...` |

**ROLLBACK_VERIFIED = PASS**