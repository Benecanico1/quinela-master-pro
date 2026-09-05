# EVALUATION ENGINE CORRECTION REPORT (V1)

**Fecha:** 2026-09-04  
**Hora:** 20:45 ART  
**Módulo Auditado:** `backend/ml_pipeline/prospective_validation_engine.py`  
**Protocolo:** FASE 5 — Prospective Validation Engine Hotfix  
**Estado:** HOTFIX APLICADO Y VERIFICADO (Tests: 8/8 PASS | Hashes: 12/12 PASS)

---

## 1. ERROR DETECTADO

En la evaluación del primer sorteo prospectivo oficial de Fase 5 (**Vespertina 2026-09-04**, Sorteo LOTBA 52865), el motor de evaluación computó múltiples apariciones en el tablero de 20 números oficiales de un mismo Ambo predicho como múltiples aciertos de una única recomendación, atribuyendo erróneamente dicho valor a la métrica `Precision@K`.

### Ejemplo Concreto:
En **CIUDAD VESPERTINA**:
* El modelo Champion `ML-FULL` tenía sellado en su Top 5: `['07', '20', '21', '83', '99']`.
* En el extracto oficial de 20 premios:
  * El Ambo `20` apareció en la posición **15** (`9420`) y en la posición **16** (`8420`) (2 apariciones).
  * El Ambo `99` apareció en la posición **19** (`8799`) (1 aparición).
* **Fallo:** El reporte previo contabilizó $2 + 1 = 3$ impactos en pizarra, calculando $\frac{3}{5} = 60.0\%$ y denominándolo `Precision@5`.
* **Corrección:** Los aciertos únicos predichos fueron $\{20, 99\}$ (2 números distintos). Por estándar matemático en Information Retrieval y Sistemas de Recomendación, $\text{Precision}@5 = \frac{2}{5} = 40.0\%$. Una recomendación individual no puede sumar más de 1 al numerador de Precision.

---

## 2. CAUSA TÉCNICA

En el script de generación de reporte y cierre prospectivo original, el cálculo de precisión se había derivado como:
```python
# CÓDIGO ANTERIOR (ERRÓNEO):
total_board_occurrences_5 = sum(len(h["positions"]) for h in hits_5_details)
prec_5 = total_board_occurrences_5 / 5.0
```
Esta formulación medía la cobertura de posiciones de la pizarra dividida por $K$, lo cual desvirtúa el significado formal de `Precision@K` (que mide la proporción de elementos recomendados en Top $K$ que son relevantes / aciertos únicos) y permitía teóricamente precisiones mayores a 100% si varios números repetían posición en la pizarra.

---

## 3. DEFINICIONES ESTADÍSTICAS OBLIGATORIAS (CORREGIDAS)

A partir de este Hotfix V1, el motor `ProspectiveValidationEngine` desacopla formalmente la fidelidad de la recomendación de la multiplicidad de apariciones en la pizarra:

### A. `Precision@K` (Fidelidad de Recomendación)
Número de valores **diferentes** dentro del Top $K$ que aparecen al menos una vez en el extracto oficial de 20 posiciones, dividido por $K$:
$$\text{Precision}@K = \frac{|\text{Top}_K \cap \text{Extracto}_M|}{K} = \frac{\text{unique\_matching\_predictions}}{K}$$
* **Restricción matemática:** Cada número pronosticado aporta como máximo $1$ al numerador.
* **Cota:** $0.0 \le \text{Precision}@K \le 1.0$ ($0\% \le \text{Precision}@K \le 100\%$).

### B. `Hit Rate@K` (Presencia Binaria)
Variable indicadora binaria:
$$\text{Hit Rate}@K = \begin{cases} 1 & \text{si } \text{unique\_matching\_predictions} > 0 \\ 0 & \text{en caso contrario} \end{cases}$$

### C. `BoardOccurrenceHits@K` (Apariciones Totales en Pizarra)
Métrica separada que contabiliza el total de casilleros de la pizarra cubiertos por el conjunto de números del Top $K$:
$$\text{BoardOccurrenceHits}@K = \sum_{p=1}^{20} \mathbb{I}(\text{Extracto}[p] \in \text{Top}_K)$$

### D. `BoardOccurrenceCoverage@K` (Cobertura de Pizarra)
Fracción del total de las 20 posiciones del tablero cubiertas por las recomendaciones:
$$\text{BoardOccurrenceCoverage}@K = \frac{\text{BoardOccurrenceHits}@K}{20}$$
*(Bajo ninguna circunstancia se denomina a esta métrica Precision).*

---

## 4. REGISTROS AFECTADOS Y REEVALUACIÓN

De los 12 registros prospectivos sellados para el turno Vespertina del 2026-09-04, 3 registros se vieron distorsionados por la presencia de números repetidos en el extracto oficial de Ciudad (`20` en posiciones 15 y 16; `82` en posiciones 3 y 11):

