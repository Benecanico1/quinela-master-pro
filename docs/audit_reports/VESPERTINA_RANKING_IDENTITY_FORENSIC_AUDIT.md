# AUDITORÍA FORENSE READ-ONLY: IDENTIDAD DE RANKINGS MATUTINA Y VESPERTINA 2026-09-05
**Protocolo:** TRACEABILITY_V1 / FASE 5  
**Modo:** READ-ONLY FORENSIC AUDIT (0 modificaciones de código, 0 modificaciones de modelos, 0 modificaciones de predicciones, 0 modificaciones de hashes, 0 modificaciones de ledgers, 0 modificaciones a PROSPECTIVE_N).  
**Fecha:** 2026-09-05 17:36 ART  

---

## 1. MATUTINA — LECTURA DIRECTA DE LEDGERS REALES

Se inspeccionaron directamente los registros sellados y bloqueados en `prospective_audit_ledger.json` y `canonicalPredictionsLedger.js` sin invocar funciones de inferencia (`getMLPredictions`):

### CIUDAD MATUTINA ML-FULL:
- **prediction_id:** `PRED_2026-09-05_CIUDAD_MATUTINA_ML-FULL`
- **top_5:** `['76', '77', '73', '97', '55']`
- **created_at:** `2026-09-05 17:30:00 UTC` (14:30 ART)
- **locked_at:** `2026-09-05 17:30:00 UTC` (14:30 ART)
- **prediction_hash:** `a03c5aa7f12ad6dea86119124123d2bc3746da41bfa91a41ead2198312fcca2f`
- **Canonical Ledger ID:** `CANONICAL_2026-09-05_CIUDAD_MATUTINA_ML-FULL` (Top 5: `['76', '77', '73', '97', '55']`, Hash: `cae88853bed9501a472832837f0dd7719b5c70cc66dfac7652e8ad92eff70c1d`)

### PROVINCIA MATUTINA ML-FULL:
- **prediction_id:** `PRED_2026-09-05_PROVINCIA_MATUTINA_ML-FULL`
- **top_5:** `['77', '38', '27', '92', '54']`
- **created_at:** `2026-09-05 17:30:00 UTC` (14:30 ART)
- **locked_at:** `2026-09-05 17:30:00 UTC` (14:30 ART)
- **prediction_hash:** `f9be24c13fdc04cff507bb07b4f7507a0443dbfed4230dc0be81853b7dea6462`
- **Canonical Ledger ID:** `CANONICAL_2026-09-05_PROVINCIA_MATUTINA_ML-FULL` (Top 5: `['77', '38', '27', '92', '54']`, Hash: `c2a6e860263a286ea0e1f6a4787801b06ce22b1d67afadd291d9e94994f2f502`)

### Comparación y Dictamen:
- **Sellado Documentado Original:**
  - Ciudad: `76, 77, 73, 97, 55` &rarr; **COINCIDENCIA EXACTA**
  - Provincia: `77, 38, 27, 92, 54` &rarr; **COINCIDENCIA EXACTA**
- `MATUTINA_LEDGER_TOP5_MATCHES_ORIGINAL = PASS`
- `SECTION5_MATUTINA_VALUES_SOURCE = "ALUCINACIÓN TEXTUAL NARRATIVA EN EL REPORTE (Los ledgers siempre conservaron 76, 77, 73, 97, 55; la cadena '55, 63, 08, 73, 84' nunca existió en ningún ledger)"`

---

## 2. VESPERTINA CIUDAD — LECTURA DIRECTA DE LEDGER

Se leyó directamente el registro `CANONICAL_2026-09-05_CIUDAD_VESPERTINA_ML-FULL` en `canonicalPredictionsLedger.js`:

- **prediction_id:** `CANONICAL_2026-09-05_CIUDAD_VESPERTINA_ML-FULL`
- **top_5:** `['73', '13', '88', '20', '33']`
- **expected_draw_number:** `52870`
- **created_at:** `2026-09-05T16:55:00.000-03:00`
- **locked_at:** `2026-09-05T16:55:00.000-03:00`
- **deadline:** `2026-09-05T17:45:00.000-03:00`
- **prediction_hash:** `e68261cd11c5bdbfd9edf8dcfd94fd1f3c7bce2b88392b7395eee6e90cdf723f`
- **status:** `LOCKED`

### Comparación contra el sellado y auditoría de Sección 5:
- **Sellado Registrado en Ledger:** `73, 13, 88, 20, 33`
- **Valores en Sección 5 del Reporte Anterior:** `['73', '04', '77', '18', '29']`
- **Determinación:**
  - `VESPERTINA_CITY_LEDGER_TOP5 = ['73', '13', '88', '20', '33']`
  - `SECTION5_VESPERTINA_TOP5_SOURCE = "ALUCINACIÓN TEXTUAL NARRATIVA EN EL REDACTADO DEL REPORTE"`
  - `RANKING_MISMATCH = NO (El ledger real jamás contuvo '73, 04, 77, 18, 29'; la discrepancia existió exclusivamente en el texto markdown del reporte anterior y NO en los ledgers)"`

---

## 3. PROVINCIA VESPERTINA V2 — CONFIRMACIÓN EN LEDGERS

Se leyeron directamente los registros de reemplazo sellados en `canonicalPredictionsLedger.js`:

### CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_ML-FULL_V2:
- **top_5:** `['38', '67', '33', '77', '27']` &rarr; **CONFIRMADO**
- **expected_draw_number:** `52870` &rarr; **CONFIRMADO**
- **locked_at:** `2026-09-05T17:05:00.000-03:00` (< 17:45 ART) &rarr; **CONFIRMADO**
- **status:** `LOCKED` &rarr; **CONFIRMADO**
- **prediction_hash:** `566856d8b60b77a1c607627fec70b150a7c87a36cd567971bd273b6528b3bc24`

### CANONICAL_2026-09-05_PROVINCIA_VESPERTINA_STATISTICAL_V2:
- **top_5:** `['63', '83', '38', '48', '32']` &rarr; **CONFIRMADO**
- **expected_draw_number:** `52870` &rarr; **CONFIRMADO**
- **locked_at:** `2026-09-05T17:05:00.000-03:00` (< 17:45 ART) &rarr; **CONFIRMADO**
- **status:** `LOCKED` &rarr; **CONFIRMADO**
- **prediction_hash:** `3682041b7daa2e14e805beb5f79d519028e542381eda5a974a7f7179845eca97`

---

## 4. REEMPLAZOS V2 — COMPARACIÓN DE IDENTIDAD PREDICTIVA (PAYLOAD CHECK)

Para cada uno de los 6 modelos científicos de Provincia Vespertina en `prospective_audit_ledger.json`, se comparó campo por campo el registro original `SUPERSEDED_INVALID` contra el registro `_V2`:

| Modelo Científico | top_5 Idéntico | top_10 Idéntico | top_20 Idéntico | full_ranking Idéntico | scores Idénticos | dataset_hash Idéntico | model_hash Idéntico |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ML-FULL** | `['38','67','33','77','27']` (PASS) | PASS | PASS | PASS | PASS | PASS (`649cb9...`) | PASS |
| **ML-TREND** | `['72','05','43','55','31']` (PASS) | PASS | PASS | PASS | PASS | PASS (`649cb9...`) | PASS |
| **FREQUENCY-SIMPLE** | `['60','10','74','81','63']` (PASS) | PASS | PASS | PASS | PASS | PASS (`649cb9...`) | PASS |
| **MARKOV-PURE** | `['74','64','84','94','24']` (PASS) | PASS | PASS | PASS | PASS | PASS (`649cb9...`) | PASS |
| **HEURISTIC-BASELINE**| `['63','83','38','48','32']` (PASS) | PASS | PASS | PASS | PASS | PASS (`649cb9...`) | PASS |
| **RANDOM-REFERENCE** | `['97','28','61','41','44']` (PASS) | PASS | PASS | PASS | PASS | PASS (`649cb9...`) | PASS |

### Campos que cambiaron legítimamente entre Original y V2:
- `prediction_id`: se añadió sufijo `_V2`.
- `expected_draw_number`: corregido de `None` / `49728` a `52870`.
- `prediction_created_at` / `locked_at`: `17:05:00 ART` (ambos pre-sorteo, antes de 17:45 ART).
- `prediction_status`: de `SUPERSEDED_INVALID` a `LOCKED`.
- `prediction_hash`: recalculado criptográficamente por la variación de los metadatos anteriores.

**Inferencia y Payload Predictivo:** Cero modificaciones.
`V2_PREDICTIVE_PAYLOAD_IDENTICAL_TO_ORIGINAL = PASS`

---

## 5. AUDITORÍA DE RECÁLCULO EN SCRIPTS DE VERIFICACIÓN

Se auditó el script de verificación `verify_vespertina_sealing.mjs` y los scripts auxiliares:
1. En `verify_vespertina_sealing.mjs` (líneas 30 y 32) se observó que, con el objetivo de comprobar si la UI mostraría los mismos números que el ledger canónico, el script invocó `getMLPredictions()` y `getClientPredictions()`.
2. Dicha ejecución fue de **sólo lectura de testing** (no persistió ni modificó los ledgers existentes), pero violó la buena práctica de leer **única y exclusivamente** los ledgers sellados.
3. El script que generó los datos de la Sección 5 no fue un script sino la redacción narrativa del asistente que inventó números ficticios para ilustrar un ejemplo de aislamiento.

```yaml
AUDIT_SCRIPT_RECALCULATED_PREDICTIONS: YES (En verify_vespertina_sealing.mjs para test de UI, sin alterar ledgers)
AUDIT_REPORT_USED_LIVE_RECALCULATION: NO (Fue una alucinación en el texto markdown, no un recálculo en vivo)
```

> [!IMPORTANT]
> **Norma Operativa Inflexible:** En todas las auditorías de identidad futuras queda **terminantemente prohibido** invocar motores predictivos (`getMLPredictions`, `getClientPredictions` o scripts en backend). Todas las auditorías de identidad deben inspeccionar **exclusivamente de forma estática** los archivos JSON y JS de los ledgers.

---

## 6. CONFIRMACIÓN FINAL DE SEGURIDAD

```yaml
MATUTINA_LEDGER_INTACT: YES
VESPERTINA_CITY_LEDGER_INTACT: YES
VESPERTINA_PROVINCE_V2_LEDGER_INTACT: YES
V2_PREDICTIVE_PAYLOAD_IDENTICAL_TO_ORIGINAL: PASS
AUDIT_REPORT_USED_LIVE_RECALCULATION: NO
PREDICTIONS_MODIFIED: 0
HASHES_MODIFIED: 0
MODELS_MODIFIED: 0
PROSPECTIVE_N: 4
```
