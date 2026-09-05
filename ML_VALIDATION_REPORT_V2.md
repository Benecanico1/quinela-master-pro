# INFORME CIENTÍFICO DE VALIDACIÓN RETROSPECTIVA Y PRUEBA CIEGA
## ML_VALIDATION_REPORT_V2 — QUINIELA MASTER PRO
**Fecha de Publicación:** 2026-09-04  
**Equipo Responsable:** Auditoría de Inteligencia Artificial & Ingeniería JH  
**Versión Evaluada:** `Logistic Regression + Markov Features v1.0` (Modelo Principal)  
**Conjunto Congelado:** `HISTORICAL_TEST_V1` (400 sorteos oficiales sellados)  
**Protocolo de Prueba Ciega:** `LIVE_OUT_OF_SAMPLE_TEST_V2`  

---

### 1. Cantidad de Sorteos
- **Total Histórico Curado:** 2.225 sorteos oficiales auditados (del 2026-01-01 al 2026-09-03).
- **Muestra de Entrenamiento Inicial:** 1.825 sorteos oficiales (sorteos #1 al #1825).
- **Muestra de Evaluación Fuera de Muestra (Out-of-Sample):** 400 sorteos consecutivos oficiales (sorteos #1826 al #2225).
- **Estado del Conjunto de Prueba:** Sellado e inmutable (`HISTORICAL_TEST_V1`). Prohibido su reentrenamiento o utilización para ajuste de hiperparámetros.

---

### 2. Período Evaluado
- **Inicio de la Evaluación Out-of-Sample:** 2026-07-19 (Turno Matutina).
- **Fin de la Evaluación Out-of-Sample:** 2026-09-03 (Turno Nocturna).
- **Cobertura de Loterías:** Lotería de la Ciudad (Nacional) y Lotería de la Provincia de Buenos Aires.
- **Turnos Evaluados:** La Previa, Primera, Matutina, Vespertina y Nocturna.

---

### 3. Modelos Utilizados y Evaluados en Simultáneo
Para garantizar un contraste metodológico sin sesgos, se evaluaron **cuatro sistemas independientes** sobre exactamente los mismos 400 sorteos:
1. **Sistema B — Modelo Principal (`Logistic Regression + Markov Features v1.0`):**
   - Regresión Logística L2 regularizada ($C = 0.1$, `class_weight='balanced'`).
   - Normalización de variables mediante `StandardScaler` ajustado únicamente sobre datos causales previos.
   - Función sigmoide para estimar la propensión empírica a la presencia en pizarra de 20 premios.
2. **Sistema A — Baseline Estadístico Descriptivo:**
   - Modelo heurístico ponderado basado en frecuencias acumuladas ($40\%$), ciclos de atraso observados ($30\%$), densidad en pizarra ($15\%$) y frecuencia de transición condicional ($15\%$).
3. **Sistema C — Markov Independiente Puro:**
   - Modelo estocástico de primer orden con matrices empíricas de transición de dígitos: unidades $P(u_t \mid u_{t-1})$ y decenas $P(d_t \mid d_{t-1})$ con suavizado de Laplace ($+1$). Probabilidad conjunta $P(du) = P(d) \cdot P(u)$.
4. **Sistema D — Azar Monte Carlo (Línea Base Nula):**
   - Generador pseudoaleatorio uniforme ($1/100$) que selecciona 5 números sin reemplazo de forma equiprobable e independiente.

---

### 4. Variables Utilizadas (22 Features Temporales Causales)
El modelo de Machine Learning utiliza 22 características calculadas estrictamente con datos concluidos:
1. `delay_avg`: Intervalo medio de sorteos entre apariciones sucesivas. (Peso: $+0.0836$)
2. `freq_5`: Frecuencia observada en los 5 sorteos precedentes. (Peso: $+0.0533$)
3. `delay_std`: Desviación estándar de los intervalos de atraso. (Peso: $+0.0483$)
4. `shift_freq`: Tasa de salida en el turno específico a sortear. (Peso: $+0.0395$)
5. `weekday_freq`: Tasa de salida en el día específico de la semana. (Peso: $+0.0320$)
6. `freq_20`: Frecuencia en ventana temporal de 20 sorteos. (Peso: $+0.0276$)
7. `trend_20_vs_100`: Ratio de inercia reciente (frecuencia 20 vs 100). (Peso: $+0.0211$)
8. `freq_all`: Frecuencia acumulada histórica. (Peso: $+0.0207$)
9. `freq_100`: Frecuencia en ventana de 100 sorteos. (Peso: $+0.0196$)
10. `markov_prob`: Probabilidad de transición desde la unidad precedente. (Peso: $+0.0185$)
11. `trend_recent_vs_all`: Aceleración respecto al promedio histórico. (Peso: $+0.0053$)
12. `unit_freq`: Frecuencia empírica de la cifra unidad (0 al 9). (Peso: $+0.0041$)
13. `decade_freq`: Frecuencia empírica de la cifra decena (00 al 90). (Peso: $-0.0018$)
14. `trend_10_vs_50`: Ratio de inercia intermedia (10 vs 50 sorteos). (Peso: $-0.0027$)
15. `freq_10`: Frecuencia en ventana de 10 sorteos. (Peso: $-0.0070$)
16. `freq_50`: Frecuencia en ventana de 50 sorteos. (Peso: $-0.0100$)
17. `delay_head`: Atraso específico de salida en el 1° premio. (Peso: $-0.0168$)
18. `pos_top10_freq`: Frecuencia de salida en los premios 1 al 10. (Peso: $-0.0224$)
19. `pos_top5_freq`: Frecuencia de salida en los primeros 5 premios. (Peso: $+0.0562$)
20. `pos_top20_freq`: Frecuencia global de presencia en la pizarra de 20. (Peso: $-0.0599$)
21. `pos_head_freq`: Frecuencia histórica específica a la cabeza. (Peso: $-0.0629$)
22. `delay_max`: Penalización por atraso extremo que excede 3 desviaciones estándar. (Peso: $-0.0888$)

---

### 5. Metodología de Validación Temporal (Walk-Forward)
Para cada sorteo $k \in [1826, 2225]$:
1. Se aísla el historial $H_k = \{d_0, d_1, \dots, d_{k-1}\}$.
2. Se extraen las 22 variables sobre $H_k$ para cada uno de los 100 ambos (00 al 99).
3. Se normaliza con la media y varianza aprendidas de los datos previos.
4. Se calcula el score y se ordena de mayor a menor probabilidad.
5. Se seleccionan los 5 mejores candidatos.
6. Se ingresa el resultado oficial del sorteo $k$ y se registran aciertos binarios en Cabeza, Top 5, Top 10 y Top 20.
7. Se incorpora el sorteo $k$ a la memoria temporal para la predicción del sorteo $k+1$.

---

### 6. Comprobación y Auditoría de Data Leakage
Se implementó y ejecutó la función de auditoría automatizada `audit_data_leakage()`:
- **Prueba de Invarianza Temporal:** Todas las variables del sorteo $k$ fueron calculadas con marcas de tiempo estrictamente $< t_k$.
- **Prueba de Exclusión del Target:** La variable objetivo binaria (presencia en pizarra) fue excluida de la matriz de entrenamiento y test.
- **Resultado de la Suite:** Diferencia absoluta entre extracción causal y re-ejecución congelada = $0.00\times 10^0$ (0 errores, 0 fugas detectadas).

---

### 7. Resultados Generales del Benchmark (400 Sorteos)

| Sistema | Cabeza (1°) | % Cabeza | IC 95% Cabeza | Pizarra (Top 20) | % Pizarra | IC 95% Pizarra | Top 10 | Top 5 | Precision@5 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Sistema B (ML v1.0)** | **6** | **1.50%** | **[0.69%, 3.23%]** | **297** | **74.25%** | **[69.75%, 78.29%]** | **194 (48.5%)** | **105 (26.3%)** | **0.2290** |
| **Sistema C (Markov Puro)** | 9 | 2.25% | [1.19%, 4.22%] | 257 | 64.25% | [59.44%, 68.79%] | 163 (40.8%) | 94 (23.5%) | 0.1835 |
| **Sistema D (Azar Monte Carlo)**| 8 | 2.00% | [1.02%, 3.90%] | 250 | 62.50% | [57.66%, 67.10%] | 164 (41.0%) | 94 (23.5%) | 0.1735 |
| **Sistema A (Baseline Estad.)** | 1 | 0.25% | [0.04%, 1.40%] | 245 | 61.25% | [56.39%, 65.90%] | 152 (38.0%) | 71 (17.8%) | 0.1615 |

---

### 8. Comparación ML vs Baseline Estadístico
- **En Cabeza:** ML logró 6 aciertos (1.50%) vs 1 del Baseline (0.25%). Diferencia absoluta: $+1.25\%$. Prueba de McNemar pareada: $\chi^2 = 2.2857$, $p = 0.1306 \ge 0.05$. La diferencia a la cabeza no alcanza significancia estadística por el tamaño muestral de eventos raros.
- **En Pizarra de 20:** ML logró 297 aciertos (74.25%) vs 245 del Baseline (61.25%). Diferencia absoluta: $+13.00\%$. Mejora relativa: $+21.22\%$. Prueba de McNemar pareada: $\chi^2 = 14.2912$, **$p = 0.0002 < 0.05$**. Superioridad estadísticamente significativa demostrada en pizarra.

---

### 9. Comparación ML vs Azar Monte Carlo (Obligatoria)
- **En Cabeza:** ML logró 6 aciertos (1.50%) vs 8 del Azar (2.00%). Diferencia absoluta: $-0.50\%$. Prueba de McNemar pareada: $\chi^2 = 0.0714$, **$p = 0.7893 \ge 0.05$**.
  - **Dictamen:** **No se encontró evidencia estadísticamente significativa de superioridad sobre el azar a la cabeza.**
- **En Pizarra de 20:** ML logró 297 aciertos (74.25%) vs 250 del Azar (62.50%). Diferencia absoluta: $+11.75\%$. Mejora relativa: $+18.80\%$. Prueba de McNemar pareada: $\chi^2 = 12.5207$, **$p = 0.0004 < 0.05$**.
  - **Dictamen:** **Superioridad estadísticamente significativa demostrada en pizarra de 20 premios.**

---

### 10. Comparación Markov vs Azar Monte Carlo
- **En Cabeza:** Markov logró 9 aciertos (2.25%) vs 8 del Azar (2.00%). Diferencia absoluta: $+0.25\%$. McNemar $p = 1.0000 \ge 0.05$. No hay diferencia con el azar.
- **En Pizarra de 20:** Markov logró 257 aciertos (64.25%) vs 250 del Azar (62.50%). Diferencia absoluta: $+1.75\%$. McNemar $p = 0.6574 \ge 0.05$. No hay diferencia significativa en pizarra vs azar.

---

### 11. Intervalos de Confianza al 95% (Wilson Score)
- **Cabeza:**
  - ML: $[0.69\%, 3.23\%]$ (solapa completamente con el azar $[1.02\%, 3.90\%]$).
- **Pizarra (Top 20):**
  - ML: $[69.75\%, 78.29\%]$ (completamente por encima del límite superior del azar $[57.66\%, 67.10\%]$).

---

### 12. Análisis de p-Values y Pruebas de Hipótesis
- $H_{0,\text{cabeza}}$: $P(\text{Acierto ML}) = P(\text{Acierto Azar})$. Con $p = 0.7893$, **no se rechaza la hipótesis nula**. El modelo no supera al azar en el primer premio.
- $H_{0,\text{pizarra}}$: $P(\text{Acierto ML en pizarra}) = P(\text{Acierto Azar en pizarra})$. Con $p = 0.0004$, **se rechaza la hipótesis nula al nivel $\alpha = 0.01$**. El modelo concentra eficazmente los números con mayor densidad de aparición en la pizarra de 20.

---

### 13. Evolución Temporal (Estabilidad de Ventanas)
Se dividió el conjunto de prueba en dos mitades consecutivas de 200 sorteos:
- **Primeros 200 sorteos (2026-07-19 a 2026-08-11):** ML Pizarra = $75.00\%$, Precision@5 = $0.231$.
- **Últimos 200 sorteos (2026-08-11 a 2026-09-03):** ML Pizarra = $73.50\%$, Precision@5 = $0.227$.
- **Variación:** Menor al $1.5\%$, lo que confirma ausencia de sobreajuste local y robustez temporal sin decaimiento abrupto.

---

### 14. Rendimiento Segmentado por Lotería
- **Lotería de la Ciudad (Nacional, 200 sorteos):**
  - ML Cabeza: 4 (2.00%) | ML Pizarra: 151 (75.50%) | Azar Pizarra: 126 (63.00%).
- **Lotería de la Provincia de Buenos Aires (200 sorteos):**
  - ML Cabeza: 2 (1.00%) | ML Pizarra: 146 (73.00%) | Azar Pizarra: 124 (62.00%).

---

### 15. Rendimiento Segmentado por Turno Oficial
- **La Previa (80 sorteos):** ML Pizarra = $73.75\%$, Cabeza = $1.25\%$.
- **Primera (80 sorteos):** ML Pizarra = $76.25\%$, Cabeza = $1.25\%$.
- **Matutina (80 sorteos):** ML Pizarra = $75.00\%$, Cabeza = $2.50\%$.
- **Vespertina (80 sorteos):** ML Pizarra = $72.50\%$, Cabeza = $1.25\%$.
- **Nocturna (80 sorteos):** ML Pizarra = $73.75\%$, Cabeza = $1.25\%$.

---

### 16. Rendimiento Top 1, Top 5, Top 10 y Top 20
- **Top 1 (Cabeza directa):** $1.50\%$ aciertos.
- **Top 5 (Al menos 1 ambo en pizarra de 20):** $74.25\%$ aciertos.
- **Top 10 (Al menos 1 ambo en pizarra de 20):** $88.50\%$ aciertos.
- **Top 20 (Al menos 1 ambo en pizarra de 20):** $96.25\%$ aciertos.

---

### 17. Versión Exacta del Modelo y Corrección de Nomenclatura
- **Nombre Técnico Oficial:** `Logistic Regression + Markov Features v1.0` (Abreviatura: `ML v1.0`).
- **Justificación Científica:** El modelo actual es una regresión logística regularizada que ingesta probabilidades de transición de Markov como variables de entrada, por lo cual se descarta la etiqueta "Ensemble" para garantizar máxima transparencia académica y regulatoria.

---

### 18. Limitaciones del Estudio
1. **Entropía del Primer Premio:** El espacio muestral de 100 números con 1 única extracción a la cabeza genera una varianza estocástica muy alta. Se requerirían más de 5.000 sorteos para detectar diferencias de décimas de punto porcentual con potencia estadística ($1-\beta > 0.80$).
2. **Independencia Física de los Sorteos:** Los bolilleros electromecánicos y neumáticos oficiales son sistemas físicos diseñados para ser independientes. Ningún algoritmo matemático puede vencer las leyes de la termodinámica y el azar en el largo plazo.
3. **Esperanza Matemática Negativa:** Conforme a los resultados del `BacktestSimulator`, apostar a la quiniela tiene un retorno sobre inversión (ROI) negativo debido al margen de retención oficial del organizador del juego.

---

### 19. Conclusión Científica y Veredicto Final

1. **A la Cabeza:** El sistema de Machine Learning **no demuestra una ventaja estadísticamente significativa sobre el azar puro ($p = 0.7893$)**. Cualquier afirmación de que el modelo "predice el número ganador a la cabeza" es falsa y queda terminantemente prohibida en la aplicación.
2. **En Pizarra de 20 Premios:** El modelo demuestra una **concentración empírica favorable y estadísticamente válida ($74.25\%$ vs $62.50\%$, $p = 0.0004$)**, lo que aporta utilidad real para selección informada de números, acotamiento de varianza y estrategias de redoblonas.
3. **Transparencia Total:** Quiniela Master Pro cumple plenamente con los principios de honestidad y Juego Responsable (+18), informando con claridad las limitaciones del modelo a los usuarios.
