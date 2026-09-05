# INFORME DE RESOLUCIÓN: ESTABILIDAD DE PRONÓSTICOS Y COMPARACIÓN CANÓNICA EN RESULTADOS

## 1. RESUMEN EJECUTIVO

Se auditaron y corrigieron exitosamente los dos defectos de interfaz de usuario reportados en `quiniela-pro-app`:
1. **Flicker de Pronósticos en `PredictionsTab.jsx` (`08 -> 20 -> 08`):** Eliminado definitivamente. Se extirparon todos los operadores ternarios que recurrían a recálculos dinámicos al vuelo (`getMLPredictions()`, `getClientPredictions()`). Los números en pantalla se obtienen de forma pura e inmutable desde `CanonicalPredictionRecord.top_5` mediante la función pura `formatItemsFromTop5()`. En caso de carga o ausencia de registro, la interfaz muestra un estado de bloqueo/espera y nunca números provisionales.
2. **Cotejo Canónico Dual en `DrawsHistoryTab.jsx`:** Implementado en su totalidad. Cada sorteo oficial completado muestra obligatoriamente las dos filas de auditoría pre-sorteo (🧠 IA/ML Champion vs 📊 Motor Estadístico), detallando: Top 5 pronosticado sellado, Resultado Cabeza oficial, Coincidencias en los 20 premios de pizarra y Estado de Premio (Cabeza 70x, A los 5, A los 10, A los 20 o Sin acierto). Para sorteos históricos sin registro sellado, se reporta explícitamente `SIN PREDICCIÓN REGISTRADA` sin recalcular nada retrospectivamente.
3. **Unificación de Evaluación:** Se integró la función pura `evaluateCanonicalPrediction(canonicalRecord, officialDrawResult)` tanto en `PredictionsTab` como en `DrawsHistoryTab`, garantizando consistencia 1:1 en los aciertos y premios mostrados en ambas pantallas.

---

## 2. AUDITORÍA FORENSE DEL PARPADEO (FLICKER 08 -> 20 -> 08)

### Fuentes auditadas
- **`PredictionsTab.jsx`:**
  - Líneas 86–92: `mlTop5Active = (canonicalMLActive && canonicalMLActive.status === 'LOCKED' && canonicalMLActive.items?.length > 0) ? canonicalMLActive.items.slice(0, 5) : (mlPredictionsActive.top_predictions || ...)`
  - Líneas 111–117: `mlTop5Closed = (canonicalClosedML && canonicalClosedML.status === 'LOCKED' && canonicalClosedML.items?.length > 0) ? canonicalClosedML.items.slice(0, 5) : (mlPredictionsClosed.top_predictions || ...)`
  - `setInterval(1000)`: El reloj de cuenta regresiva forzaba un re-render del componente cada segundo.

### Causa raíz confirmada
Cuando un registro canónico sellado poseía `top_5: ['08', ...]` pero la propiedad `.items` no estaba inicializada en ese instante de montaje o durante la rehidratación del estado, la condición `canonicalMLActive.items?.length > 0` evaluaba a `false`. Esto provocaba que el operador ternario saltara al fallback dinámico `mlPredictionsActive.top_predictions`, el cual ejecutaba el motor en caliente y proyectaba momentáneamente otro número (ej. `20`). En el siguiente tick o resolución del ledger, el registro se leía con sus items y la interfaz volvía a mostrar `08`.

### Solución aplicada
1. Se reemplazó la dependencia de `canonicalRecord.items` por `formatItemsFromTop5(canonicalRecord.top_5)`.
2. Se eliminó todo fallback a `getMLPredictions()` o `getClientPredictions()` para sorteos bloqueados o cerrados.
3. Si un registro no está disponible o está en carga, el valor asignado es `[]`, lo que despliega un componente visual de espera: `🔒 Cargando pronóstico sellado pre-sorteo...` y jamás números provisionales.

---

## 3. UNIFICACIÓN DE LA EVALUACIÓN Y COTEJO EN RESULTADOS

### Función Pura Canónica
Se utiliza exclusivamente `evaluateCanonicalPrediction(canonicalRecord, officialDraw)`:
- **Entrada:** `(CanonicalPredictionRecord, OfficialDrawResult)`
- **Prohibición estricta:** No invoca motores predictivos ni efectúa recálculos retrospectivos.
- **Salida estructurada:**
  - `is_evaluated`: `boolean`
  - `head_hit`: `boolean`
  - `head_rank`: `number | null`
  - `head_multiplier`: `string | null`
  - `unique_hits`: `array`
  - `official_positions`: `array` con `{ number, position, rank_in_prediction, multiplier }`
  - `hit_at_5`: `0 | 1`
  - `precision_at_5`: `float`
  - `board_occurrence_hits`: `number`
  - `board_occurrence_coverage`: `float`
  - `status_text`: `string`

