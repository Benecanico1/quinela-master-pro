# FASE 5 — CIERRE DEL PRIMER SORTEO PROSPECTIVO (CORREGIDO V1)
## Sorteo Oficial 2026-09-04 — Turno Vespertina (18:00 ART)

**Fecha del Sorteo Oficial:** 2026-09-04  
**Turno:** Vespertina (18:00 ART)  
**Sorteo Oficial LOTBA N°:** 52865  
**Fuente Oficial:** Lotería de la Ciudad de Buenos Aires (LOTBA S.E.) / Instituto Provincial de Lotería y Casinos (IPLyC)  
**Protocolo:** FASE 5 — Prospective Immutable Ledger & Cryptographic Verification  
**Versión de Evaluación:** V1 (Hotfix Estadístico de Precision@K y Cobertura de Pizarra)  
**Estado:** EVALUACIÓN PROSPECTIVA AUDITADA (N = 2 Sorteos Válidos)

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
* **Ambos con repetición en extracto:** `20` (posiciones 15 y 16), `82` (posiciones 3 y 11).

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
* **Ambos con repetición en extracto:** `99` (posiciones 8 y 14).

---

## 2. AUDITORÍA TEMPORAL Y CRIPTOGRÁFICA

Todas las predicciones evaluadas fueron creadas y selladas de forma estricta **antes** de la hora límite oficial:

* **Prediction Created At:** `2026-09-04 19:51:04 UTC` (`16:51:04 ART`)
* **Prediction Locked At:** `2026-09-04 19:51:04 UTC` (`16:51:04 ART`)
* **Prediction Deadline:** `2026-09-04 20:45:00 UTC` (`17:45:00 ART`)
* **Official Result Received At:** `2026-09-04 23:30:00 UTC` (`20:30:00 ART`)
* **Secuencia Temporal:** `Locked (16:51:04) < Deadline (17:45:00) < Extracto Oficial (20:30:00)` -> **PASS**

### Verificación Criptográfica de Hashes Originales

Antes de iniciar la reevaluación estadística, se verificó el SHA-256 canónico de cada registro para garantizar que ni una sola predicción, ranking ni peso fue alterado:

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

**Resultado:** 12 de 12 hashes idénticos (`INTEGRITY_CHECK = 100% PASS`).

---

## 3. TABLA COMPARATIVA DE LOS 6 MODELOS (MÉTRICAS CORREGIDAS)

### Definiciones Estadísticas Rigurosas:
* **Cabeza:** Acierto directo de `Top 1 == Head Ambo` (`1` o `0`).
* **Hit@K:** `1` si al menos un número del `Top K` apareció en el extracto oficial; `0` en caso contrario.
* **Precision@K (Fidelidad de Recomendación):** Número de valores **únicos y distintos** recomendados en el Top $K$ que aparecieron en el extracto, dividido por $K$ ($\text{Precision}@K = \frac{\text{unique\_hits}}{K}$). Cada número recomendado aporta como máximo 1. Máximo posible: 100%.
* **Board Occurrence Hits@K (Apariciones en Tablero):** Total de casilleros de la pizarra cubiertos por los números recomendados en el Top $K$.
* **Board Occurrence Coverage@K (Cobertura de Tablero):** $\frac{\text{BoardOccurrenceHits}@K}{20}$. No se denomina Precision.

### Tabla Oficial Corregida:

