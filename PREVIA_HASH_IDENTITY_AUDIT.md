# PREVIA 2026-09-05 — HASH IDENTITY AUDIT (READ-ONLY)

**Fecha y Turno Auditado:** 2026-09-05 — La Previa (10:15 hs ART)  
**Modalidad de Auditoría:** READ-ONLY (Sin modificaciones de código, modelos, predicciones ni hashes)  
**Timestamp de Auditoría:** `2026-09-05T00:39:00-03:00`  
**Estado Operativo:** PRE-DRAW VERIFIED (Pre-sorteo, `LOCKED_AT < 10:00 ART`)  

---

## 1. Identidad y Trazabilidad del Modelo ML-FULL

Se realizó un análisis comparativo de bit exacto sobre los 3 identificadores criptográficos consultados:

| Identificador | Hash SHA-256 | Objeto Exacto / Serialización |
| :--- | :--- | :--- |
| **`ORIGINAL_ML_FULL_MODEL_HASH`** | `7bd5f299378f2181a5263c99bba41ff0265f028555172ad7ebded78ba13acda2` | Serialización Canónica JSON (`canonical_hash` con `separators=(',', ':')`, `sort_keys=True`, `ensure_ascii=False`) del diccionario `models["ML-FULL"]` en `frozen_models_registry.json`. |
| **`FROZEN_MODELS_REGISTRY_HASH`** | `81145e98ae42878fee4bc6619f3705b60dc0d3a985c728475bb3ba5066734473` | Serialización Python por defecto (`json.dumps(..., sort_keys=True)` con espacios estándar `', '` y `': '`) sobre el **mismo e idéntico** diccionario `models["ML-FULL"]`. |
| **`ML_PREDICTION_ENGINE_JS_HASH`** | `95a96afa6f283357f10e3aa14e501ca5cda5d201e80bb0481086cc1a0a63e2c7` | Hash SHA-256 del archivo físico completo de implementación en JavaScript (`frontend/src/services/mlPredictionEngine.js`). |

### Dictamen de Identidad Matemática:
* Al serializar `frozen_models_registry.json["models"]["ML-FULL"]` con el estándar canónico estricto de Fase 5 (`separators=(',', ':')`):
  $$\text{SHA-256}(\text{ml\_full\_canonical\_json}) = \mathbf{7bd5f299378f2181a5263c99bba41ff0265f028555172ad7ebded78ba13acda2}$$
  **Coincidencia 100% de bit exacto con el hash original del freeze.**
* La diferencia observada con `81145e98...` se debió exclusivamente a los espacios en blanco del formateador por defecto de Python (`', '` vs `','`), no a una alteración de los parámetros ni de los datos del modelo.

```ini
ORIGINAL_HASH_OBJECT = Canonical JSON representation of frozen_models_registry.json["models"]["ML-FULL"]
REGISTRY_HASH_OBJECT = Default Python json.dumps of the same frozen_models_registry.json["models"]["ML-FULL"]
ENGINE_HASH_OBJECT = Raw file SHA-256 of frontend/src/services/mlPredictionEngine.js

SAME_ML_FULL_MODEL_PARAMETERS = YES
SAME_FEATURE_SCHEMA = YES
SAME_WEIGHTS = YES
SAME_HYPERPARAMETERS = YES
MODEL_CHANGED_SINCE_PHASE5_FREEZE = NO
```

---

## 2. Doble Hash de Predicción (Arquitectura Multi-Capa)

Se auditó la coexistencia de dos hashes criptográficos para cada predicción de `ML-FULL`:

### 2.1. Desglose de Hashes por Capa

#### Caso Ciudad (Nacional)
* **CanonicalPredictionRecord Hash:** `65e1ec846396b2b0b697bcb265c9dd625d982b01c69a532398b9ed507ad386ae`
* **Prospective Audit Ledger Hash:** `59e863bb7fd58b3562a03cf65392cf99a89c89ce7d7122ce5b40cfb1f8fb8be7`

#### Caso Provincia (Buenos Aires)
* **CanonicalPredictionRecord Hash:** `889a10397222c7512f42126a468f889712551bf2c60120119fefe2370d2439c7`
* **Prospective Audit Ledger Hash:** `3af2f0352e918f8ab6230f80695079a49f53e6b7c53d1008f1b953d60c496ba4`

### 2.2. Especificación Técnica de Cada Hash

