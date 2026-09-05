# AUDITORÍA CRÍTICA READ-ONLY
## PREMATURE WIN + SHIFT CARRYOVER (2026-09-05 MATUTINA -> VESPERTINA)

**Fecha de Auditoría:** 2026-09-05  
**Modo:** READ-ONLY FORENSIC AUDIT (0 modificaciones de código, 0 modificaciones de modelos, 0 modificaciones de predicciones, 0 modificaciones de hashes, 0 modificaciones a PROSPECTIVE_N).

---

## 1. AUDITORÍA DEL PREMIO PREMATURO (NÚMEROS 63 Y 55)

Inmediatamente al cumplirse las 15:00:00 ART del sorteo Matutina 2026-09-05, la interfaz de usuario en `PredictionsTab.jsx` marcó erróneamente los números **63** (como Acierto Cabeza) y **55** (como Acierto Pizarra), **antes** de que la Lotería de la Ciudad (LOTBA) hubiera sorteado o publicado el extracto oficial de Matutina del sábado 2026-09-05.

### Identificación Técnica de Componentes y Funciones
- **Componente Afectado:** `frontend/src/components/PredictionsTab.jsx` (Bloque 2: *Último Sorteo Cerrado* y badges de hit en Bloque 1).
- **Función de Ingesta/Fallback:** `fetchDirectFromLotba()` en `frontend/src/services/clientEngine.js` (líneas 1360-1458) llamada desde `getRealOfficialDrawsFromStorage()`.
- **Mecanismo de Evaluación:** Comparación en memoria entre `canonicalPrediction.top_5` y `allDrawsDb[drawKey].numbers` ejecutada reactivamente en `PredictionsTab.jsx`.

### Objeto de Resultado Oficial Utilizado
- **Sorteo Obtenido:** Sorteo ID `52864` de LOTBA.
- **Fecha Real del Sorteo Obtenido:** `2026-09-04` (Viernes 4 de Septiembre de 2026).
- **Extracto PDF Oficial de LOTBA:** `QNL51M20260904.pdf` (Matutina del día anterior).
- **Fecha Forzada en Memoria:** `2026-09-05` (Inyectada sintéticamente por `fetchDirectFromLotba` al iterar `todayStr = new Date().toISOString().split('T')[0]`).
- **Shift del Resultado Utilizado:** `matutina`
- **Jurisdicción:** `ciudad` y `provincia`
- **Fuente del Resultado:** Endpoint público de LOTBA mediante lista estática de IDs fallback:
  ```javascript
  const fallbackCandidates = [
    { id: '52862', shift: 'previa' },
    { id: '52863', shift: 'primera' },
    { id: '52864', shift: 'matutina' },
    { id: '52865', shift: 'vespertina' },
    { id: '52866', shift: 'nocturna' }
  ];
  ```
- **Números del Sorteo 52864 (Viernes 2026-09-04):**
  - **Ciudad Matutina:**
    - Posición 1 (Cabeza): `2663` &rarr; Ambo **63**
    - Pizarra: `[63, 61, 62, 57, 49, 14, 27, 47, 63, 44, 43, 61, 95, 33, 76, 29, 05, 37, 23, 74]`
  - **Provincia Matutina:**
    - Posición 4: `0655` &rarr; Ambo **55**
    - Posición 11: `3263` &rarr; Ambo **63**

### Predicciones Canónicas Selladas para Matutina 2026-09-05
- `CANONICAL_2026-09-05_CIUDAD_MATUTINA_ML-FULL`:
  - Top 5: `['76', '77', '73', '97', '55']` &rarr; Contiene **55** en pos 4.
- `CANONICAL_2026-09-05_CIUDAD_MATUTINA_STATISTICAL`:
  - Top 5: `['21', '12', '00', '92', '63']` &rarr; Contiene **63** en pos 4.

### Cronología de Eventos
1. **14:40 ART:** Se generaron y sellaron legítimamente las predicciones pre-sorteo para Matutina 2026-09-05 con estado `LOCKED`.
2. **14:59 ART:** El cliente web ejecutó `fetchDirectFromLotba()`. Al fallar el listado dinámico, recorrió `fallbackCandidates`, descargó el sorteo `52864` (que pertenecía al 04/09/2026) y lo guardó bajo la clave `2026-09-05_ciudad_matutina`.
3. **15:00:00 ART:** El hook de tiempo detectó que `currentTotalSeconds >= 15 * 3600`, cambiando el turno cerrado a `matutina`.
4. **15:00:01 ART:** `PredictionsTab.jsx` leyó `2026-09-05_ciudad_matutina` de la base local, vio la cabeza `63` y la posición pizarra `55`, contrastó con las predicciones canónicas y activó inmediatamente los carteles de acierto.
5. **Estado Real a las 15:00 ART:** El sorteo oficial de Matutina del 2026-09-05 **aún no se había jugado** (se sortea a partir de las 15:00 y los extractos tardan de 15 a 30 minutos).

