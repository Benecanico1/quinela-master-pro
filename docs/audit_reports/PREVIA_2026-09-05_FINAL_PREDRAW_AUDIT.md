# PREVIA 2026-09-05 FINAL PRE-DRAW AUDIT

**Sorteo Auditado:** 2026-09-05 — Turno La Previa (10:15 hs ART)  
**Horario Efectivo de Deadline:** 10:00 ART (Política de margen obligatorio de 15 minutos pre-sorteo)  
**Timestamp de Auditoría:** `2026-09-05T00:35:00-03:00` (`LOCKED_AT < 10:00 ART` — Elegible)  
**Protocolo:** `TRACEABILITY_V1` + `PHASE5_PROSPECTIVE_SUITE`  

---

## 1. Incidente de Metadatos de Deadline & Addendum de Protocolo

### 1.1. Diagnóstico del Incidente
* En el reporte inicial se registró: `DRAW_TIME = 10:15 ART` y `DEADLINE_FIELD = 10:15 ART`.
* El protocolo original de Fase 5 exige un **margen obligatorio estricto de 15 minutos de anticipación** a la hora de extracción oficial.
* Por lo tanto:
  $$\text{EFFECTIVE\_PHASE5\_DEADLINE} = 10:00\text{ ART}$$
* Dado que los registros canónicos fueron generados y bloqueados a las `00:23 ART` y `00:34 ART` (aproximadamente 9 horas y media antes del sorteo):
  $$\text{LOCKED\_AT} < 10:00\text{ ART}$$
  y los registros son plenamente válidos y elegibles.

```ini
DEADLINE_METADATA_CONFIGURATION_ISSUE = YES
EXISTING_CANONICAL_RECORDS_MODIFIED = 0
EXISTING_PREDICTION_HASHES_MODIFIED = 0
```

### 1.2. Addendum Canónico de Horarios y Deadlines
Para todas las operaciones prospectivas sucesivas se ratifica el cronograma con 15 minutos de antelación:

| Turno Oficial | Horario Sorteo (ART) | Deadline Criptográfico Efectivo (ART) | Margen Pre-Sorteo |
| :--- | :---: | :---: | :---: |
| **La Previa** | 10:15 | **10:00** | 15 min |
| **La Primera** | 12:00 | **11:45** | 15 min |
| **Matutina** | 15:00 | **14:45** | 15 min |
| **Vespertina** | 18:00 | **17:45** | 15 min |
| **Nocturna** | 21:00 | **20:45** | 15 min |

---

## 2. Auditoría y Registro de los 6 Modelos de Fase 5

### 2.1. Estado Previo vs Estado Final
* **Estado Previo:** Los registros del laboratorio científico para 2026-09-05 Previa no estaban inicializados.
  - `CIUDAD_6_MODEL_RECORDS_COMPLETE = NO (Inicial)`
  - `PROVINCIA_6_MODEL_RECORDS_COMPLETE = NO (Inicial)`
* **Acción Ejecutada:** Habiéndose verificado que `00:34 ART < 10:00 ART`, se ejecutó el sellado prospectivo de los 6 modelos congelados sin entrenamiento, sin reponderación y sin modificación de hiperparámetros.
* **Estado Final:**
  - `CIUDAD_6_MODEL_RECORDS_COMPLETE = YES`
  - `PROVINCIA_6_MODEL_RECORDS_COMPLETE = YES`

### 2.2. Detalle de los 6 Modelos Sellados en `prospective_audit_ledger.json`

#### Ciudad (Nacional) — La Previa 2026-09-05
1. **ML-FULL (Champion):**
   - ID: `PRED_2026-09-05_CIUDAD_PREVIA_ML-FULL`
   - Top 5: `["13", "35", "55", "97", "48"]` (Coincidencia 100% con UI)
   - Hash Ledger: `59e863bb7fd58b3562a03cf65392cf99a89c89ce7d7122ce5b40cfb1f8fb8be7`
   - Status: `LOCKED` 🔒
2. **ML-TREND (Challenger 1):**
   - ID: `PRED_2026-09-05_CIUDAD_PREVIA_ML-TREND`
   - Top 5: `["46", "25", "31", "06", "44"]`
   - Hash Ledger: `8af10ec5b17b8c0d1eb96dbba4e5c5dd78d89e4ec32f6a7d5718dfd7d242416f`
   - Status: `LOCKED` 🔒
