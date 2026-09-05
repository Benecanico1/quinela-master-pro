# FIX CRÍTICO V2 — PREMATURE WIN EVALUATION + SHIFT CARRYOVER
**Protocolo:** TRACEABILITY_V1 / FASE 5  
**Fecha de Implementación:** 2026-09-05  
**Estado de Verificación:** APROBADO (10/10 Tests Unitarios Pasados, Build Vite Exitoso)

---

## 1. OFFICIAL RESULT GATE OBLIGATORIO

Se auditó y reescribió `evaluateCanonicalPrediction(canonicalRecord, officialDraw)` en `frontend/src/services/canonicalPredictionsLedger.js`.

La función ahora se **niega formalmente a evaluar** salvo que se cumplan rigurosamente **todas y cada una** de las siguientes condiciones:
1. `officialDraw != null` y `typeof officialDraw === 'object'`.
2. `canonicalRecord != null`, no inválido, con array `top_5` de 5 elementos.
3. `officialDraw.status === "PUBLISHED"` (o equivalente oficial comprobable: `COMPLETED`, `VERIFIED_OFFICIAL`).
4. `officialDraw.date == canonicalRecord.date` (coincidencia estricta de fecha).
5. `officialDraw.shift == canonicalRecord.shift` (coincidencia estricta de turno).
6. `officialDraw.jurisdiction == canonicalRecord.jurisdiction` (coincidencia estricta de jurisdicción).
7. `officialDraw.received_at != null`.
8. `officialDraw.received_at > official_draw_time` (recibido después del deadline programado).
9. `officialDraw.board.length == 20` (extracto completo de 20 números).

### Comportamiento ante Falla del Gate
Si cualquiera de las 9 condiciones falla, la función devuelve:
```javascript
{
  is_evaluated: false,
  status: 'WAITING_OFFICIAL_RESULT',
  message: 'ESPERANDO RESULTADO OFICIAL',
  details: 'Aguardando extracto oficial verificado de la lotería.',
  head_hit: false,
  head_rank: null,
  head_multiplier: null,
  unique_hits: [],
  official_positions: [],
  hit_at_5: 0,
  precision_at_5: 0.0,
  board_occurrence_hits: 0,
  board_occurrence_coverage: 0.0,
  is_hit: false,
  hit_type: 'PENDING',
  top_5: [...canonicalRecord.top_5],
  prediction_id: canonicalRecord.prediction_id,
  engine_id: canonicalRecord.engine_id,
  engine_name: canonicalRecord.engine_name,
  engine_type: canonicalRecord.engine_id === 'ML-FULL' ? 'ML' : 'STATISTICAL',
  status_text: 'ESPERANDO RESULTADO OFICIAL'
}
```
**Resultado Garantizado:** NUNCA se muestra badge de premio, número verde ni multiplicador antes de que el extracto oficial auténtico y verificado haya sido recibido.

---

## 2. SEPARACIÓN EXPLÍCITA DE ESTADOS DEL SORTEO

Se implementaron en la aplicación los 4 estados secuenciales de un sorteo:

```
[ PREDICTION_LOCKED ]
        ↓ (Llega la hora límite del sorteo, ej. 15:00 ART)
[ DRAW_TIME_REACHED_WAITING_RESULT ] 
        ↓ (CERO aciertos, CERO premios, "⏳ Sorteo cerrado — esperando resultado oficial")
[ OFFICIAL_RESULT_RECEIVED ]
        ↓ (Validación criptográfica y de fecha/turno en Official Result Gate)
[ EVALUATED ]
```

### Comportamiento a las 15:00 exactas (Matutina)
- El simple hecho de llegar a las 15:00 **NO** significa que exista resultado.
- En la interfaz (`PredictionsTab.jsx`), el encabezado y las filas muestran:
  > **"⏳ Sorteo cerrado — esperando resultado oficial"**
- Las tarjetas de los números permanecen en color neutral (`text-white`, fondo gris/azul oscuro de `bg-slate-950/90`).
- No se activan bordes dorados, ni gradientes verdes, ni badges de `"¡Acierto Cabeza!"` o `"Posición #..."`.

---

## 3. AUDITORÍA FORENSE: ORIGEN DE LOS NÚMEROS 55 Y 63

