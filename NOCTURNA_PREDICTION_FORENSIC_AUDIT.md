# INFORME DE AUDITORÍA FORENSE: SORTEO NOCTURNA 2026-09-04 & MEJORA DE TRANSPARENCIA UI

**Fecha de Auditoría:** 2026-09-04 23:05:00 ART  
**Tipo de Auditoría:** Forense Criptográfica Read-Only & Verificación de Interfaz  
**Ambiente:** Quiniela Master Pro (Vite / React / Standalone Client Engine)  
**Estado:** AUDITORÍA COMPLETADA — HOTFIX DE TRANSPARENCIA UI APLICADO  

---

## 1. RESUMEN EJECUTIVO

A raíz del reclamo reportado tras el sorteo de **Ciudad Nocturna del 2026-09-04 (21:00 hs)**, donde la aplicación informó premios que los usuarios no visualizaban en la pantalla de Pronósticos, se llevó a cabo una auditoría forense rigurosa y read-only sobre los registros criptográficos y el ciclo de vida de la interfaz de usuario.

### Conclusiones Principales:

1. **Causa Raíz del Desvanecimiento Visual:**  
   En `frontend/src/services/clientEngine.js`, la función `getCurrentActiveShift()` está programada para transicionar automáticamente el turno activo a las 21:00:00 hs hacia `"La Previa (Mañana)"` (10:15 hs del día siguiente). La pantalla `PredictionsTab.jsx` evaluaba únicamente el turno devuelto por `activeShift || 'auto'`. Por lo tanto, al ingresar el usuario a las 21:05 hs a corroborar las jugadas, la pantalla ya no mostraba la Nocturna, sino los pronósticos de la mañana siguiente, ocultando silenciosamente las recomendaciones de la noche.

2. **Inexistencia de Snapshot Sellado Pre-Sorteo para Nocturna:**  
   La inspección del Ledger Criptográfico oficial (`backend/ml_pipeline/prospective_audit_ledger.json`) confirmó que únicamente el sorteo **Vespertina (18:00 hs)** del 2026-09-04 contaba con un snapshot pre-sorteo bloqueado con SHA-256 (sellado a las 16:51:04 ART / 19:51:04 UTC). **No existía ningún registro sellado pre-sorteo para Nocturna.**