3. **FREQUENCY-SIMPLE (Challenger 2):**
   - ID: `PRED_2026-09-05_CIUDAD_PREVIA_FREQUENCY-SIMPLE`
   - Top 5: `["03", "99", "83", "75", "37"]`
   - Hash Ledger: `2bab54a31255e7f86f2b4c126d4007d4b6890f5d070be79bf8ef35b5123d242a`
   - Status: `LOCKED` 🔒
4. **MARKOV-PURE (Challenger 3):**
   - ID: `PRED_2026-09-05_CIUDAD_PREVIA_MARKOV-PURE`
   - Top 5: `["97", "67", "77", "87", "27"]`
   - Hash Ledger: `709c41d815e34fe29c8e10c7e2652b414e21a22129d3c52e858dbf4b8f042646`
   - Status: `LOCKED` 🔒
5. **HEURISTIC-BASELINE (Baseline):**
   - ID: `PRED_2026-09-05_CIUDAD_PREVIA_HEURISTIC-BASELINE`
   - Top 5: `["47", "07", "66", "21", "53"]` (Coincidencia 100% con UI Motor Estadístico)
   - Hash Ledger: `27acd0d4d43e8c9c0b2d69e4f014e7aebad18816c9657b98d9ae4878a873523a`
   - Status: `LOCKED` 🔒
6. **RANDOM-REFERENCE (Random):**
   - ID: `PRED_2026-09-05_CIUDAD_PREVIA_RANDOM-REFERENCE`
   - Top 5: `["92", "69", "18", "13", "42"]`
   - Hash Ledger: `00154e7b799cc6045465691c28c8dbd5eb2fb9264c7816bc8d16ae306a4b11f7`
   - Status: `LOCKED` 🔒

#### Provincia (Buenos Aires) — La Previa 2026-09-05
1. **ML-FULL (Champion):**
   - ID: `PRED_2026-09-05_PROVINCIA_PREVIA_ML-FULL`
   - Top 5: `["27", "26", "43", "77", "87"]` (Coincidencia 100% con UI)
   - Hash Ledger: `3af2f0352e918f8ab6230f80695079a49f53e6b7c53d1008f1b953d60c496ba4`
   - Status: `LOCKED` 🔒
2. **ML-TREND (Challenger 1):**
   - ID: `PRED_2026-09-05_PROVINCIA_PREVIA_ML-TREND`
   - Top 5: `["72", "05", "43", "55", "31"]`
   - Hash Ledger: `fcc2c71edaa8b9ca2ea594191307b2207b9a5f7823e20e6fbb1e0310214c77c0`
   - Status: `LOCKED` 🔒
3. **FREQUENCY-SIMPLE (Challenger 2):**
   - ID: `PRED_2026-09-05_PROVINCIA_PREVIA_FREQUENCY-SIMPLE`
   - Top 5: `["60", "10", "74", "81", "63"]`
   - Hash Ledger: `382651b806a29d7a229a1ee235ef98748366e4ae0df244d2b271d471b05cb9e0`
   - Status: `LOCKED` 🔒
4. **MARKOV-PURE (Challenger 3):**
   - ID: `PRED_2026-09-05_PROVINCIA_PREVIA_MARKOV-PURE`
   - Top 5: `["74", "64", "84", "94", "24"]`
   - Hash Ledger: `316dc6a5d77e3d142b7816efeb3d44111dd954e7d9b935ce309489f38e0787e7`
   - Status: `LOCKED` 🔒
5. **HEURISTIC-BASELINE (Baseline):**
   - ID: `PRED_2026-09-05_PROVINCIA_PREVIA_HEURISTIC-BASELINE`
   - Top 5: `["74", "47", "37", "81", "71"]` (Coincidencia 100% con UI Motor Estadístico)
   - Hash Ledger: `a61c827b676912e316a506be7310dfdbf35db67b57973c5cfba76fcb7fa71e62`
   - Status: `LOCKED` 🔒
6. **RANDOM-REFERENCE (Random):**
   - ID: `PRED_2026-09-05_PROVINCIA_PREVIA_RANDOM-REFERENCE`
   - Top 5: `["82", "00", "43", "56", "96"]`
   - Hash Ledger: `26d749b347b776756858204689b9d36371cb71ffeb50ba4a4b27bf21516f4692`
   - Status: `LOCKED` 🔒

---

