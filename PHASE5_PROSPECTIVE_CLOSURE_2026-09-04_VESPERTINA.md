# FASE 5 — CIERRE DEL PRIMER SORTEO PROSPECTIVO (2026-09-04 VESPERTINA)

**Fecha del Sorteo Oficial:** 2026-09-04  
**Turno:** Vespertina (18:00 ART)  
**Sorteo Oficial LOTBA N°:** 52865  
**Fuente Oficial:** Lotería de la Ciudad de Buenos Aires (LOTBA S.E.) / Instituto Provincial de Lotería y Casinos (IPLyC)  
**Protocolo:** FASE 5 — Prospective Immutable Ledger & Cryptographic Verification  
**Estado:** EVALUACIÓN PROSPECTIVA CONCLUIDA (N = 2 Sorteos Válidos)

---

## 1. RESULTADOS OFICIALES INGESTADOS

### A. CIUDAD (NACIONAL) — VESPERTINA
* **Sorteo:** 52865
* **Fecha:** 2026-09-04 | **Hora:** 18:00 ART
* **Cabeza (1° Premio):** `2113` (Ambo `13` — "La Yerba")
* **Extracto Oficial Completo (Posiciones 1 a 20):**

| Posición | Número Oficial | Ambo (2 cifras) | Posición | Número Oficial | Ambo (2 cifras) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **01 (Cabeza)** | **2113** | **13** | **11** | 7382 | 82 |
| **02** | 5512 | 12 | **12** | 4511 | 11 |
| **03** | 6882 | 82 | **13** | 6946 | 46 |
| **04** | 2588 | 88 | **14** | 4905 | 05 |
| **05** | 9684 | 84 | **15** | 9420 | 20 |
| **06** | 4961 | 61 | **16** | 8420 | 20 |
| **07** | 1579 | 79 | **17** | 9244 | 44 |
| **08** | 6772 | 72 | **18** | 3690 | 90 |
| **09** | 3619 | 19 | **19** | 8799 | 99 |
| **10** | 3449 | 49 | **20** | 5804 | 04 |

* **Hash Criptográfico del Extracto Ciudad (SHA-256):** `94883f36a5a2283a0058b738e4a9561b369165d755716bc5ce8d5f3088aa9086`

---

### B. PROVINCIA DE BUENOS AIRES — VESPERTINA
* **Sorteo:** 52865
* **Fecha:** 2026-09-04 | **Hora:** 18:00 ART
* **Cabeza (1° Premio):** `6838` (Ambo `38` — "El Aceite")
* **Extracto Oficial Completo (Posiciones 1 a 20):**

| Posición | Número Oficial | Ambo (2 cifras) | Posición | Número Oficial | Ambo (2 cifras) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **01 (Cabeza)** | **6838** | **38** | **11** | 2924 | 24 |
| **02** | 8185 | 85 | **12** | 4750 | 50 |
| **03** | 0278 | 78 | **13** | 1742 | 42 |
| **04** | 6475 | 75 | **14** | 0299 | 99 |
| **05** | 7008 | 08 | **15** | 6707 | 07 |
| **06** | 0839 | 39 | **16** | 2689 | 89 |
| **07** | 2594 | 94 | **17** | 0614 | 14 |
| **08** | 4199 | 99 | **18** | 4719 | 19 |
| **09** | 1260 | 60 | **19** | 8528 | 28 |
| **10** | 1068 | 68 | **20** | 2646 | 46 |

* **Hash Criptográfico del Extracto Provincia (SHA-256):** `09bbdfab3e75e9f8df5b3a4a1599cebf3ae3b9b4a45050302824df44c330f6a5`

---

## 2. AUDITORÍA TEMPORAL Y CRIPTOGRÁFICA

Todas las predicciones evaluadas fueron creadas y selladas de forma estricta **antes** de la hora límite oficial:

* **Prediction Created At:** `2026-09-04 19:51:04 UTC` (`16:51:04 ART`)
* **Prediction Locked At:** `2026-09-04 19:51:04 UTC` (`16:51:04 ART`)
* **Prediction Deadline:** `2026-09-04 20:45:00 UTC` (`17:45:00 ART`)
* **Official Result Received At:** `2026-09-04 23:30:00 UTC` (`20:30:00 ART`)
* **Secuencia Temporal:** `Locked (16:51:04) < Deadline (17:45:00) < Extracto Oficial (20:30:00)` -> **PASS**

### Verificación Criptográfica de Hashes Originales

Antes de iniciar la evaluación de aciertos, se recalculó el SHA-256 canónico de cada registro para garantizar que ni una sola predicción, ranking ni peso fue alterado post-bloqueo:

| Predicción ID | Modelo | Jurisdicción | Hash Original Bloqueado | Hash Verificado Post-Sorteo | Match |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `PRED_2026-09-04_CIUDAD_VESPERTINA_ML-FULL` | ML-FULL | CIUDAD | `002b41c89e3885ec...` | `002b41c89e3885ec...` | **MATCH PASS** |
| `PRED_2026-09-04_CIUDAD_VESPERTINA_ML-TREND` | ML-TREND | CIUDAD | `2032abf8cdbb8e93...` | `2032abf8cdbb8e93...` | **MATCH PASS** |
| `PRED_2026-09-04_CIUDAD_VESPERTINA_FREQUENCY-SIMPLE` | FREQ-SIMPLE | CIUDAD | `fc559978df239987...` | `fc559978df239987...` | **MATCH PASS** |
| `PRED_2026-09-04_CIUDAD_VESPERTINA_MARKOV-PURE` | MARKOV-PURE | CIUDAD | `9f981cd8e5cb6bfa...` | `9f981cd8e5cb6bfa...` | **MATCH PASS** |
| `PRED_2026-09-04_CIUDAD_VESPERTINA_HEURISTIC-BASELINE` | HEURISTIC | CIUDAD | `b3233402ae4b62ac...` | `b3233402ae4b62ac...` | **MATCH PASS** |
| `PRED_2026-09-04_CIUDAD_VESPERTINA_RANDOM-REFERENCE` | RANDOM | CIUDAD | `428f8525318aa5eb...` | `428f8525318aa5eb...` | **MATCH PASS** |
| `PRED_2026-09-04_PROVINCIA_VESPERTINA_ML-FULL` | ML-FULL | PROVINCIA | `418fdba53db52a06...` | `418fdba53db52a06...` | **MATCH PASS** |
| `PRED_2026-09-04_PROVINCIA_VESPERTINA_ML-TREND` | ML-TREND | PROVINCIA | `e4d569cb867b0a74...` | `e4d569cb867b0a74...` | **MATCH PASS** |
| `PRED_2026-09-04_PROVINCIA_VESPERTINA_FREQUENCY-SIMPLE` | FREQ-SIMPLE | PROVINCIA | `7f6a9b5d721f1c27...` | `7f6a9b5d721f1c27...` | **MATCH PASS** |
| `PRED_2026-09-04_PROVINCIA_VESPERTINA_MARKOV-PURE` | MARKOV-PURE | PROVINCIA | `ce98ab0ff53489b9...` | `ce98ab0ff53489b9...` | **MATCH PASS** |
| `PRED_2026-09-04_PROVINCIA_VESPERTINA_HEURISTIC-BASELINE` | HEURISTIC | PROVINCIA | `2a55572917926bc8...` | `2a55572917926bc8...` | **MATCH PASS** |
| `PRED_2026-09-04_PROVINCIA_VESPERTINA_RANDOM-REFERENCE` | RANDOM | PROVINCIA | `0acf566c7fc40aa8...` | `0acf566c7fc40aa8...` | **MATCH PASS** |

**Resultado:** 12 de 12 hashes idénticos al bit (`INTEGRITY_CHECK = 100% PASS`).

---

## 3. TABLA COMPARATIVA DE LOS 6 MODELOS

Definiciones métricas:
* **Cabeza:** Acierto directo de `Top 1 == Head Ambo`.
* **Hit@K:** `1` si al menos un número del `Top K` apareció en el extracto de 20 posiciones; `0` en caso contrario.
* **Prec@K:** Total de ocurrencias de números del `Top K` dentro de los 20 premios del extracto oficial dividido $K$ ($	ext{Prec}@K = rac{	ext{Aciertos}}{K}$).