### Renderizado en `DrawsHistoryTab.jsx`
Para cada tarjeta de sorteo completada, se renderizan dos filas obligatorias:
1. **🧠 IA / ML — Champion (ML-FULL):**
   - Muestra Top 5 pronosticado (números con resaltado dorado para cabeza y esmeralda para pizarra).
   - Muestra resultado oficial de Cabeza (con indicación de si fue acertado y en qué orden).
   - Muestra todas las coincidencias en los 20 premios de pizarra con su multiplicador oficial (14x, 7x, 3.5x).
   - Badge de estado de premio (Cabeza 70x, A los 5, A los 10, A los 20 o Sin acierto).
2. **📊 Motor Estadístico (Frecuencias & Atrasos):**
   - Misma estructura auditable y trazable.
   - En caso de no existir registro previo sellado (sorteos históricos no sellados): muestra explícitamente `⚪ SIN PREDICCIÓN REGISTRADA` (nunca inventa o recalcula retrospectivamente).

---

## 4. RESULTADOS DE LA SUITE DE VERIFICACIÓN (10/10 TESTS PASSED)

Se ejecutó la suite automatizada `test_ui_prediction_stability.mjs` con los siguientes resultados:

| # | Test de Verificación | Resultado | Detalle |
|---|---|:---:|---|
| 1 | **Locked prediction never changes** | **PASS** | Top 5 e items se mantienen 100% idénticos e invariantes tras 100 re-renders sucesivos. |
| 2 | **Draw updates do not change Top 5** | **PASS** | La recepción del resultado oficial y la evaluación no mutan el Top 5 pre-sorteo. |
| 3 | **Async / loading states never show provisional numbers** | **PASS** | Estados de carga o registros no disponibles retornan `[]` y muestran loading/skeleton, nunca números provisionales. |
| 4 | **Results tab consumes CanonicalPredictionRecord** | **PASS** | `DrawsHistoryTab` lee directamente del Ledger Canónico como Single Source of Truth. |
| 5 | **Results tab does not call predictive calculation engines** | **PASS** | `evaluateCanonicalPrediction` opera puramente con `(CanonicalRecord, OfficialDraw)` con 0 llamadas a motores predictivos. |
| 6 | **Predictions tab does not recalculate to determine awards** | **PASS** | La asignación de premios en `PredictionsTab` utiliza estrictamente `evaluateCanonicalPrediction`. |
| 7 | **Same prediction_id in Pronósticos and Resultados** | **PASS** | El identificador criptográfico (`prediction_id`) coincide 1:1 en ambas pantallas (ej: `CANONICAL_2026-09-05_CIUDAD_PREVIA_ML-FULL`). |
| 8 | **Hits shown in both screens are identical** | **PASS** | Los aciertos reportados (`13@pos1, 55@pos2`) son exactamente iguales en ambas pantallas. |
| 9 | **Number outside Top 5 never appears as Top 5 prize** | **PASS** | Un número fuera del Top 5 (ej. ambo 82 para La Previa Ciudad) jamás recibe atribución de premio en Top 5. |
| 10 | **Simulation of 08 -> 20 -> 08 is impossible** | **PASS** | Test de stress de 500 ciclos de re-render rápido verificó invariancia absoluta de estado único (`74,47,37,81,71`). |

---

## 5. COMPILACIÓN DE PRODUCCIÓN

- **Comando:** `npm run build` en `frontend/`
- **Resultado:** `vite v8.2.1 building client environment for production... built in 878ms`
- **Errores de compilación:** 0
- **Advertencias de sintaxis:** 0

---

## 6. DECLARACIÓN DE INVARIANTES Y ESTADO CANÓNICO

```text
PREDICTION_FLICKER_FIXED = YES
LOCKED_UI_IMMUTABLE = YES
TEMPORARY_PREDICTION_RENDERING = DISABLED
RESULTS_CANONICAL_COMPARISON = PASS
PREDICTIONS_RESULTS_EVALUATION_MATCH = PASS
RETROSPECTIVE_RECALCULATION = DISABLED
MODELS_MODIFIED = 0
HASHES_MODIFIED = 0
PROSPECTIVE_N_MODIFIED = NO
PROSPECTIVE_N = 4
```
