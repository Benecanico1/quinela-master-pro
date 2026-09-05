# INFORME TÉCNICO DE MACHINE LEARNING Y BACKTESTING — QUINIELA MASTER PRO
**Fecha de Generación:** 1788493159.023734 (Ejecución oficial)  
**Versión del Modelo:** Ensemble ML v1.0 (Logistic Regression L2 + Markov Feature Engine)  
**Metodología de Validación:** Walk-Forward Out-of-Sample Backtesting (Cero Data Leakage)  
**Muestra Evaluada:** 400 sorteos oficiales (2026-07-19 al 2026-09-03)  

---

## 1. Resumen Ejecutivo de Métricas Fuera de Muestra

| Métrica de Evaluación | Sistema B (Machine Learning) | Sistema A (Baseline Estadístico) | Sistema C (Azar Monte Carlo) |
| :--- | :---: | :---: | :---: |
| **Aciertos a la Cabeza (1°)** | **6** (1.5%) | **1** (0.25%) | **8** (2.0%) |
| **Intervalo de Confianza (95%)** | [0.31%, 2.69%] | [0.00%, 0.74%] | [0.63%, 3.37%] |
| **Acierto en Pizarra (Top 20)** | **297** (74.25%) | **245** (61.25%) | **250** (62.5%) |
| **Acierto a los 10 Premios** | **194** (48.5%) | **152** (38.0%) | **164** (41.0%) |
| **Acierto a los 5 Premios** | **105** (26.25%) | **71** (17.75%) | **94** (23.5%) |
| **Precision@5 (Ambos en Pizarra)** | 0.1485 | 0.1225 | 0.125 |

---

## 2. Test de Significancia Estadística

- **Valor $p$ (Test Binomial vs. Azar Puro en Cabeza):** `2.1408e-01`
- **¿Es estadísticamente significativo ($p < 0.05$)?** `NO`
- **Diagnóstico Transparente:**  
  > *"El modelo NO demuestra una ventaja estadísticamente significativa sobre el azar (p >= 0.05)."*

---

## 3. Desglose de Rendimiento por Lotería y Turno

### Por Lotería Oficial:
- **Ciudad (Nacional):**
  - Evaluados: 208 sorteos
  - Aciertos Cabeza: ML 2 | Baseline 1 | Azar 5
  - Aciertos Pizarra: ML 143 | Baseline 134 | Azar 126
- **Provincia de Buenos Aires:**
  - Evaluados: 192 sorteos
  - Aciertos Cabeza: ML 4 | Baseline 0 | Azar 3
  - Aciertos Pizarra: ML 154 | Baseline 111 | Azar 124

---

## 4. Importancia de Características (Feature Importance)

Los coeficientes aprendidos por el modelo de Regresión Logística L2 revelan la contribución relativa de cada variable en el ranking predictivo:

| Ranking | Característica | Coeficiente Ponderado | Interpretación Técnica |
| :---: | :--- | :---: | :--- |
| #1 | `delay_max` | `-0.0888` | Penalización estadística |
| #2 | `delay_avg` | `+0.0836` | Impacto positivo en score |
| #3 | `pos_head_freq` | `-0.0629` | Penalización estadística |
| #4 | `pos_top20_freq` | `-0.0599` | Penalización estadística |
| #5 | `pos_top5_freq` | `+0.0562` | Impacto positivo en score |
| #6 | `freq_5` | `+0.0533` | Impacto positivo en score |
| #7 | `delay_std` | `+0.0483` | Impacto positivo en score |
| #8 | `shift_freq` | `+0.0395` | Impacto positivo en score |
| #9 | `weekday_freq` | `+0.0320` | Impacto positivo en score |
| #10 | `freq_20` | `+0.0276` | Impacto positivo en score |

---

## 5. Limitaciones Teóricas y Declaración de Rigor Científico

1. **Independencia de Sorteos:** Los extractos oficiales de Quiniela se generan mediante bolilleros electromecánicos certificados. Cada sorteo es un proceso estocástico con independencia teórica entre eventos.
2. **Naturaleza del Modelo:** El modelo de Machine Learning captura correlaciones y anomalías empíricas en la muestra histórica observada; no altera las leyes de la probabilidad ni garantiza aciertos en eventos futuros.
3. **Compromiso con el Usuario:** Ninguna predicción es un "número seguro". Los resultados se presentan bajo la escala *"Score predictivo: X/100"* y con estricta advertencia de Juego Responsable (+18).
