# 🎯 Quiniela Pattern Engine & Predictor (Argentina 2026)

Una suite analítica profesional de minería de patrones estadísticos, modelado matemático y sugerencias predictivas para la **Quiniela Argentina (Lotería de la Ciudad / Nacional y Provincia de Buenos Aires)**.

---

## 🚀 Cómo Iniciar la Aplicación

### Opción 1: Inicio Rápido con 1 Clic (Windows)
Haz doble clic sobre el archivo **`run_app.bat`**. Se abrirá automáticamente tu navegador en:
👉 **`http://127.0.0.1:8000`**

### Opción 2: Ejecución Manual con Terminal
```bash
# 1. Entrar al directorio del backend
cd backend

# 2. Ejecutar el servidor FastAPI
python main.py
```
Abre tu navegador en `http://127.0.0.1:8000`.

---

## 🧠 Metodología Científica y Algoritmos del Estudio

1. **Scoring Compuesto Multicriterio (0 a 100 puntos):**
   - **Atraso Crítico & Maduración (25%):** Evalúa el ratio entre el atraso actual y el ciclo medio histórico ($A_{actual} / A_{promedio}$).
   - **Inercia en Pizarra (20%):** Detección de presencia repetida en los 20 premios antes del salto a la cabeza.
   - **Cadenas de Markov de 1° Orden (20%):** Probabilidad condicional de transición $P(S_{t+1} \mid S_t)$ calculada desde el último sorteo.
   - **Frecuencia Reciente (20%):** Detección de rachas y números calientes.
   - **Armonía Estructural (15%):** Ajuste fino a la campana de Gauss en la suma de dígitos (sumas de 7 a 11) y balance par/impar.

2. **Mapa Térmico de Frecuencias (100 Ambos):**
   - Matriz visual 10x10 con degradado de temperatura.
   - Pruebas estadísticas $\chi^2$ (Chi-cuadrado) y Z-Score de desviación.

3. **Semáforo de Demoras y Maduración:**
   - Clasificación en: *Crítico Atrasado*, *En Maduración*, *Frecuente* y *Normal*.

4. **Correlación Cruzada (Ciudad vs Provincia):**
   - Coincidencias en el mismo día y "Ambos Saltarines" (de pizarra a cabeza).

5. **Generador Inteligente de Boletos:**
   - Filtros de paridad (Par-Par, Impar-Impar, Mixto), rangos (00-49 vs 50-99) y atraso mínimo.
   - Generación de jugadas de **2 cifras (Ambos)**, **3 cifras (Ternos)** y **4 cifras (Cuaternos)**.

6. **Módulo de Backtesting Histórico:**
   - Simulación de aciertos reales contrastados contra el azar sobre el histórico 2026.