| Modelo | Jurisdicción | Cabeza | Hit@5 | Prec@5 | Hit@10 | Prec@10 | Hit@20 | Prec@20 |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ML-FULL (Champion)** | **CIUDAD** | NO | **1** | **60.0%** | **1** | **30.0%** | **1** | **30.0%** |
| **ML-TREND (Challenger)** | **CIUDAD** | NO | 1 | 40.0% | 1 | 20.0% | 1 | 15.0% |
| **FREQUENCY-SIMPLE** | **CIUDAD** | NO | 1 | 20.0% | 1 | 30.0% | 1 | 20.0% |
| **MARKOV-PURE** | **CIUDAD** | NO | 1 | 40.0% | 1 | 40.0% | 1 | 25.0% |
| **HEURISTIC-BASELINE** | **CIUDAD** | NO | 1 | 40.0% | 1 | 20.0% | 1 | 15.0% |
| **RANDOM-REFERENCE** | **CIUDAD** | NO | 0 | 0.0% | 1 | 20.0% | 1 | 30.0% |
| **ML-FULL (Champion)** | **PROVINCIA** | NO | **1** | **40.0%** | **1** | **20.0%** | **1** | **10.0%** |
| **ML-TREND (Challenger)** | **PROVINCIA** | NO | 0 | 0.0% | 1 | 10.0% | 1 | 10.0% |
| **FREQUENCY-SIMPLE** | **PROVINCIA** | NO | 1 | 20.0% | 1 | 20.0% | 1 | 15.0% |
| **MARKOV-PURE** | **PROVINCIA** | NO | 1 | 40.0% | 1 | 30.0% | 1 | 40.0% |
| **HEURISTIC-BASELINE** | **PROVINCIA** | NO | 0 | 0.0% | 1 | 10.0% | 1 | 5.0% |
| **RANDOM-REFERENCE** | **PROVINCIA** | NO | 0 | 0.0% | 0 | 0.0% | 1 | 20.0% |

---

## 4. EVALUACIÓN DETALLADA MODELO POR MODELO

### A. CIUDAD — VESPERTINA

#### 1. ML-FULL — CHAMPION
* **Top 1:** `07` | **Cabeza Oficial:** `13` -> Acierto a Cabeza: **NO**
* **Top 5 Original:** `['07', '20', '21', '83', '99']`
* **Top 10 Original:** `['07', '20', '21', '83', '99', '08', '59', '28', '53', '37']`
* **Top 20 Original:** `['07', '20', '21', '83', '99', '08', '59', '28', '53', '37', '79', '00', '03', '01', '65', '19', '57', '60', '89', '72']`
* **Aciertos en Top 5:**
  * Ambo `20` -> Posiciones **15** y **16** *(Doble aparición en extracto)*
  * Ambo `99` -> Posición **19**
* **Aciertos en Top 10:** Los mismos del Top 5 (`20` y `99`).
* **Aciertos en Top 20:**
  * Ambo `79` -> Posición **07**
  * Ambo `72` -> Posición **08**
  * Ambo `19` -> Posición **09**
  * Ambo `20` -> Posiciones **15** y **16**
  * Ambo `99` -> Posición **19**
* **Métricas:**
  * Hit@1 = `0` | Hit@5 = `1` | **Precision@5 = 60.0%** (3 apariciones en 5 picks)
  * Hit@10 = `1` | **Precision@10 = 30.0%**
  * Hit@20 = `1` | **Precision@20 = 30.0%** (6 apariciones en 20 picks)

#### 2. ML-TREND — CHALLENGER
* **Top 1:** `46` | **Top 5:** `['46', '25', '31', '06', '44']`
* **Aciertos en Top 5:** `46` (Pos 13), `44` (Pos 17)
* **Aciertos en Top 10:** `46` (Pos 13), `44` (Pos 17)
* **Aciertos en Top 20:** `46` (Pos 13), `44` (Pos 17), `61` (Pos 06)
* **Métricas:** Hit@1 = `0` | Hit@5 = `1` | Prec@5 = `40.0%` | Hit@10 = `1` | Prec@10 = `20.0%` | Hit@20 = `1` | Prec@20 = `15.0%`

#### 3. FREQUENCY-SIMPLE
* **Top 1:** `99` | **Top 5:** `['99', '03', '83', '75', '37']`
* **Aciertos en Top 5:** `99` (Pos 19)
* **Aciertos en Top 10:** `99` (Pos 19), `12` (Pos 02), `90` (Pos 18)
* **Aciertos en Top 20:** `99` (Pos 19), `12` (Pos 02), `90` (Pos 18), `79` (Pos 07)
* **Métricas:** Hit@1 = `0` | Hit@5 = `1` | Prec@5 = `20.0%` | Hit@10 = `1` | Prec@10 = `30.0%` | Hit@20 = `1` | Prec@20 = `20.0%`

#### 4. MARKOV-PURE
* **Top 1:** `85` | **Top 5:** `['85', '82', '92', '95', '75']`
* **Aciertos en Top 5:** `82` (Pos 03 y Pos 11)
* **Aciertos en Top 10:** `82` (Pos 03 y 11), `72` (Pos 08), `05` (Pos 14)
* **Aciertos en Top 20:** `82` (Pos 03 y 11), `72` (Pos 08), `05` (Pos 14), `12` (Pos 02)
* **Métricas:** Hit@1 = `0` | Hit@5 = `1` | Prec@5 = `40.0%` | Hit@10 = `1` | Prec@10 = `40.0%` | Hit@20 = `1` | Prec@20 = `25.0%`