3. **Autenticidad de los Cálculos Algorítmicos:**  
   - Al ejecutar el pipeline determinista out-of-sample estrictamente congelado antes de las 21:00 hs:
     - **Motor Estadístico (Frecuencias & Atrasos):** Genera Top 5 = `[52, 82, 90, 32, 07]`.
     - **Motor IA / ML-FULL (Champion):** Genera Top 5 = `[82, 35, 86, 28, 66]`.
   - El extracto oficial de **Ciudad Nocturna** tuvo como 1° premio a la cabeza el número **6582** (Ambo **82**).
   - Ambos motores tenían el ambo 82 en su Top 5 (ML-FULL en Rank #1 y Motor Estadístico en Rank #2).
   - Sin embargo, al **no existir un hash criptográficamente sellado con anterioridad a las 20:45 ART**, este acierto clasifica estrictamente como **COINCIDENCIA DETERMINISTA RETROSPECTIVA** y **NO PUEDE SER COMPUTADO EN LA EVALUACIÓN PROSPECTIVA FORMAL DE LA FASE 5** (la muestra prospectiva oficial se mantiene inalterada en N=2).

---

## 2. TABLA DE EVIDENCIA FORENSE

| Fuente Consultada | Ubicación / Identificador | Registros Encontrados | Estado Pre-Sorteo (20:45 ART) |
| :--- | :--- | :--- | :--- |
| **Prediction Audit Ledger** | `backend/ml_pipeline/prospective_audit_ledger.json` | 12 registros de Fase 5 bloqueados a las `19:51:04 UTC` para **Vespertina 2026-09-04**. | ❌ **Inexistente para Nocturna.** Ningún hash sellado antes del sorteo. |
| **Prospective Test V1 DB** | `backend/ml_pipeline/prospective_test_v1.json` | Dataset de evaluación prospectiva N=2 (Vespertina Ciudad + Vespertina Provincia). | ❌ **No contiene Nocturna.** Solo N=2 válidos. |
| **Extractos Oficiales** | `frontend/src/services/clientEngine.js` & `draws.json` | Extractos oficiales cargados a las 21:30 ART tras fiscalización LOTBA e IPLyC. | ✅ Pizarra oficial confirmada (Cabeza Ciudad: 6582; Provincia: 3397). |
| **Local Storage Runtime** | `quinela_predictions_registry_v1` | Memoria efímera de cliente. | ⚠️ Sobrescrita por rollover automático a las 21:00:00 hacia La Previa. |

---

## 3. ANÁLISIS ESPECÍFICO: CIUDAD NOCTURNA 2026-09-04

- **Resultado Oficial Lotería de la Ciudad (LOTBA):**
  - **1° Premio (Cabeza):** `6582` ➔ Ambo: **`82`** ("La Pelea")
  - **Pizarra Completa (20 premios):**  
    `['6582', '8292', '3385', '4789', '8780', '1818', '4980', '6065', '6975', '1274', '9831', '1107', '6638', '3572', '6565', '8443', '3383', '6078', '8498', '9037']`

### Comparativa de Motores para Ciudad Nocturna:

#### A. Motor Estadístico (Frecuencias, Atrasos & Markov)
- **Top 5 Calculado:** `['52', '82', '90', '32', '07']`
- **Acierto en Cabeza:** Ambo **`82`** en Ranking #2 (Composite Score: 68/100).
- **Registro Pre-Sorteo Sellado:** **NO**.
- **Clasificación Ética:** Coincidencia algorítmica determinista out-of-sample; **no admisible** como acierto prospectivo auditado.

#### B. Motor IA / Machine Learning — Champion (ML-FULL v1.0)
- **Top 5 Calculado:** `['82', '35', '86', '28', '66']`
- **Acierto en Cabeza:** Ambo **`82`** en Ranking #1 (Predictive Score: 78.4/100).
- **Registro Pre-Sorteo Sellado:** **NO**.
- **Clasificación Ética:** Inferencia matemática determinista out-of-sample; **no admisible** como acierto prospectivo auditado.

---

## 4. ANÁLISIS DE PROVINCIA NOCTURNA 2026-09-04

- **Resultado Oficial Lotería de la Provincia (IPLyC):**
  - **1° Premio (Cabeza):** `3397` ➔ Ambo: **`97`** ("La Mesa")
  - **Pizarra Completa (20 premios):**  
    `['3397', '8977', '9540', '8837', '7591', '7779', '7725', '9688', '3294', '9753', '1629', '0859', '0755', '5115', '9270', '4172', '2016', '2533', '5582', '8182']`

### Resultados:
- **Motor Estadístico Top 5:** `['80', '60', '20', '06', '97']`  
  ➔ Acertó Cabeza con Ambo **`97`** en Ranking #5.
- **Motor ML-FULL Top 5:** `['38', '77', '82', '70', '57']`  
  ➔ Acertó Pizarra con **`77`** (Posición #2, 14x), **`70`** (Posición #15, 3.5x), y **`82`** (Posición #19 y #20, 3.5x).

---

## 5. SOLUCIÓN IMPLEMENTADA (TRANSPARENCIA TOTAL UI)

Para erradicar la confusión de los usuarios y garantizar transparencia absoluta, se implementaron las siguientes mejoras en el frontend:

### A. Pantalla de Pronósticos (`PredictionsTab.jsx`)
1. **Presentación Simultánea en Dos Filas:**  
   Se eliminó la alternancia que ocultaba uno de los motores. Ahora cada sorteo muestra simultáneamente:
   - **Fila 1: 🧠 Motor IA / ML — Champion (ML-FULL):** Modelo de regresión logística regularizada L2 con 22 features temporales, ranking, scores y estado de sellado.
   - **Fila 2: 📊 Motor Estadístico Base:** Frecuencias, atrasos y cadenas de Markov.
2. **Dos Bloques Cronológicos Claramente Diferenciados (Nunca Ocultar el Pasado):**
   - **Bloque Superior ("1. PRÓXIMO SORTEO A JUGAR"):** Muestra el sorteo por venir (ej. La Previa 10:15 hs) con cuenta regresiva en vivo segundo a segundo.
   - **Bloque Inferior ("2. ÚLTIMO SORTEO CERRADO & AUDITORÍA"):** Permanece visible de forma fija después del cierre (ej. Nocturna 21:00 hs), mostrando los números pronosticados por ambos motores contrastados directamente contra el extracto oficial:
     - `👑 CABEZA` (si acertó el 1° premio)
     - `🎯 POSICIÓN #X` (si entró en los 20 premios)
     - `⚪ NO SALIÓ` (si no apareció)
3. **Cupón Digital para el Agenciero:**
   Permite seleccionar qué motor mostrar en ventanilla (Fila 1 IA o Fila 2 Estadístico) en tipografía gigante.

### B. Pantalla de Historial y Resultados (`DrawsHistoryTab.jsx`)
1. **Auditoría Dual Explícita en Tarjetas:**  
   Cada tarjeta de sorteo muestra los aciertos de ambos motores con nombre del motor, ambo, posición oficial y multiplicador.
2. **Distinción Ética de Proveniencia:**
   - **Sorteos Sellados (Vespertina 2026-09-04):** `🛡️ PRONOSTICADO ANTES DEL SORTEO (LEDGER SELLADO 🔒)`.
   - **Sorteos No Sellados (Nocturna 2026-09-04):** `ℹ️ COINCIDENCIA DETERMINISTA — NO COMPUTABLE EN VALIDACIÓN PROSPECTIVA`.

---

## 6. FLAGS INVARIANTES OBLIGATORIOS

```
STATISTICAL_TOP5_PRE_DRAW_EXISTS = NO
ML_FULL_TOP5_PRE_DRAW_EXISTS = NO
STATISTICAL_HASH_VALID = N/A
ML_FULL_HASH_VALID = NO
PROSPECTIVE_ELIGIBLE_STATISTICAL = NO
PROSPECTIVE_ELIGIBLE_ML_FULL = NO
RETROSPECTIVE_RECONSTRUCTION = YES
MODELS MODIFIED = 0
PREDICTIONS MODIFIED = 0
LOCKED HASHES MODIFIED = 0
PROSPECTIVE N MODIFIED = NO
UI TRANSPARENCY FIX = PASS
```