| Modelo | Jurisdicción | Cabeza | Hit@5 | Precision@5 | BoardOcc Hits@5 | BoardOcc Cov@5 | Hit@10 | Precision@10 | Hit@20 | Precision@20 | BoardOcc Hits@20 |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ML-FULL (Champion)** | **CIUDAD** | NO | **1** | **40.0%** | **3** | **15.0%** | **1** | **20.0%** | **1** | **25.0%** | **6** |
| **ML-TREND (Challenger)** | **CIUDAD** | NO | 1 | 40.0% | 2 | 10.0% | 1 | 20.0% | 1 | 15.0% | 3 |
| **FREQUENCY-SIMPLE** | **CIUDAD** | NO | 1 | 20.0% | 1 | 5.0% | 1 | 30.0% | 1 | 20.0% | 4 |
| **MARKOV-PURE** | **CIUDAD** | NO | 1 | 20.0% | 2 | 10.0% | 1 | 30.0% | 1 | 20.0% | 5 |
| **HEURISTIC-BASELINE** | **CIUDAD** | NO | 1 | 40.0% | 2 | 10.0% | 1 | 20.0% | 1 | 15.0% | 3 |
| **RANDOM-REFERENCE** | **CIUDAD** | NO | 0 | 0.0% | 0 | 0.0% | 1 | 20.0% | 1 | 25.0% | 6 |
| **ML-FULL (Champion)** | **PROVINCIA** | NO | **1** | **40.0%** | **2** | **10.0%** | **1** | **20.0%** | **1** | **10.0%** | **2** |
| **ML-TREND (Challenger)** | **PROVINCIA** | NO | 0 | 0.0% | 0 | 0.0% | 1 | 10.0% | 1 | 10.0% | 2 |
| **FREQUENCY-SIMPLE** | **PROVINCIA** | NO | 1 | 20.0% | 1 | 5.0% | 1 | 20.0% | 1 | 15.0% | 3 |
| **MARKOV-PURE** | **PROVINCIA** | NO | 1 | 40.0% | 2 | 10.0% | 1 | 30.0% | 1 | 40.0% | 8 |
| **HEURISTIC-BASELINE** | **PROVINCIA** | NO | 0 | 0.0% | 0 | 0.0% | 1 | 10.0% | 1 | 5.0% | 1 |
| **RANDOM-REFERENCE** | **PROVINCIA** | NO | 0 | 0.0% | 0 | 0.0% | 0 | 0.0% | 1 | 20.0% | 4 |

---

## 4. EVALUACIÓN DETALLADA MODELO POR MODELO

Toda asociación de aciertos se calcula **directamente a partir de la predicción sellada inmutable** contra el **extracto oficial**, sin reconstrucción retrospectiva de rankings:

### A. CIUDAD — VESPERTINA

#### 1. ML-FULL — CHAMPION
* **Top 1 Sellado:** `07` | **Cabeza Oficial:** `13` -> Acierto a Cabeza: **NO**
* **Top 5 Sellado:** `['07', '20', '21', '83', '99']`
* **Top 10 Sellado:** `['07', '20', '21', '83', '99', '08', '59', '28', '53', '37']`
* **Top 20 Sellado:** `['07', '20', '21', '83', '99', '08', '59', '28', '53', '37', '79', '00', '03', '01', '65', '19', '57', '60', '89', '72']`
* **Aciertos en Top 5:**
  * Ambo `20` -> Posiciones **15** y **16** *(2 apariciones en extracto)*
  * Ambo `99` -> Posición **19** *(1 aparición en extracto)*
  * **Aciertos Únicos:** $\{20, 99\} \rightarrow 2$ números.
* **Aciertos en Top 10:**
  * Los mismos del Top 5 (`20` y `99`) $\rightarrow 2$ números únicos.
* **Aciertos en Top 20:**
  * Ambo `20` -> Posiciones **15** y **16**
  * Ambo `99` -> Posición **19**
  * Ambo `79` -> Posición **07**
  * Ambo `19` -> Posición **09**
  * Ambo `72` -> Posición **08**
  * **Aciertos Únicos:** $\{20, 99, 79, 19, 72\} \rightarrow 5$ números.
* **Métricas Corregidas:**
  * `Hit@5 = 1` | **`Precision@5 = 40.0%`** (2/5) | `BoardOccHits@5 = 3` | `BoardOccCov@5 = 15.0%` (3/20)
  * `Hit@10 = 1` | **`Precision@10 = 20.0%`** (2/10) | `BoardOccHits@10 = 3` | `BoardOccCov@10 = 15.0%`
  * `Hit@20 = 1` | **`Precision@20 = 25.0%`** (5/20) | `BoardOccHits@20 = 6` | `BoardOccCov@20 = 30.0%`

#### 2. ML-TREND — CHALLENGER
* **Top 1 Sellado:** `46` | **Top 5:** `['46', '25', '31', '06', '44']`
* **Top 10:** `['46', '25', '31', '06', '44', '29', '51', '73', '23', '17']`
* **Top 20:** `['46', '25', '31', '06', '44', '29', '51', '73', '23', '17', '15', '74', '61', '87', '02', '56', '27', '50', '85', '39']`
* **Aciertos en Top 5:** `46` (Pos 13), `44` (Pos 17) $\rightarrow 2$ únicos.
* **Aciertos en Top 10:** `46` (Pos 13), `44` (Pos 17) $\rightarrow 2$ únicos.
* **Aciertos en Top 20:** `46` (Pos 13), `44` (Pos 17), `61` (Pos 06) $\rightarrow 3$ únicos.
* **Métricas Corregidas:**
  * `Hit@5 = 1` | `Precision@5 = 40.0%` | `BoardOccHits@5 = 2` | `BoardOccCov@5 = 10.0%`
  * `Hit@10 = 1` | `Precision@10 = 20.0%` | `BoardOccHits@10 = 2` | `BoardOccCov@10 = 10.0%`
  * `Hit@20 = 1` | `Precision@20 = 15.0%` | `BoardOccHits@20 = 3` | `BoardOccCov@20 = 15.0%`