Para el sorteo **Matutina 2026-09-05**:
- El **55** pertenecía al registro canónico pre-sorteo de `CANONICAL_2026-09-05_CIUDAD_MATUTINA_ML-FULL` (posición #5).
- El **63** pertenecía al registro canónico pre-sorteo de `CANONICAL_2026-09-05_CIUDAD_MATUTINA_STATISTICAL` (posición #5).

### Objeto oficialDraw Utilizado Erróneamente
Al ejecutarse `fetchDirectFromLotba()` a las 14:59 ART, la lista de candidatos de respaldo estáticos consultó el sorteo `52864`:
- **ID de Sorteo:** `52864` (Lotería de la Ciudad).
- **Fecha Real del Sorteo:** `2026-09-04` (Extracto PDF `QNL51M20260904.pdf`, Matutina del viernes anterior).
- **Fecha Atribuida por Ingesta:** `2026-09-05` (Inyectada por `todayStr`).
- **Shift:** `matutina`.
- **Jurisdicción:** `ciudad` y `provincia`.
- **Cabeza (Posición 1):** `2663` &rarr; Ambo **63**.
- **Provincia Posición 4:** `0655` &rarr; Ambo **55**.
- **Provincia Posición 11:** `3263` &rarr; Ambo **63**.
- **Board (Ciudad):** `["2663", "2061", "3462", "8157", "9849", "0914", "6127", "2847", "3363", "8444", "1343", "4361", "1295", "9133", "2176", "2329", "8905", "7337", "4323", "2774"]`
- **received_at:** `null` (no existía en la carga).
- **status:** no definido.
- **source:** `fetchDirectFromLotba fallbackCandidates`.

### Conclusiones Categóricas
```yaml
OFFICIAL_RESULT_EXISTED_AT_THAT_MOMENT: NO
STALE_RESULT_WAS_USED: YES (Sorteo 52864 del 04/09/2026)
WRONG_SHIFT_RESULT_WAS_USED: NO (Era matutina, pero de fecha equivocada)
WRONG_JURISDICTION_RESULT_WAS_USED: YES (En provincia se evaluó con fallback cruzado)
EMPTY_OR_PLACEHOLDER_RESULT_WAS_USED: NO
```

### Corrección en el Extractor
Se eliminó por completo el array `fallbackCandidates` estático con IDs viejos en `clientEngine.js`. Solo se aceptan números correspondientes a sorteos dinámicos del día, y cada resultado guardado incluye `status: 'PUBLISHED'`, `received_at: nowIso` y validación de fecha.

---

## 4. AISLAMIENTO ESTRICTO POR TURNO Y JURISDICCIÓN

Se implementó el lookup obligatorio por clave compuesta de 4 dimensiones:
$$\text{Clave} = \text{date} + \text{"|"} + \text{jurisdiction} + \text{"|"} + \text{shift} + \text{"|"} + \text{engine}$$

Ejemplos:
- `2026-09-05|ciudad|matutina|ML-FULL` &rarr; `CANONICAL_2026-09-05_CIUDAD_MATUTINA_ML-FULL`
- `2026-09-05|ciudad|vespertina|ML-FULL` &rarr; `CANONICAL_2026-09-05_CIUDAD_VESPERTINA_ML-FULL`

### Prohibiciones Cumplidas
- ❌ **PROHIBIDO:** `getLatestPrediction()` o buscar solo por engine o fecha.
- ❌ **PROHIBIDO:** `shift || 'matutina'` como default en ledger o selectores.
- ❌ **PROHIBIDO:** Mantener el `canonicalMLActive` del turno anterior mientras carga un nuevo turno.
- ❌ **PROHIBIDO:** Evaluar Provincia con el extracto de Ciudad (`provinciaDraw || ciudadDraw`).

---

## 5. CAMBIO DE TURNO (MATUTINA -> VESPERTINA)

Al cambiar de turno en `PredictionsTab.jsx`:
1. Se invalida de inmediato la referencia visual anterior mediante chequeo de clave:
   ```javascript
   canonicalMLActive.shift === cleanActiveShift && 
   canonicalMLActive.jurisdiction === cleanJur && 
   canonicalMLActive.date === todayStr
   ```
2. Se busca exclusivamente el registro de Vespertina.
3. Si el registro no está sellado en el Ledger:
   - Se devuelve array vacío `[]`.
   - La interfaz muestra: **"SIN PRONÓSTICO SELLADO PARA VESPERTINA"**.
   - Subtítulo: *"No existe registro canónico sellado antes del deadline para este turno y jurisdicción."*
4. NUNCA se utiliza Matutina como fallback.

### Auditoría de Identidad
```yaml
MATUTINA_ML_PREDICTION_ID: "CANONICAL_2026-09-05_CIUDAD_MATUTINA_ML-FULL"
MATUTINA_ML_TOP5: "['76', '77', '73', '97', '55']"

VESPERTINA_REQUEST_KEY: "CANONICAL_2026-09-05_CIUDAD_VESPERTINA_ML-FULL"
VESPERTINA_RENDERED_PREDICTION_ID: null (o registrado antes de deadline)
VESPERTINA_RENDERED_TOP5: "SIN PRONÓSTICO SELLADO" (no reproduce Matutina)

SHIFT_CARRYOVER_OCCURRED: YES (En el incidente original reportado)
SHIFT_CARRYOVER_PREVENTED_NOW: YES (Físicamente imposible con la nueva validación)
```

---

## 6. PROTECCIÓN SIMÉTRICA DEL MOTOR ESTADÍSTICO

Las mismas restricciones de clave compuesta, invalidación de turno y obligatoriedad del Official Result Gate se aplicaron a:
- **ML-FULL (Champion)**
- **STATISTICAL (Motor Estadístico)**

Ninguna fila puede reutilizar datos de un turno anterior.

---

## 7. RESULTADOS DE LA SUITE DE TESTS OBLIGATORIOS (10/10)

Ejecutado con: `node test_premature_result_and_shift_isolation.mjs`

| # | Test | Condición Validada | Resultado |
| :---: | :--- | :--- | :---: |
| **1** | Draw time alcanzado sin resultado oficial | CERO premios, CERO aciertos, status `ESPERANDO RESULTADO OFICIAL` | **PASS** |
| **2** | Sorteo Primera recibido mientras se evalúa Matutina | `shift` mismatch &rarr; evaluación rechazada (`is_evaluated = false`) | **PASS** |
| **3** | Sorteo Matutina Ciudad evaluando Provincia | `jurisdiction` mismatch &rarr; evaluación rechazada | **PASS** |
| **4** | Sorteo de fecha anterior (04/09) evaluando fecha actual (05/09) | `date` mismatch &rarr; evaluación rechazada | **PASS** |
| **5** | Matutina &rarr; Vespertina | Top 5 de Matutina (`76,77,73,97,55`) jamás se arrastra a Vespertina | **PASS** |
| **6** | Vespertina sin registro sellado | Muestra `"SIN PRONÓSTICO SELLADO PARA VESPERTINA"` (devuelve lista vacía `[]`) | **PASS** |
| **7** | `officialDraw == null` | `is_evaluated = false`, `head_hit = false` | **PASS** |
| **8** | `officialDraw.status != 'PUBLISHED'` | Estado no oficial &rarr; `is_evaluated = false` | **PASS** |
| **9** | `officialDraw.board.length != 20` | Pizarra incompleta &rarr; `is_evaluated = false` | **PASS** |
| **10** | Extracto oficial válido y completo | Evaluación legítima, `is_evaluated = true`, `prediction_id` auditado | **PASS** |

Suite complementaria: `test_ui_prediction_stability.mjs` &rarr; **10/10 TESTS PASSED**.  
Compilación Vite: `npm run build` en `frontend/` &rarr; **EXITOSO (0 errores)**.

---

## 8. SEPARACIÓN EN FASE 5: PREDICCIÓN VS EVALUACIÓN UI

- **PREDICTION_INTEGRITY:**  
  Las 12 predicciones de Matutina 2026-09-05 creadas a las 14:40 ART (antes del deadline efectivo de las 14:45 ART) se mantienen selladas, legítimas e intactas con sus SHA-256 originales.
- **UI_EVALUATION_INTEGRITY:**  
  La visualización de aciertos del usuario ocurrida a las 15:00 ART queda catalogada como espuria y nula debido al uso del sorteo 52864 obsoleto.
- **PROSPECTIVE_N:**  
  Permanece en $N = 4$ y **NO se incrementa** hasta recibir y auditar el extracto oficial auténtico de Matutina 2026-09-05.

---

## CONFIRMACIÓN DE REQUERIMIENTOS FINALES

```yaml
OFFICIAL_RESULT_GATE: PASS
DRAW_CLOSED_IS_NOT_RESULT_RECEIVED: PASS
PREMATURE_WIN_DISPLAY: IMPOSSIBLE
SHIFT_LOOKUP_ISOLATED: PASS
MATUTINA_TO_VESPERTINA_CARRYOVER: IMPOSSIBLE
STALE_RESULT_REJECTION: PASS
WRONG_SHIFT_RESULT_REJECTION: PASS
WRONG_JURISDICTION_RESULT_REJECTION: PASS
PREDICTIONS_MODIFIED: 0
LOCKED_HASHES_MODIFIED: 0
MODELS_MODIFIED: 0
PROSPECTIVE_N_MODIFIED: NO
```
