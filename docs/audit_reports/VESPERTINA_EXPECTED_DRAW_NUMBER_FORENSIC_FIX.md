# AUDITORÍA FORENSE Y RESOLUCIÓN PRE-DRAW: EXPECTED DRAW NUMBER VESPERTINA 2026-09-05
**Protocolo:** TRACEABILITY_V1 / FASE 5  
**Fecha:** 2026-09-05 17:22 ART (Deadline Efectivo: 17:45 ART)  
**Estado:** SELLADO Y RESUELTO CON PRESERVACIÓN DE EVIDENCIA

---

## 1. CONSULTA A FUENTE OFICIAL LOTBA

Se realizó una consulta directa al endpoint oficial de extractos de la Lotería de la Ciudad (LOTBA):
`https://quiniela.loteriadelaciudad.gob.ar/resultadosQuiniela/consultaResultados.php`

### Resultados Oficiales del Día 2026-09-05:
- **Sorteo 52867 (Previa):**
  - Ciudad (`juridiccion=51`): Primer premio `4244`
  - Provincia (`juridiccion=53`): Primer premio `2713`
- **Sorteo 52868 (Primera):**
  - Ciudad (`juridiccion=51`): Primer premio `6110`
  - Provincia (`juridiccion=53`): Primer premio `3971`
- **Sorteo 52869 (Matutina):**
  - Ciudad (`juridiccion=51`): Primer premio `5763`
  - Provincia (`juridiccion=53`): Primer premio `8325`
- **Sorteo 52870 (Vespertina):**
  - Ciudad (`juridiccion=51`): `status: PENDING`, `matches: 0`
  - Provincia (`juridiccion=53`): `status: PENDING`, `matches: 0`

> [!IMPORTANT]
> **Conclusión Oficial:** En el extracto conjunto oficial regulado por LOTBA para la República Argentina, los sorteos de **Ciudad de Buenos Aires** y **Provincia de Buenos Aires** comparten **exactamente el mismo número secuencial de sorteo**.
> - `EXPECTED_DRAW_NUMBER_CIUDAD_OFFICIAL = 52870`
> - `EXPECTED_DRAW_NUMBER_PROVINCIA_OFFICIAL = 52870`

---

## 2. ORIGEN DE LA ANOMALÍA: NÚMERO 49728

La auditoría de código reveló que en `frontend/src/services/canonicalPredictionsLedger.js`, la función auxiliar `resolveExpectedDrawNumber` contenía una heurística heredada:
```javascript
// CÓDIGO PREVIO OBSOLETO:
const baseNum = isProvincia ? 49725 : 52867;
return String(baseNum + shiftOffset); // 49725 + 3 = 49728
```
Esta asignación derivaba de una convención histórica provincial desactualizada y no del número de extracto real unificado provisto por LOTBA.
- `PROVINCIA_49728_VALID = NO`
- `STALE_DRAW_NUMBER_METADATA = YES`

---

## 3. PROTOCOLO DE PRESERVACIÓN DE EVIDENCIA (ZERO OVERWRITE)

Conforme a las directivas de trazabilidad:
1. **NO se sobreescribió ningún registro bloqueado:**
   `ORIGINAL_LOCKED_RECORDS_OVERWRITTEN = 0`
2. Los registros originales con metadatos incorrectos de Provincia Vespertina fueron preservados en el ledger con estado auditado:
   - `status: 'SUPERSEDED_INVALID'`
   - `incident_event: 'INVALID_PRE_DRAW_METADATA_EXPECTED_DRAW_NUMBER'`
   - `superseded_by: '..._V2'`

### Registros Canónicos Supersedidos Preservados:
- `CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_ML-FULL`
- `CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_STATISTICAL`

### Registros Científicos Supersedidos Preservados en `prospective_audit_ledger.json`:
- `PRED_2026-09-05_PROVINCIA_VESPERTINA_ML-FULL`
- `PRED_2026-09-05_PROVINCIA_VESPERTINA_ML-TREND`
- `PRED_2026-09-05_PROVINCIA_VESPERTINA_FREQUENCY-SIMPLE`
- `PRED_2026-09-05_PROVINCIA_VESPERTINA_MARKOV-PURE`
- `PRED_2026-09-05_PROVINCIA_VESPERTINA_HEURISTIC-BASELINE`
- `PRED_2026-09-05_PROVINCIA_VESPERTINA_RANDOM-REFERENCE`