#### 3. FREQUENCY-SIMPLE
* **Top 1 Sellado:** `99` | **Top 5:** `['99', '03', '83', '75', '37']`
* **Top 10:** `['99', '03', '83', '75', '37', '21', '12', '01', '59', '90']`
* **Top 20:** `['99', '03', '83', '75', '37', '21', '12', '01', '59', '90', '66', '70', '53', '47', '67', '92', '65', '68', '79', '94']`
* **Aciertos en Top 5:** `99` (Pos 19) $\rightarrow 1$ único.
* **Aciertos en Top 10:** `99` (Pos 19), `12` (Pos 02), `90` (Pos 18) $\rightarrow 3$ únicos.
* **Aciertos en Top 20:** `99` (Pos 19), `12` (Pos 02), `90` (Pos 18), `79` (Pos 07) $\rightarrow 4$ únicos.
* **Métricas Corregidas:**
  * `Hit@5 = 1` | `Precision@5 = 20.0%` | `BoardOccHits@5 = 1` | `BoardOccCov@5 = 5.0%`
  * `Hit@10 = 1` | `Precision@10 = 30.0%` | `BoardOccHits@10 = 3` | `BoardOccCov@10 = 15.0%`
  * `Hit@20 = 1` | `Precision@20 = 20.0%` | `BoardOccHits@20 = 4` | `BoardOccCov@20 = 20.0%`

#### 4. MARKOV-PURE
* **Top 1 Sellado:** `85` | **Top 5:** `['85', '82', '92', '95', '75']`
* **Top 10:** `['85', '82', '92', '95', '75', '65', '72', '22', '05', '02']`
* **Top 20:** `['85', '82', '92', '95', '75', '65', '72', '22', '05', '02', '12', '15', '25', '42', '35', '32', '45', '52', '55', '62']`
* **Aciertos en Top 5:** `82` (Pos 03 y Pos 11) $\rightarrow$ **1 único predicho** (2 impactos en pizarra).
* **Aciertos en Top 10:** `82` (Pos 03 y 11), `72` (Pos 08), `05` (Pos 14) $\rightarrow$ **3 únicos predichos** (4 impactos).
* **Aciertos en Top 20:** `82` (Pos 03 y 11), `72` (Pos 08), `05` (Pos 14), `12` (Pos 02) $\rightarrow$ **4 únicos predichos** (5 impactos).
* **Métricas Corregidas:**
  * `Hit@5 = 1` | **`Precision@5 = 20.0%`** (1/5) | `BoardOccHits@5 = 2` | `BoardOccCov@5 = 10.0%`
  * `Hit@10 = 1` | **`Precision@10 = 30.0%`** (3/10) | `BoardOccHits@10 = 4` | `BoardOccCov@10 = 20.0%`
  * `Hit@20 = 1` | **`Precision@20 = 20.0%`** (4/20) | `BoardOccHits@20 = 5` | `BoardOccCov@20 = 25.0%`

#### 5. HEURISTIC-BASELINE
* **Top 1 Sellado:** `25` | **Top 5:** `['25', '46', '06', '44', '29']`
* **Top 10:** `['25', '46', '06', '44', '29', '51', '73', '23', '50', '17']`
* **Top 20:** `['25', '46', '06', '44', '29', '51', '73', '23', '50', '17', '15', '74', '85', '39', '81', '31', '41', '05', '14', '02']`
* **Aciertos en Top 5:** `46` (Pos 13), `44` (Pos 17) $\rightarrow 2$ únicos.
* **Aciertos en Top 10:** `46` (Pos 13), `44` (Pos 17) $\rightarrow 2$ únicos.
* **Aciertos en Top 20:** `46` (Pos 13), `44` (Pos 17), `05` (Pos 14) $\rightarrow 3$ únicos.
* **Métricas Corregidas:**
  * `Hit@5 = 1` | `Precision@5 = 40.0%` | `BoardOccHits@5 = 2` | `BoardOccCov@5 = 10.0%`
  * `Hit@10 = 1` | `Precision@10 = 20.0%` | `BoardOccHits@10 = 2` | `BoardOccCov@10 = 10.0%`
  * `Hit@20 = 1` | `Precision@20 = 15.0%` | `BoardOccHits@20 = 3` | `BoardOccCov@20 = 15.0%`