| Atributo | Hash 1: `CanonicalPredictionRecord` | Hash 2: `Prospective Audit Ledger` |
| :--- | :--- | :--- |
| **Nombre Formal** | `CANONICAL_PREDICTION_SEAL` | `SCIENTIFIC_AUDIT_LEDGER_HASH` |
| **Función Generadora** | `computeSHA256()` en `canonicalPredictionsLedger.js` | `canonical_hash()` en `prospective_validation_engine.py` |
| **Campos Incluidos** | Concatenación delimitada: `id:date:jur:shift:engine:top5` | Payload JSON exhaustivo con 18 campos (ranking completo de 100 números, scores flotantes continuos, dataset_hash, snapshots de features y parámetros del modelo). |
| **Formato / Serialización** | String UTF-8 directo delimitado por dos puntos (`:`) | JSON Canónico Determinista (`sort_keys=True`, `separators=(',', ':')`) |
| **Propósito de Negocio** | **Inmutabilidad de la Interfaz:** Garantiza que los números mostrados al usuario en pantalla, cupón y WhatsApp sean exactamente los mismos que se evalúan post-sorteo. | **Validación Científica:** Garantiza que la inferencia matemática no haya tenido fuga temporal, auditando los 100 números, probabilidades y versiones de dataset. |

### 2.3. Dictamen de Concordancia del Core Predictivo
Ambos registros protegen exactamente la misma predicción de base:

| Campo Core | `CanonicalPredictionRecord` | `Prospective Audit Ledger` | Estado |
| :--- | :---: | :---: | :---: |
| **Fecha** | `2026-09-05` | `2026-09-05` | **COINCIDE** |
| **Turno** | `previa` | `previa` | **COINCIDE** |
| **Modelo** | `ML-FULL` | `ML-FULL` | **COINCIDE** |
| **Top 5 Ciudad** | `["13", "35", "55", "97", "48"]` | `["13", "35", "55", "97", "48"]` | **COINCIDE** |
| **Top 5 Provincia** | `["27", "26", "43", "77", "87"]` | `["27", "26", "43", "77", "87"]` | **COINCIDE** |

```ini
CANONICAL_HASH_PURPOSE = Client-side UI & Coupon immutability (Single Source of Truth)
AUDIT_LEDGER_HASH_PURPOSE = Scientific backend prospective validation (100 numbers, probabilities & temporal leakage audit)
HASH_DIFFERENCE_EXPECTED = YES
CORE_PREDICTION_FIELDS_MATCH = PASS
```

---

## 3. Verificación de Deadline Efectivo

* **Horario de Sorteo:** 10:15 ART
* **Deadline Efectivo de Fase 5:** **10:00 ART** (13:00 UTC)
* **Marcas de Tiempo de Bloqueo Registradas:**
  - Canonical Records: `2026-09-05T03:23:35Z` (`00:23 ART`)
  - Scientific Audit Ledger: `2026-09-05 03:34:10 UTC` (`00:34 ART`)
* **Condición de Elegibilidad:**
  $$\text{LOCKED\_AT} < 10:00\text{ ART} \quad (\Delta t \approx 9\text{ horas y } 26\text{ minutos antes del deadline})$$
* **Regla de Evaluación:**
  El Evaluation Engine evaluará con `EFFECTIVE_DEADLINE = 10:00 ART`, manteniendo inalterados los metadatos ya sellados en los registros bloqueados pre-sorteo.

$$\text{EFFECTIVE\_DEADLINE\_CHECK} = \mathbf{PASS}$$

---

## 4. Cuadro de Mandos de Certificación Final

```ini
MODEL_CHANGED_SINCE_PHASE5_FREEZE = NO
SAME_ML_FULL_MODEL_PARAMETERS = YES
CORE_PREDICTION_FIELDS_MATCH = PASS
HASH_DIFFERENCE_EXPECTED = YES
EFFECTIVE_DEADLINE_CHECK = PASS
PREDICTIONS_MODIFIED = 0
MODELS_MODIFIED = 0
PROSPECTIVE_N = 2
```

---

## 5. Estado de Ejecución

* **AUDITORÍA FORENSE READ-ONLY FINALIZADA.**
* **EL SISTEMA PERMANECE DETENIDO A LA ESPERA DEL SORTEO (10:15 HS ART).**
* **NO SE EVALÚAN RESULTADOS.**
* **NO SE MODIFICA EL CONTADOR PROSPECTIVO (`PROSPECTIVE_N = 2`).**