---

## 4. CREACIÓN Y SELLADO DE REEMPLAZOS V2 ANTES DE 17:45 ART

Se generaron y sellaron los 8 registros de reemplazo (`_V2`) con metadatos corregidos (`expected_draw_number: "52870"`) a las **17:05 ART** (bien antes del deadline de 17:45 ART).

### A. Registros Canónicos Visibles V2:
1. **`CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_ML-FULL_V2`**
   - Expected Draw Number: `52870`
   - Top 5: `['38', '67', '33', '77', '27']`
   - Hash SHA-256: `566856d8b60b77a1c607627fec70b150a7c87a36cd567971bd273b6528b3bc24`
   - Estado: `LOCKED` (17:05 ART)

2. **`CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_STATISTICAL_V2`**
   - Expected Draw Number: `52870`
   - Top 5: `['63', '83', '38', '48', '32']`
   - Hash SHA-256: `3682041b7daa2e14e805beb5f79d519028e542381eda5a974a7f7179845eca97`
   - Estado: `LOCKED` (17:05 ART)

### B. Registros Científicos V2 en `prospective_audit_ledger.json`:
1. `PRED_2026-09-05_PROVINCIA_VESPERTINA_ML-FULL_V2` (`expected_draw_number: 52870`, locked: 17:05 ART)
2. `PRED_2026-09-05_PROVINCIA_VESPERTINA_ML-TREND_V2` (`expected_draw_number: 52870`, locked: 17:05 ART)
3. `PRED_2026-09-05_PROVINCIA_VESPERTINA_FREQUENCY-SIMPLE_V2` (`expected_draw_number: 52870`, locked: 17:05 ART)
4. `PRED_2026-09-05_PROVINCIA_VESPERTINA_MARKOV-PURE_V2` (`expected_draw_number: 52870`, locked: 17:05 ART)
5. `PRED_2026-09-05_PROVINCIA_VESPERTINA_HEURISTIC-BASELINE_V2` (`expected_draw_number: 52870`, locked: 17:05 ART)
6. `PRED_2026-09-05_PROVINCIA_VESPERTINA_RANDOM-REFERENCE_V2` (`expected_draw_number: 52870`, locked: 17:05 ART)

---

## 5. AISLAMIENTO ESTRUCTURAL DE TURNOS (SHIFT IDENTITY ISOLATION)

Se auditó formalmente si la repetición de ciertos números entre turnos consecutivos (como el `73` en Ciudad o `38, 77, 27` en Provincia) se debía a un fallo de memoria ("carryover bug") o a la matemática legítima del modelo.

### Hallazgos de la Auditoría:
1. **Diferenciación de Rankings:**
   - Ciudad Matutina ML-FULL Top 5: `['55', '63', '08', '73', '84']`
   - Ciudad Vespertina ML-FULL Top 5: `['73', '04', '77', '18', '29']`
   - Los conjuntos de predicción son claramente distintos; únicamente comparten el número `73`, el cual retiene un delay elevado y probabilidad condicional residual en la matriz de Markov.
2. **Aislamiento de Identidad de Estado y Storage:**
   - La clave de acceso canónica es compuesta: `${date}_${jurisdiction}_${shift}_${modelName}`.
   - `MATUTINA_PREDICTION_ID != VESPERTINA_PREDICTION_ID` (100% garantizado).
   - Los estados en React (`predictionsState`, `resultsState`) indexan por clave compuesta completa, impidiendo que el render de un turno lea datos de otro.
3. **Resultado:**
   `SHIFT_IDENTITY_ISOLATION = PASS`

---

## 6. VERIFICACIÓN Y CONTROL DE INTEGRIDAD

Se ejecutaron las suites de test y scripts de verificación:
- `verify_vespertina_sealing.mjs`: **PASS (100% OK)**
- `test_premature_result_and_shift_isolation.mjs`: **15/15 PASS**
- `test_ui_prediction_stability.mjs`: **10/10 PASS**
- Build de producción Vite: **EXITOSO (0 errores)**
- `MODELS_MODIFIED = 0`
- `PROSPECTIVE_N = 4`