#### 6. RANDOM-REFERENCE
* **Top 1 Sellado:** `57` | **Top 5:** `['57', '26', '66', '92', '02']`
* **Top 10:** `['57', '26', '66', '92', '02', '18', '49', '07', '00', '04']`
* **Top 20:** `['57', '26', '66', '92', '02', '18', '49', '07', '00', '04', '67', '98', '16', '38', '29', '82', '19', '60', '39', '46']`
* **Aciertos en Top 5:** Ninguno $\rightarrow 0$ únicos.
* **Aciertos en Top 10:** `49` (Pos 10), `04` (Pos 20) $\rightarrow 2$ únicos.
* **Aciertos en Top 20:** `49` (Pos 10), `04` (Pos 20), `82` (Pos 03 y 11), `19` (Pos 09), `46` (Pos 13) $\rightarrow$ **5 únicos predichos** (6 impactos).
* **Métricas Corregidas:**
  * `Hit@5 = 0` | `Precision@5 = 0.0%` | `BoardOccHits@5 = 0` | `BoardOccCov@5 = 0.0%`
  * `Hit@10 = 1` | `Precision@10 = 20.0%` | `BoardOccHits@10 = 2` | `BoardOccCov@10 = 10.0%`
  * `Hit@20 = 1` | **`Precision@20 = 25.0%`** (5/20) | `BoardOccHits@20 = 6` | `BoardOccCov@20 = 30.0%`

---

### B. PROVINCIA — VESPERTINA

#### 1. ML-FULL — CHAMPION
* **Top 1 Sellado:** `60` | **Cabeza Oficial:** `38` -> Acierto a Cabeza: **NO**
* **Top 5 Sellado:** `['60', '83', '14', '74', '13']`
* **Top 10 Sellado:** `['60', '83', '14', '74', '13', '44', '47', '27', '31', '81']`
* **Top 20 Sellado:** `['60', '83', '14', '74', '13', '44', '47', '27', '31', '81', '43', '37', '26', '93', '49', '00', '57', '02', '71', '69']`
* **Aciertos en Top 5:**
  * Ambo `60` -> Posición **09**
  * Ambo `14` -> Posición **17**
  * **Aciertos Únicos:** $\{60, 14\} \rightarrow 2$ números.
* **Aciertos en Top 10:** Los mismos del Top 5 (`60` y `14`) $\rightarrow 2$ únicos.
* **Aciertos en Top 20:** Los mismos del Top 5 (`60` y `14`) $\rightarrow 2$ únicos.
* **Métricas Corregidas:**
  * `Hit@5 = 1` | **`Precision@5 = 40.0%`** (2/5) | `BoardOccHits@5 = 2` | `BoardOccCov@5 = 10.0%`
  * `Hit@10 = 1` | **`Precision@10 = 20.0%`** (2/10) | `BoardOccHits@10 = 2` | `BoardOccCov@10 = 10.0%`
  * `Hit@20 = 1` | **`Precision@20 = 10.0%`** (2/20) | `BoardOccHits@20 = 2` | `BoardOccCov@20 = 10.0%`

#### 2. ML-TREND — CHALLENGER
* **Top 1 Sellado:** `72` | **Top 5:** `['72', '05', '43', '55', '31']`
* **Top 10:** `['72', '05', '43', '55', '31', '94', '58', '40', '90', '93']`
* **Top 20:** `['72', '05', '43', '55', '31', '94', '58', '40', '90', '93', '95', '62', '70', '23', '79', '46', '29', '69', '18', '53']`
* **Aciertos en Top 5:** Ninguno $\rightarrow 0$ únicos.
* **Aciertos en Top 10:** `94` (Pos 07) $\rightarrow 1$ único.
* **Aciertos en Top 20:** `94` (Pos 07), `46` (Pos 20) $\rightarrow 2$ únicos.
* **Métricas Corregidas:**
  * `Hit@5 = 0` | `Precision@5 = 0.0%` | `BoardOccHits@5 = 0` | `BoardOccCov@5 = 0.0%`
  * `Hit@10 = 1` | `Precision@10 = 10.0%` | `BoardOccHits@10 = 1` | `BoardOccCov@10 = 5.0%`
  * `Hit@20 = 1` | `Precision@20 = 10.0%` | `BoardOccHits@20 = 2` | `BoardOccCov@20 = 10.0%`