#### 5. HEURISTIC-BASELINE
* **Top 1:** `25` | **Top 5:** `['25', '46', '06', '44', '29']`
* **Aciertos en Top 5:** `46` (Pos 13), `44` (Pos 17)
* **Aciertos en Top 10:** `46` (Pos 13), `44` (Pos 17)
* **Aciertos en Top 20:** `46` (Pos 13), `44` (Pos 17), `05` (Pos 14)
* **Métricas:** Hit@1 = `0` | Hit@5 = `1` | Prec@5 = `40.0%` | Hit@10 = `1` | Prec@10 = `20.0%` | Hit@20 = `1` | Prec@20 = `15.0%`

#### 6. RANDOM-REFERENCE
* **Top 1:** `57` | **Top 5:** `['57', '26', '66', '92', '02']`
* **Aciertos en Top 5:** Ninguno (`0/5`)
* **Aciertos en Top 10:** `49` (Pos 10), `04` (Pos 20)
* **Aciertos en Top 20:** `49` (Pos 10), `04` (Pos 20), `82` (Pos 03 y 11), `19` (Pos 09), `46` (Pos 13)
* **Métricas:** Hit@1 = `0` | Hit@5 = `0` | Prec@5 = `0.0%` | Hit@10 = `1` | Prec@10 = `20.0%` | Hit@20 = `1` | Prec@20 = `30.0%`

---

### B. PROVINCIA — VESPERTINA

#### 1. ML-FULL — CHAMPION
* **Top 1:** `60` | **Cabeza Oficial:** `38` -> Acierto a Cabeza: **NO**
* **Top 5 Original:** `['60', '83', '14', '74', '13']`
* **Top 10 Original:** `['60', '83', '14', '74', '13', '44', '47', '27', '31', '81']`
* **Top 20 Original:** `['60', '83', '14', '74', '13', '44', '47', '27', '31', '81', '43', '37', '26', '93', '49', '00', '57', '02', '71', '69']`
* **Aciertos en Top 5:**
  * Ambo `60` -> Posición **09**
  * Ambo `14` -> Posición **17**
* **Aciertos en Top 10:** Los mismos del Top 5 (`60` y `14`).
* **Aciertos en Top 20:** Los mismos del Top 5 (`60` y `14`).
* **Métricas:**
  * Hit@1 = `0` | Hit@5 = `1` | **Precision@5 = 40.0%** (2 aciertos en 5 picks)
  * Hit@10 = `1` | **Precision@10 = 20.0%**
  * Hit@20 = `1` | **Precision@20 = 10.0%**

#### 2. ML-TREND — CHALLENGER
* **Top 1:** `72` | **Top 5:** `['72', '05', '43', '55', '31']`
* **Aciertos en Top 5:** Ninguno (`0/5`)
* **Aciertos en Top 10:** `94` (Pos 07)
* **Aciertos en Top 20:** `94` (Pos 07), `46` (Pos 20)
* **Métricas:** Hit@1 = `0` | Hit@5 = `0` | Prec@5 = `0.0%` | Hit@10 = `1` | Prec@10 = `10.0%` | Hit@20 = `1` | Prec@20 = `10.0%`

#### 3. FREQUENCY-SIMPLE
* **Top 1:** `60` | **Top 5:** `['60', '10', '15', '74', '63']`
* **Aciertos en Top 5:** `60` (Pos 09)
* **Aciertos en Top 10:** `60` (Pos 09), `14` (Pos 17)
* **Aciertos en Top 20:** `60` (Pos 09), `14` (Pos 17), `89` (Pos 16)
* **Métricas:** Hit@1 = `0` | Hit@5 = `1` | Prec@5 = `20.0%` | Hit@10 = `1` | Prec@10 = `20.0%` | Hit@20 = `1` | Prec@20 = `15.0%`

#### 4. MARKOV-PURE
* **Top 1:** `74` | **Top 5:** `['74', '64', '84', '94', '24']`
* **Aciertos en Top 5:** `94` (Pos 07), `24` (Pos 11)
* **Aciertos en Top 10:** `94` (Pos 07), `24` (Pos 11), `14` (Pos 17)
* **Aciertos en Top 20:** `94` (Pos 07), `24` (Pos 11), `14` (Pos 17), `78` (Pos 03), `68` (Pos 10), `08` (Pos 05), `38` (Pos 01 - Cabeza), `28` (Pos 19)
* **Métricas:** Hit@1 = `0` | Hit@5 = `1` | Prec@5 = `40.0%` | Hit@10 = `1` | Prec@10 = `30.0%` | Hit@20 = `1` | Prec@20 = `40.0%`