## 3. ML-FULL — Auditoría Científica de Integridad y Temporalidad

* **MODEL_HASH (Entry en `frozen_models_registry.json`):** `81145e98ae42878fee4bc6619f3705b60dc0d3a985c728475bb3ba5066734473`
* **MODEL_ENGINE_HASH (`mlPredictionEngine.js`):** `95a96afa6f283357f10e3aa14e501ca5cda5d201e80bb0481086cc1a0a63e2c7`
* **DATASET_HASH (`draws.json` 2.235 sorteos):** `691c70b858532fd9ba24fb70e303a62d6769eef60a640f07ddf6e7d98b52adaa`
* **LAST_KNOWN_DRAW_USED:** `2026-09-04_provincia_nocturna` (Cabeza: `97`)
* **PREDICTION_HASH (Ciudad ML-FULL):**
  - Canonical Ledger: `65e1ec846396b2b0b697bcb265c9dd625d982b01c69a532398b9ed507ad386ae`
  - Audit Ledger Payload: `59e863bb7fd58b3562a03cf65392cf99a89c89ce7d7122ce5b40cfb1f8fb8be7`
* **PREDICTION_HASH (Provincia ML-FULL):**
  - Canonical Ledger: `889a10397222c7512f42126a468f889712551bf2c60120119fefe2370d2439c7`
  - Audit Ledger Payload: `3af2f0352e918f8ab6230f80695079a49f53e6b7c53d1008f1b953d60c496ba4`

### Verificación Temporal del Dataset
* Todos los 2.235 sorteos incorporados al dataset ocurrieron antes de las 21:00 hs ART del `2026-09-04`.
* No existen extracciones correspondientes al `2026-09-05` ni a La Previa.
* Leakage Audit Result: Zero leakage events detected (`temporal_leakage: PASS`, `target_leakage: PASS`, `dataset_leakage: PASS`).

$$\text{TEMPORAL\_DATASET\_CHECK} = \mathbf{PASS}$$

---

## 4. Verificación de UI — Top 5 Intactos e Invariables

Los números visibles en la aplicación para el usuario se mantienen exactamente:

| Fila / Motor | Jurisdicción | Top 5 Canónico | Top 5 UI Visible | Match |
| :--- | :--- | :---: | :---: | :---: |
| **🧠 Fila 1 (ML-FULL)** | Ciudad (Nacional) | `13, 35, 55, 97, 48` | `13, 35, 55, 97, 48` | **PASS** |
| **📊 Fila 2 (Estadístico)** | Ciudad (Nacional) | `47, 07, 66, 21, 53` | `47, 07, 66, 21, 53` | **PASS** |
| **🧠 Fila 1 (ML-FULL)** | Provincia (Bs As) | `27, 26, 43, 77, 87` | `27, 26, 43, 77, 87` | **PASS** |
| **📊 Fila 2 (Estadístico)** | Provincia (Bs As) | `74, 47, 37, 81, 71` | `74, 47, 37, 81, 71` | **PASS** |

$$\text{UI\_CANONICAL\_MATCH} = \mathbf{PASS}$$

---

## 5. Cuadro de Mandos y Resumen de Métricas Solicitadas

```ini
EFFECTIVE_DEADLINE = 10:00 ART
DEADLINE_METADATA_CONFIGURATION_ISSUE = YES
EXISTING_CANONICAL_RECORDS_MODIFIED = 0
EXISTING_PREDICTION_HASHES_MODIFIED = 0
CIUDAD_6_MODEL_RECORDS_COMPLETE = YES
PROVINCIA_6_MODEL_RECORDS_COMPLETE = YES
ML_FULL_MODEL_HASH_VERIFIED = YES
ML_FULL_DATASET_HASH_VERIFIED = YES
TEMPORAL_DATASET_CHECK = PASS
UI_CANONICAL_MATCH = PASS
PROSPECTIVE_N = 2
MODELS_MODIFIED = 0
```

---

## 6. Estado de Cierre: DETENIDO A LA ESPERA DEL SORTEO

* **NO SE EVALÚAN RESULTADOS TODAVÍA.**
* **NO SE INCREMENTA N (`PROSPECTIVE_N = 2` SE MANTIENE INTACTO HASTA LA REALIZACIÓN OFICIAL DEL SORTEO).**
* El sistema queda en espera pasiva del sorteo de las 10:15 hs ART.