#### 3. FREQUENCY-SIMPLE
* **Top 1 Sellado:** `60` | **Top 5:** `['60', '10', '15', '74', '63']`
* **Top 10:** `['60', '10', '15', '74', '63', '14', '20', '09', '81', '76']`
* **Top 20:** `['60', '10', '15', '74', '63', '14', '20', '09', '81', '76', '32', '37', '56', '89', '52', '49', '59', '26', '01', '02']`
* **Aciertos en Top 5:** `60` (Pos 09) $\rightarrow 1$ único.
* **Aciertos en Top 10:** `60` (Pos 09), `14` (Pos 17) $\rightarrow 2$ únicos.
* **Aciertos en Top 20:** `60` (Pos 09), `14` (Pos 17), `89` (Pos 16) $\rightarrow 3$ únicos.
* **Métricas Corregidas:**
  * `Hit@5 = 1` | `Precision@5 = 20.0%` | `BoardOccHits@5 = 1` | `BoardOccCov@5 = 5.0%`
  * `Hit@10 = 1` | `Precision@10 = 20.0%` | `BoardOccHits@10 = 2` | `BoardOccCov@10 = 10.0%`
  * `Hit@20 = 1` | `Precision@20 = 15.0%` | `BoardOccHits@20 = 3` | `BoardOccCov@20 = 15.0%`

#### 4. MARKOV-PURE
* **Top 1 Sellado:** `74` | **Top 5:** `['74', '64', '84', '94', '24']`
* **Top 10:** `['74', '64', '84', '94', '24', '34', '04', '14', '44', '54']`
* **Top 20:** `['74', '64', '84', '94', '24', '34', '04', '14', '44', '54', '78', '68', '58', '48', '88', '98', '18', '08', '38', '28']`
* **Aciertos en Top 5:** `94` (Pos 07), `24` (Pos 11) $\rightarrow 2$ únicos.
* **Aciertos en Top 10:** `94` (Pos 07), `24` (Pos 11), `14` (Pos 17) $\rightarrow 3$ únicos.
* **Aciertos en Top 20:** `94` (Pos 07), `24` (Pos 11), `14` (Pos 17), `78` (Pos 03), `68` (Pos 10), `08` (Pos 05), `38` (Pos 01 — Cabeza), `28` (Pos 19) $\rightarrow 8$ únicos.
* **Métricas Corregidas:**
  * `Hit@5 = 1` | `Precision@5 = 40.0%` | `BoardOccHits@5 = 2` | `BoardOccCov@5 = 10.0%`
  * `Hit@10 = 1` | `Precision@10 = 30.0%` | `BoardOccHits@10 = 3` | `BoardOccCov@10 = 15.0%`
  * `Hit@20 = 1` | `Precision@20 = 40.0%` | `BoardOccHits@20 = 8` | `BoardOccCov@20 = 40.0%`

#### 5. HEURISTIC-BASELINE
* **Top 1 Sellado:** `43` | **Top 5:** `['43', '31', '55', '58', '40']`
* **Top 10:** `['43', '31', '55', '58', '40', '94', '93', '90', '95', '69']`
* **Top 20:** `['43', '31', '55', '58', '40', '94', '93', '90', '95', '69', '70', '22', '79', '29', '23', '87', '62', '72', '18', '64']`
* **Aciertos en Top 5:** Ninguno $\rightarrow 0$ únicos.
* **Aciertos en Top 10:** `94` (Pos 07) $\rightarrow 1$ único.
* **Aciertos en Top 20:** `94` (Pos 07) $\rightarrow 1$ único.
* **Métricas Corregidas:**
  * `Hit@5 = 0` | `Precision@5 = 0.0%` | `BoardOccHits@5 = 0` | `BoardOccCov@5 = 0.0%`
  * `Hit@10 = 1` | `Precision@10 = 10.0%` | `BoardOccHits@10 = 1` | `BoardOccCov@10 = 5.0%`
  * `Hit@20 = 1` | `Precision@20 = 5.0%` | `BoardOccHits@20 = 1` | `BoardOccCov@20 = 5.0%`