| Predicción ID | Modelo | Jurisdicción | Métrica | Valor Anterior | Valor Corregido | Variación | Causa de Discrepancia |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `PRED_..._CIUDAD_..._ML-FULL` | ML-FULL | CIUDAD | **Prec@5** | 60.0% | **40.0%** | -20.0% | Ambo `20` repetido (pos 15 y 16) aportaba 2 |
| `PRED_..._CIUDAD_..._ML-FULL` | ML-FULL | CIUDAD | **Prec@10** | 30.0% | **20.0%** | -10.0% | Ambo `20` repetido aportaba 2 en Top 10 |
| `PRED_..._CIUDAD_..._ML-FULL` | ML-FULL | CIUDAD | **Prec@20** | 30.0% | **25.0%** | -5.0% | Ambo `20` repetido sumaba 6 en vez de 5 únicos |
| `PRED_..._CIUDAD_..._MARKOV-PURE` | MARKOV | CIUDAD | **Prec@5** | 40.0% | **20.0%** | -20.0% | Ambo `82` repetido (pos 3 y 11) aportaba 2 |
| `PRED_..._CIUDAD_..._MARKOV-PURE` | MARKOV | CIUDAD | **Prec@10** | 40.0% | **30.0%** | -10.0% | Ambo `82` repetido aportaba 2 en Top 10 |
| `PRED_..._CIUDAD_..._MARKOV-PURE` | MARKOV | CIUDAD | **Prec@20** | 25.0% | **20.0%** | -5.0% | Ambo `82` repetido sumaba 5 en vez de 4 únicos |
| `PRED_..._CIUDAD_..._RANDOM-REF` | RANDOM | CIUDAD | **Prec@20** | 30.0% | **25.0%** | -5.0% | Ambo `82` repetido en Top 20 sumaba 6 en vez de 5 únicos |

Los 9 registros restantes tenían coincidencia $1:1$ entre aciertos únicos y apariciones en el tablero, por lo que su `Precision@K` no sufrió variaciones numéricas y se enriqueció con las métricas explícitas `BoardOccurrenceHits` y `BoardOccurrenceCoverage`.

---

## 5. TABLA COMPARATIVA GLOBAL ANTES / DESPUÉS

### CIUDAD VESPERTINA (Extracto con `20` x2 y `82` x2)
| Modelo | Prec@5 (Antes) | Prec@5 (Corregida) | BoardOccHits@5 | BoardOccCov@5 | Prec@10 (Antes) | Prec@10 (Corregida) | Prec@20 (Antes) | Prec@20 (Corregida) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ML-FULL (Champion)** | 60.0% | **40.0%** | 3 | 15.0% | 30.0% | **20.0%** | 30.0% | **25.0%** |
| **ML-TREND (Challenger)** | 40.0% | **40.0%** | 2 | 10.0% | 20.0% | **20.0%** | 15.0% | **15.0%** |
| **FREQUENCY-SIMPLE** | 20.0% | **20.0%** | 1 | 5.0% | 30.0% | **30.0%** | 20.0% | **20.0%** |
| **MARKOV-PURE** | 40.0% | **20.0%** | 2 | 10.0% | 40.0% | **30.0%** | 25.0% | **20.0%** |
| **HEURISTIC-BASELINE** | 40.0% | **40.0%** | 2 | 10.0% | 20.0% | **20.0%** | 15.0% | **15.0%** |
| **RANDOM-REFERENCE** | 0.0% | **0.0%** | 0 | 0.0% | 20.0% | **20.0%** | 30.0% | **25.0%** |

### PROVINCIA VESPERTINA (Extracto con `99` x2)
*(Ningún modelo predijo el Ambo `99` en Provincia, por lo que no hubo repeticiones predichas en tablero)*
| Modelo | Prec@5 (Antes) | Prec@5 (Corregida) | BoardOccHits@5 | BoardOccCov@5 | Prec@10 (Antes) | Prec@10 (Corregida) | Prec@20 (Antes) | Prec@20 (Corregida) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ML-FULL (Champion)** | 40.0% | **40.0%** | 2 | 10.0% | 20.0% | **20.0%** | 10.0% | **10.0%** |
| **ML-TREND (Challenger)** | 0.0% | **0.0%** | 0 | 0.0% | 10.0% | **10.0%** | 10.0% | **10.0%** |
| **FREQUENCY-SIMPLE** | 20.0% | **20.0%** | 1 | 5.0% | 20.0% | **20.0%** | 15.0% | **15.0%** |
| **MARKOV-PURE** | 40.0% | **40.0%** | 2 | 10.0% | 30.0% | **30.0%** | 40.0% | **40.0%** |
| **HEURISTIC-BASELINE** | 0.0% | **0.0%** | 0 | 0.0% | 10.0% | **10.0%** | 5.0% | **5.0%** |
| **RANDOM-REFERENCE** | 0.0% | **0.0%** | 0 | 0.0% | 0.0% | **0.0%** | 20.0% | **20.0%** |

