# INFORME DE AUDITORÍA FORENSE: ATRIBUCIÓN FALSA DE ACIERTOS

**Documento:** `FALSE_HIT_ATTRIBUTION_FORENSIC_AUDIT.md`  
**Fecha y Hora:** 2026-09-04 23:35:00 ART  
**Tipo de Auditoría:** Forense Read-Only — Trazabilidad de Extremo a Extremo  
**Incidente:** Resultados marcan aciertos que no estaban en la pantalla de Pronósticos previa al sorteo  
**Sorteo Auditado:** Ciudad Nocturna (21:00 hs) — 2026-09-04  
**Estado:** AUDITORÍA COMPLETADA — SIN MODIFICACIÓN DE CÓDIGO  

---

## 1. PASO 1 — IDENTIFICAR EL PRONÓSTICO REAL MOSTRADO

Para el sorteo de **Ciudad Nocturna del 2026-09-04**:

El usuario confirmó de forma inequívoca que la pantalla principal de Pronósticos mostraba antes del sorteo (19:00 hs) el siguiente conjunto de números:

```
USER_VISIBLE_TOP5 = [13, 20, 07, 55, 63]
```

### Metadata de la Fuente:
* **Función que generó/presentó los números:** `getClientPredictions` / Renderizado de Pronósticos del Día en cliente (`clientEngine.js`).
* **Componente de UI:** `frontend/src/components/PredictionsTab.jsx` (Pantalla de Pronósticos).
* **Fecha y Turno:** `2026-09-04`, Turno `Nocturna` (21:00 hs).
* **Engine / Modelo Activo en Pantalla:** Motor Estadístico / Inferencia Cliente Local.
* **Prediction ID:** `N/A` (Inferencia efímera no persistida).
* **Timestamp de Visualización:** `2026-09-04 19:00:00 ART` (Aprox. 2 horas antes del sorteo).
* **Almacenamiento donde quedaron guardados:** Memoria de estado React (`useState`) en `PredictionsTab.jsx`. **No fueron persistidos en `localStorage` (`quinela_predictions_registry_v1`) ni sellados en `prospective_audit_ledger.json`.**
* **Top 5 Completo Mostrado:**
  1. `13` ("La Yeta")
  2. `20` ("La Fiesta")
  3. `07` ("El Revólver")
  4. `55` ("La Música")
  5. `63` ("El Casamiento")

---

## 2. PASO 2 — IDENTIFICAR LOS SUPUESTOS ACIERTOS REPORTADOS

Tras realizarse el sorteo oficial a las 21:00 hs:

### Extracto Oficial Real (LOTBA - Ciudad Nocturna 2026-09-04):
* **1° Premio (Cabeza):** `6582` ➔ Ambo: **`82`** ("La Pelea")
* **Pizarra Completa (20 premios):** `['6582', '8292', '3385', '4789', '8780', '1818', '4980', '6065', '6975', '1274', '9831', '1107', '6638', '3572', '6565', '8443', '3383', '6078', '8498', '9037']`

### Supuestos Aciertos Marcados por la App:
1. **Número:** **`82`**
   * **Resultado Oficial:** Posición #1 (`6582` a la Cabeza).
   * **Cartel Mostrado en App:** `🏆 ¡PREMIO PRONOSTICADO! Acertó Ambo 82 (70x a la Cabeza)`.
   * **Componente que mostró el cartel:** `frontend/src/components/DrawsHistoryTab.jsx` y modal `selectedHitModal`.
   * **Función que determinó que era un acierto:** `auditDrawDetailed()` / `auditDrawAgainstPredictions()` en `clientEngine.js:1544`.
   * **Lista de predicciones contra la cual se hizo la comparación:** `[82, 35, 86, 28, 66]` (proveniente de una ejecución posterior e independiente de `getMLPredictions()`).

---

## 3. PASO 3 — COMPARACIÓN DIRECTA DE LAS DOS FUENTES

```
PREDICTIONS_SHOWN_BEFORE_DRAW          = [13, 20, 07, 55, 63]
PREDICTIONS_USED_BY_RESULTS_AFTER_DRAW = [82, 35, 86, 28, 66]

MATCH = NO
CRITICAL_TRACEABILITY_BUG = YES
```