#### 6. RANDOM-REFERENCE
* **Top 1 Sellado:** `92` | **Top 5:** `['92', '66', '61', '49', '65']`
* **Top 10:** `['92', '66', '61', '49', '65', '02', '81', '36', '10', '30']`
* **Top 20:** `['92', '66', '61', '49', '65', '02', '81', '36', '10', '30', '34', '50', '08', '24', '06', '90', '74', '14', '29', '03']`
* **Aciertos en Top 5:** Ninguno $\rightarrow 0$ únicos.
* **Aciertos en Top 10:** Ninguno $\rightarrow 0$ únicos.
* **Aciertos en Top 20:** `50` (Pos 12), `08` (Pos 05), `24` (Pos 11), `14` (Pos 17) $\rightarrow 4$ únicos.
* **Métricas Corregidas:**
  * `Hit@5 = 0` | `Precision@5 = 0.0%` | `BoardOccHits@5 = 0` | `BoardOccCov@5 = 0.0%`
  * `Hit@10 = 0` | `Precision@10 = 0.0%` | `BoardOccHits@10 = 0` | `BoardOccCov@10 = 0.0%`
  * `Hit@20 = 1` | `Precision@20 = 20.0%` | `BoardOccHits@20 = 4` | `BoardOccCov@20 = 20.0%`

---

## 5. FOCO EN EL CHAMPION: ML-FULL v1.0 (ANÁLISIS CORREGIDO)

* **CIUDAD VESPERTINA:**
  * Aciertos Únicos en Top 5: **2** (`20` y `99`).
  * Posiciones cubiertas en tablero: **3** (`20` en 15 y 16; `99` en 19).
  * **Precision@5 Corregida:** **40.0%** (2 / 5).
  * **Board Occurrence Coverage@5:** **15.0%** (3 / 20).
* **PROVINCIA VESPERTINA:**
  * Aciertos Únicos en Top 5: **2** (`60` y `14`).
  * Posiciones cubiertas en tablero: **2** (`60` en 09; `14` en 17).
  * **Precision@5 Corregida:** **40.0%** (2 / 5).
  * **Board Occurrence Coverage@5:** **10.0%** (2 / 20).

**Balance Global del Champion en el Sorteo Vespertina:**
* **Hit Rate de Tablero en Top 5:** **100.0%** (2 de 2 sorteos tuvieron aciertos en Top 5).
* **Precisión Promedio en Top 5:** **40.0%** (4 recomendaciones únicas acertadas sobre 10 picks acumulados de ambos sorteos).

---

## 6. CONTADOR PROSPECTIVO N (AUDITORÍA ESTRICTA)

* **Sorteos previos al protocolo oficial (Fase 5 deploy):** 4 sorteos (`2226` a `2229`) registrados como `PRE_PHASE5 / NOT_ELIGIBLE`.
* **Sorteos evaluados bajo Fase 5 oficial:** 2 sorteos (`2230` Ciudad y `2231` Provincia).
* **Total prospectivo formal verificado:**
  $$\mathbf{N = 2}$$
* **Umbral estadístico:** Mantenido estrictamente en $N \ge 25$ para inferencias comparativas formales.

---

## 7. AUDITORÍA DE DATA LEAKAGE POST-EVALUACIÓN

Ejecutada la suite `ProspectiveValidationEngine.prospective_leakage_audit()` sobre la totalidad del ledger tras la evaluación:

```text
Temporal Leakage:   PASS (Todas las predicciones selladas antes del deadline)
Target Leakage:     PASS (Features extraídas sin conocer el resultado del sorteo)
Dataset Leakage:    PASS (Dataset congelado consistente con hashes oficiales)
Model Leakage:      PASS (No hubo re-entrenamiento ni ajuste de hiperparámetros)
Selection Leakage:  PASS (El Champion se mantuvo predefinido sin data snooping)
Evaluation Leakage: PASS (Evaluación ejecutada exclusivamente sobre predicciones selladas)
-------------------------------------------------------------------------------------
Validation Status:  PASS (0 eventos de fuga detectados)
```

---

## 8. CERTIFICACIÓN DE CIERRE CORREGIDO V1

* **Reporte Histórico Previo:** Preservado íntegramente como evidencia histórica en `PHASE5_PROSPECTIVE_CLOSURE_2026-09-04_VESPERTINA.md`.
* **Reporte Oficial Corregido:** Emitido bajo `PHASE5_PROSPECTIVE_CLOSURE_2026-09-04_VESPERTINA_CORRECTED_V1.md`.
* **Inmutabilidad Garantizada:** Hashes de predicciones, modelos, rankings y dataset histórico verificados al 100% de coincidencia.