### Respuestas de Verificación — Sección 1
```yaml
MATUTINA_OFFICIAL_RESULT_EXISTED_AT_EVALUATION: NO
EVALUATION_OCCURRED_BEFORE_OFFICIAL_RESULT: YES
RESULT_DATE_MATCH: FAIL (Sorteo real 2026-09-04 atribuido erróneamente a 2026-09-05)
RESULT_SHIFT_MATCH: PASS (Turno nominal matutina)
RESULT_JURISDICTION_MATCH: PASS
PREMATURE_RESULT_EVALUATION: YES
RESULT_STALE_SOURCE_ID: "LOTBA Sorteo 52864 (2026-09-04)"
```

---

## 2. AUDITORÍA DEL GATE DE RESULTADO OFICIAL

Se inspeccionaron los servicios `clientEngine.js`, `preDrawService.js`, `canonicalPredictionsLedger.js` y el componente `PredictionsTab.jsx` para determinar si existe una barrera de validación (*gatekeeper*) antes de dar por válido un resultado para evaluación.

### Hallazgos de Validación
1. **Validación de Fecha de Extracto vs Fecha de Sorteo:** **INEXISTENTE**. El cliente asume ciegamente que si consultó la API en la fecha actual, cualquier sorteo obtenido corresponde a la fecha actual (`todayStr`). No se parsea ni se verifica el campo fecha del encabezado del extracto oficial.
2. **Validación de Status del Sorteo (`PUBLISHED` / `COMPLETED`):** **INEXISTENTE**. No se verifica un estado formal de cierre de acta oficial.
3. **Validación de Margen Temporal Post-Sorteo:** **INEXISTENTE**. El cálculo de `lastClosed` en el cliente se dispara al cumplirse el segundo exacto `15:00:00`, asumiendo disponibilidad instantánea del resultado.
4. **Validación Criptográfica / Hash de Integridad del Extracto:** **INEXISTENTE** en el frontend de usuario (a diferencia del backend de auditoría de Fase 5 donde sí se exige hash oficial).

### Respuestas de Verificación — Sección 2
```yaml
OFFICIAL_RESULT_GATE_EXISTS: NO
OFFICIAL_RESULT_VALIDATION_MISSING: YES
EVALUATES_BLINDLY_AGAINST_FALLBACK: YES
```

---

## 3. AUDITORÍA DEL SHIFT CARRYOVER (MATUTINA -> VESPERTINA)

Al seleccionarse el turno **Vespertina 18:00**, el motor IA ML-FULL mostró en pantalla los mismos números que habían sido emitidos para Matutina 15:00: `76, 77, 73, 97, 55`.

### Datos de Identidad Criptográfica y Registros
- **Matutina Prediction ID:** `CANONICAL_2026-09-05_CIUDAD_MATUTINA_ML-FULL`
- **Matutina Top 5:** `['76', '77', '73', '97', '55']`
- **Vespertina Prediction ID Requerido:** `CANONICAL_2026-09-05_CIUDAD_VESPERTINA_ML-FULL`
- **Vespertina Top 5 Real Calculado por ML-FULL:** `['73', '13', '88', '20', '33']`
- **Vespertina Top 5 Renderizado en Pantalla:** `['76', '77', '73', '97', '55']` (Arrastre directo de Matutina)

### Causa Raíz Técnica del Arrastre
1. **Ausencia de Registro Pre-sembrado para Vespertina:**
   En `frontend/src/services/canonicalPredictionsLedger.js`, el array `PRE_SEEDED_CANONICAL_RECORDS` contenía registros para `previa`, `primera` y `matutina`, pero **no** para `vespertina` ni `nocturna`.
2. **Comportamiento Fallback por Defecto en el Ledger:**
   En `canonicalPredictionsLedger.js` (líneas 509 y 520):
   ```javascript
   const cleanShift = (shift || 'matutina').toLowerCase().replace('la_', '');
   ```
   Si la consulta de lookup fallaba o pasaba un turno no resuelto, el ledger aplicaba `'matutina'` como default.