### Hallazgo Crítico:
El ambo **`82`** **NO ESTABA** en la lista que el cliente vio en su pantalla (`[13, 20, 07, 55, 63]`). La atribución del premio de 70x a la cabeza al usuario fue un **falso positivo de trazabilidad**.

---

## 4. PASO 4 — DETERMINACIÓN DE LA CAUSA RAÍZ

### A. RETROSPECTIVE RECALCULATION: **YES**
* **Evidencia:**  
  En `frontend/src/components/DrawsHistoryTab.jsx` (línea 268-274):
  ```javascript
  const mlRes = getMLPredictions(draw.lottery, draw.shift, 15);
  mlTop5 = (mlRes.top_predictions || mlRes.predictions || []).map(p => p.number);
  ```
  Y en `frontend/src/services/clientEngine.js` (línea 1804):
  ```javascript
  drawObj.ai_hit = auditDrawAgainstPredictions(drawObj, dateStr, cleanLot, cleanShift);
  ```
  La pantalla de Resultados **vuelve a ejecutar los motores de pronóstico en tiempo real (`getMLPredictions()` y `getClientPredictions()`) DESPUÉS de finalizado el sorteo**, en lugar de leer el registro inmutable de lo que se le mostró al usuario.

### B. ENGINE CROSSOVER: **YES**
* **Evidencia:**  
  La pantalla de Pronósticos le estaba mostrando al usuario un motor/vista que produjo `[13, 20, 07, 55, 63]`, mientras que la pantalla de Resultados auditó contra `ML-FULL (Champion)` (`getMLPredictions()`) que tenía a `82` en Rank #1:
  ```
  PREDICTIONS_SCREEN_ENGINE   = Motor Estadístico / Fijos del Día en Cliente
  RESULTS_EVALUATION_ENGINE  = ML-FULL (getMLPredictions en DrawsHistoryTab)
  ```

### C. STORAGE MISMATCH: **YES**
* **Evidencia:**  
  * **Pronósticos:** Calcula en memoria del componente `PredictionsTab.jsx` (`useState`). **No escribe en `localStorage.getItem('quinela_predictions_registry_v1')`**.
  * **Resultados:** `DrawsHistoryTab.jsx` no consulta ningún snapshot de `localStorage` del usuario; corre una evaluación dinámica nueva.
  * Claves y fuentes desacopladas:
    * Fuente en Pronósticos: Estado efímero de React en cliente.
    * Fuente en Resultados: Inferencia recalculada en tiempo de renderizado.

---

## 5. PASO 5 — CLASIFICACIÓN DEL INCIDENTE

El incidente clasifica simultáneamente bajo las siguientes categorías:

| Categoría | Aplica | Justificación |
| :--- | :---: | :--- |
| **`RETROSPECTIVE_RECALCULATION`** | **SÍ** | La pantalla de Resultados invoca nuevamente a `getMLPredictions()` después del sorteo en lugar de auditar contra una predicción inmutable congelada. |
| **`ENGINE_MISMATCH`** | **SÍ** | La pantalla de Pronósticos entregó una lista y la pantalla de Resultados comparó contra un motor completamente distinto. |
| **`STORAGE_MISMATCH`** | **SÍ** | No existe sincronización mediante clave común persistente entre lo renderizado en `PredictionsTab` y lo evaluado en `DrawsHistoryTab`. |
| **`MISSING_PREDICTION_SNAPSHOT`** | **SÍ** | La aplicación no guardó un snapshot criptográfico local ni en storage de lo que el usuario tenía en pantalla a las 19:00 hs. |

---

## 6. CONCLUSIÓN FORENSE FINAL

1. El cliente **tiene absoluta y total razón**: a las 19:00 hs la aplicación le mostró `13, 20, 07, 55, 63`.
2. En el sorteo oficial salió el **`82`**, número que el cliente **no tenía**.
3. La pantalla de resultados informó falsamente un acierto a la cabeza con el `82` porque ejecutó un recálculo retrospectivo con un motor distinto (`ML-FULL`), cometiendo un error crítico de desacoplamiento entre lo que el usuario ve y lo que el evaluador audita.

**Estado:** DETENIDO — Listo para recibir instrucciones de solución sin haber alterado ningún modelo ni resultado histórico.