#### 5. HEURISTIC-BASELINE
* **Top 1:** `43` | **Top 5:** `['43', '31', '55', '58', '40']`
* **Aciertos en Top 5:** Ninguno (`0/5`)
* **Aciertos en Top 10:** `94` (Pos 07)
* **Aciertos en Top 20:** `94` (Pos 07)
* **Métricas:** Hit@1 = `0` | Hit@5 = `0` | Prec@5 = `0.0%` | Hit@10 = `1` | Prec@10 = `10.0%` | Hit@20 = `1` | Prec@20 = `5.0%`

#### 6. RANDOM-REFERENCE
* **Top 1:** `92` | **Top 5:** `['92', '66', '61', '49', '65']`
* **Aciertos en Top 5:** Ninguno (`0/5`)
* **Aciertos en Top 10:** Ninguno (`0/10`)
* **Aciertos en Top 20:** `50` (Pos 12), `08` (Pos 05), `24` (Pos 11), `14` (Pos 17)
* **Métricas:** Hit@1 = `0` | Hit@5 = `0` | Prec@5 = `0.0%` | Hit@10 = `0` | Prec@10 = `0.0%` | Hit@20 = `1` | Prec@20 = `20.0%`

---

## 5. FOCO EN EL CHAMPION: ML-FULL v1.0

### Comparación Directa:
* **CIUDAD VESPERTINA:**
  * Predicción sellada Top 5: `['07', '20', '21', '83', '99']`
  * Coincidencias en Top 5: **SÍ** (`20` en posición 15 y 16; `99` en posición 19).
  * Acierto a Cabeza: **NO** (Salió `13`).
  * Total coincidencias en tablero: **3 en Top 5** (60%), **3 en Top 10** (30%), **6 en Top 20** (30%).
* **PROVINCIA VESPERTINA:**
  * Predicción sellada Top 5: `['60', '83', '14', '74', '13']`
  * Coincidencias en Top 5: **SÍ** (`60` en posición 09; `14` en posición 17).
  * Acierto a Cabeza: **NO** (Salió `38`).
  * Total coincidencias en tablero: **2 en Top 5** (40%), **2 en Top 10** (20%), **2 en Top 20** (10%).

**Balance del Champion:**
* **Hit Rate de Tablero en Top 5:** **100.0%** (2 de 2 sorteos tuvieron aciertos directos dentro del Top 5).
* **Precisión Promedio en Top 5:** **50.0%** (5 aciertos acumulados sobre 10 recomendaciones de ambos sorteos).

---

## 6. CONTADOR PROSPECTIVO N (AUDITORÍA ESTRICTA)

De acuerdo con el mandato de la auditoría:
* `N` representa **SORTEOS PROSPECTIVOS VÁLIDOS** (no cantidad de predicciones ni modelos).
* Los sorteos evaluados en esta sesión corresponden exactamente a:
  1. `2026-09-04_ciudad_vespertina` (Ordinal 2230)
  2. `2026-09-04_provincia_vespertina` (Ordinal 2231)
* **N acumulado oficial = 2**.
* Las 12 filas evaluadas son las predicciones de los 6 modelos sobre estos **2** sorteos.
* Los 4 sorteos previos (2226 a 2229) permanecen auditados y marcados como `PRE_PHASE5 / NOT_ELIGIBLE` ($N=0$ para esos 4).

---

## 7. AUDITORÍA POST-SORTEO DE FUGA DE INFORMACIÓN (LEAKAGE AUDIT)

Ejecución de `prospective_leakage_audit()` sobre el ledger y dataset actualizados:

```
Temporal Leakage:   PASS
Target Leakage:     PASS
Dataset Leakage:    PASS
Model Leakage:      PASS
Selection Leakage:  PASS
Evaluation Leakage: PASS

Detected Leakage Events = 0
```

---

## 8. ESTADO FINAL CERTIFICADO

```
PROSPECTIVE_TEST_V1 VALID DRAWS = 2
PROSPECTIVE_TEST_V1 N = 2
CHAMPION = ML-FULL v1.0
CHAMPION CHANGED = NO
MODELS MODIFIED = 0
LOCKED PREDICTIONS MODIFIED = 0
LEAKAGE EVENTS = 0
```

> **NOTA METODOLÓGICA:**  
> Con $N=2$ sorteos prospectivos, los resultados se registran únicamente con fines de auditoría continua. No se interpreta este rendimiento como evidencia estadística concluyente. Ningún modelo, peso ni hiperparámetro ha sido modificado.