3. **Persistencia en React Memo / State:**
   En `PredictionsTab.jsx` (líneas 88-93):
   ```javascript
   const mlTop5Active = useMemo(() => {
     if (canonicalMLActive && canonicalMLActive.status === 'LOCKED' && Array.isArray(canonicalMLActive.top_5) && canonicalMLActive.top_5.length > 0) {
       return formatItemsFromTop5(canonicalMLActive.top_5);
     }
     return [];
   }, [canonicalMLActive?.prediction_hash, canonicalMLActive?.status]);
   ```
   Al cambiar la pestaña a Vespertina, como no existía un registro canónico pre-sellado para Vespertina en el ledger, la llamada de recuperación reactiva no encontraba un registro activo nuevo. 
4. **Coexistencia Visual con el Bloque 2:**
   El Bloque 2 ("Último Sorteo Cerrado") mostraba a su vez la predicción cerrada de Matutina (`canonicalClosedML` = `76, 77, 73, 97, 55`). Al fallar la carga limpia de Vespertina en Bloque 1, el usuario visualizaba los mismos 5 números tanto en la predicción como en el cierre anterior.

---

## 4. ESTADO DE VESPERTINA 18:00

- **Hora Límite Efectiva de Vespertina:** 17:45 ART (15 minutos antes del sorteo de las 18:00 ART).
- **Registros Canónicos UI de Vespertina:** No habían sido pre-cargados en `canonicalPredictionsLedger.js`.
- **Modelos Científicos de Vespertina:** No habían sido sellados en `prospective_test_v1.json` ni en `prospective_audit_ledger.json` al momento del incidente.
- **Estado Pre-Draw:**
```yaml
VESPERTINA_PRE_DRAW_STATUS: UNREGISTERED
```

---

## 5. VERIFICACIÓN DE ORIGEN DE LOS NÚMEROS 55 Y 63

| Número | Presente en Predicción Matutina Ciudad ML-FULL | Presente en Predicción Matutina Ciudad Estadístico | Presente en Sorteo Fallback 52864 (04/09/2026) | Presente en Predicción Vespertina ML-FULL Real |
| :---: | :---: | :---: | :---: | :---: |
| **55** | **SÍ** (Posición 5, index 4) | NO | **SÍ** (Provincia Posición 4: `0655`) | NO |
| **63** | NO | **SÍ** (Posición 5, index 4) | **SÍ** (Ciudad Cabeza Posición 1: `2663`) | NO |

**Conclusión inequívoca:**
- El **63** provino de la coincidencia entre la predicción canónica del Motor Estadístico de Matutina (`['21', '12', '00', '92', '63']`) y la Cabeza del sorteo obsoleto `52864` (`2663`).
- El **55** provino de la coincidencia entre la predicción canónica de IA ML-FULL de Matutina (`['76', '77', '73', '97', '55']`) y la posición #4 del sorteo obsoleto `52864` (`0655`).
- Ninguno de los dos números provino de un sorteo legítimo del 2026-09-05.

---

## 6. CLASIFICACIÓN TÉCNICA DE LOS INCIDENTES

```yaml
PREMATURE_RESULT_EVALUATION: YES
STALE_OFFICIAL_RESULT: YES
WRONG_SHIFT_RESULT: NO (El turno era matutina, pero del día 04/09/2026)
SHIFT_PREDICTION_CARRYOVER: YES
REACT_STATE_LEAK: YES
LOOKUP_KEY_MISMATCH: YES
EVALUATION_GATE_ABSENT: YES
```

---

## 7. IMPACTO EN EL PROTOCOLO FASE 5

1. **Predicciones Científicas de Matutina Intactas:**
   Las 12 predicciones científicas generadas a las 14:40 ART (6 para Ciudad y 6 para Provincia) permanecen selladas, con sus hashes criptográficos verificables e inalterados en `prospective_test_v1.json` y `prospective_audit_ledger.json`.
2. **Hashes Criptográficos Válidos:**
   Ningún hash fue modificado ni vulnerado.
3. **Evaluación de Usuario Viciada:**
   La evaluación visual que el usuario presenció en la interfaz web fue espuria y nula, al haberse ejecutado contra datos residuales del 2026-09-04.
4. **Reevaluación Necesaria:**
   Matutina 2026-09-05 debe ser evaluada estrictamente una vez que se ingeste el extracto oficial auténtico correspondiente a la fecha 2026-09-05.
5. **Integridad del N Prospectivo:**
   El conjunto prospectivo `PROSPECTIVE_TEST_V1` se mantiene en su estado formal sin alteraciones arbitrarias.

```yaml
MATUTINA_SCIENTIFIC_PREDICTIONS_STILL_INTACT: YES
MATUTINA_HASHES_STILL_VALID: YES
MATUTINA_RESULT_EVALUATION_TAINTED: YES
MATUTINA_NEEDS_REEVALUATION_WITH_REAL_OFFICIAL_DRAW: YES
PROSPECTIVE_N_MODIFIED: NO
```