---

## 6. SUITE DE TESTS ESPECÍFICOS EJECUTADOS

Se implementó el archivo de pruebas unitarias `backend/ml_pipeline/test_evaluation_engine_correction.py` cubriendo los 8 casos de borde solicitados:

```text
test_1_ambo_repeated_twice_on_board:                           PASS
test_2_ambo_repeated_three_times_on_board:                     PASS
test_3_two_distinct_predictions_hit:                           PASS
test_4_zero_matches:                                           PASS
test_5_matches_across_top5_top10_top20:                        PASS
test_6_precision_strictly_bounded_by_100_percent:              PASS
test_7_every_recommended_number_contributes_at_most_one:      PASS
test_8_board_occurrence_coverage_correctly_counts_repetitions: PASS
----------------------------------------------------------------------
Ran 8 tests in 0.009s — OK (100% PASS)
```

---

## 7. CERTIFICACIÓN DE INMUTABILIDAD CRIPTOGRÁFICA

Se certifica formalmente que:
1. **Ningún modelo, peso, feature o hiperparámetro fue modificado.**
2. **Ninguna predicción sellada fue regenerada ni alterada.**
3. **Los 12 hashes criptográficos SHA-256 de las predicciones bloqueadas son idénticos a los sellados a las 16:51:04 ART del 2026-09-04:**

| Predicción ID | Modelo | Hash SHA-256 Verificado | Estado |
| :--- | :--- | :--- | :---: |
| `PRED_2026-09-04_CIUDAD_VESPERTINA_ML-FULL` | ML-FULL | `002b41c89e3885eca3cdf26763a0486073deeeda9a44929f7ce140a72c306f82` | **MATCH PASS** |
| `PRED_2026-09-04_CIUDAD_VESPERTINA_ML-TREND` | ML-TREND | `2032abf8cdbb8e9381047f2cd29bd7c600517663d85d316b8482fc2213889416` | **MATCH PASS** |
| `PRED_2026-09-04_CIUDAD_VESPERTINA_FREQUENCY-SIMPLE` | FREQ-SIMPLE | `fc559978df239987d9e50de6660a8e90fdf2b99947fa6c8a40903de264e75f08` | **MATCH PASS** |
| `PRED_2026-09-04_CIUDAD_VESPERTINA_MARKOV-PURE` | MARKOV-PURE | `9f981cd8e5cb6bfa08bddedd77ff2b69e449e07d9eed50435a35f989e1aa6543` | **MATCH PASS** |
| `PRED_2026-09-04_CIUDAD_VESPERTINA_HEURISTIC-BASELINE` | HEURISTIC | `b3233402ae4b62ac67762d5b7d37e06def6746c70506b1b95e48560f61c9abef` | **MATCH PASS** |
| `PRED_2026-09-04_CIUDAD_VESPERTINA_RANDOM-REFERENCE` | RANDOM | `428f8525318aa5eb3c5eeda3cd192ffcd501ad83d31b6381ee3f65b54271cc80` | **MATCH PASS** |
| `PRED_2026-09-04_PROVINCIA_VESPERTINA_ML-FULL` | ML-FULL | `418fdba53db52a069655d2952907540479ccb6a3e6975f52cd31c560fc9fd6bc` | **MATCH PASS** |
| `PRED_2026-09-04_PROVINCIA_VESPERTINA_ML-TREND` | ML-TREND | `e4d569cb867b0a7403eaa94c77db96d8d31cdf3095607d85de8f7fbbb0c17aec` | **MATCH PASS** |
| `PRED_2026-09-04_PROVINCIA_VESPERTINA_FREQUENCY-SIMPLE` | FREQ-SIMPLE | `7f6a9b5d721f1c27925fc2a380d0450e8ad09ae7992a3bb6a507c2256c1c4712` | **MATCH PASS** |
| `PRED_2026-09-04_PROVINCIA_VESPERTINA_MARKOV-PURE` | MARKOV-PURE | `ce98ab0ff53489b92856fe338289b41ef1349f83e216ea9c1b08ea980d086cba` | **MATCH PASS** |
| `PRED_2026-09-04_PROVINCIA_VESPERTINA_HEURISTIC-BASELINE` | HEURISTIC | `2a55572917926bc825ad2a6ee89b6936e154fa3e8f5512d24d5859f19725eafb` | **MATCH PASS** |
| `PRED_2026-09-04_PROVINCIA_VESPERTINA_RANDOM-REFERENCE` | RANDOM | `0acf566c7fc40aa85c705f1079bcdbe201cedcde34c296bc4017c50adc4098d9` | **MATCH PASS** |

4. **El contador prospectivo se mantiene en $N = 2$ sorteos válidos.**
5. **El dataset histórico permanece estrictamente inmutable.**
