# NEXT DRAW PRE-DRAW TRACEABILITY REPORT (TRACEABILITY_V1)

**Sorteo Objetivo:** 2026-09-05 — Turno La Previa (10:15 hs ART)  
**Protocolo:** TRACEABILITY_V1 (Congelado y Sellado)  
**Estado Operativo:** PRE-DRAW LOCKED (Bloqueo previo al límite horario estricto)  

---

## 1. Registros Canónicos Sellados Pre-Sorteo

### Caso 1: Ciudad (Nacional) — Motor IA / ML (Champion ML-FULL)
* **ENGINE:** `ML-FULL` (Champion v1.0)
* **JURISDICTION:** `ciudad`
* **SHIFT:** `previa` (La Previa - 10:15 hs)
* **PREDICTION_ID:** `CANONICAL_2026-09-05_CIUDAD_PREVIA_ML-FULL`
* **TOP5:** `["13", "35", "55", "97", "48"]`
* **CREATED_AT:** `2026-09-05T03:23:35.519Z`
* **LOCKED_AT:** `2026-09-05T03:23:35.519Z`
* **DEADLINE:** `2026-09-05T10:15:00.000-03:00`
* **STATUS:** `LOCKED` 🔒
* **PREDICTION_HASH:** `65e1ec846396b2b0b697bcb265c9dd625d982b01c69a532398b9ed507ad386ae`
* **UI_TOP5:** `["13", "35", "55", "97", "48"]`
* **CANONICAL_TOP5:** `["13", "35", "55", "97", "48"]`
* **UI_CANONICAL_MATCH:** `PASS`

---

### Caso 2: Ciudad (Nacional) — Motor Estadístico Base
* **ENGINE:** `STATISTICAL` (Motor Estadístico)
* **JURISDICTION:** `ciudad`
* **SHIFT:** `previa` (La Previa - 10:15 hs)
* **PREDICTION_ID:** `CANONICAL_2026-09-05_CIUDAD_PREVIA_STATISTICAL`
* **TOP5:** `["47", "07", "66", "21", "53"]`
* **CREATED_AT:** `2026-09-05T03:23:35.546Z`
* **LOCKED_AT:** `2026-09-05T03:23:35.546Z`
* **DEADLINE:** `2026-09-05T10:15:00.000-03:00`
* **STATUS:** `LOCKED` 🔒
* **PREDICTION_HASH:** `da25c52729269e103273200fc445fcfeb2fce78a1d01833855e70937583dc8ec`
* **UI_TOP5:** `["47", "07", "66", "21", "53"]`
* **CANONICAL_TOP5:** `["47", "07", "66", "21", "53"]`
* **UI_CANONICAL_MATCH:** `PASS`

---

### Caso 3: Provincia (Buenos Aires) — Motor IA / ML (Champion ML-FULL)
* **ENGINE:** `ML-FULL` (Champion v1.0)
* **JURISDICTION:** `provincia`
* **SHIFT:** `previa` (La Previa - 10:15 hs)
* **PREDICTION_ID:** `CANONICAL_2026-09-05_PROVINCIA_PREVIA_ML-FULL`
* **TOP5:** `["27", "26", "43", "77", "87"]`
* **CREATED_AT:** `2026-09-05T03:23:35.549Z`
* **LOCKED_AT:** `2026-09-05T03:23:35.549Z`
* **DEADLINE:** `2026-09-05T10:15:00.000-03:00`
* **STATUS:** `LOCKED` 🔒
* **PREDICTION_HASH:** `889a10397222c7512f42126a468f889712551bf2c60120119fefe2370d2439c7`
* **UI_TOP5:** `["27", "26", "43", "77", "87"]`
* **CANONICAL_TOP5:** `["27", "26", "43", "77", "87"]`
* **UI_CANONICAL_MATCH:** `PASS`

---

### Caso 4: Provincia (Buenos Aires) — Motor Estadístico Base
* **ENGINE:** `STATISTICAL` (Motor Estadístico)
* **JURISDICTION:** `provincia`
* **SHIFT:** `previa` (La Previa - 10:15 hs)
* **PREDICTION_ID:** `CANONICAL_2026-09-05_PROVINCIA_PREVIA_STATISTICAL`
* **TOP5:** `["74", "47", "37", "81", "71"]`
* **CREATED_AT:** `2026-09-05T03:23:35.552Z`
* **LOCKED_AT:** `2026-09-05T03:23:35.552Z`
* **DEADLINE:** `2026-09-05T10:15:00.000-03:00`
* **STATUS:** `LOCKED` 🔒
* **PREDICTION_HASH:** `a7e7733e6356931aa4daa9c2a52fa091869554fe8aae4cf925e94dbb02ad91b4`
* **UI_TOP5:** `["74", "47", "37", "81", "71"]`
* **CANONICAL_TOP5:** `["74", "47", "37", "81", "71"]`
* **UI_CANONICAL_MATCH:** `PASS`

---

## 2. Verificación de UI y Trazabilidad en Pantalla

En `PredictionsTab.jsx` se verificó la visualización simultánea de:
1. **Fila 1 (🧠 Motor IA / ML — Champion):**
   - Top 5 extraído estrictamente de `CanonicalPredictionRecord.top_5`.
   - Barra de auditoría forense con `jurisdicción`, `fecha`, `turno`, `horario`, `prediction_id`, `created_at`, `locked_at`, `deadline`, `estado LOCKED` e indicador 🔒.
2. **Fila 2 (📊 Motor Estadístico Base):**
   - Top 5 extraído estrictamente de `CanonicalPredictionRecord.top_5`.
   - Barra de auditoría forense con `jurisdicción`, `fecha`, `turno`, `horario`, `prediction_id`, `created_at`, `locked_at`, `deadline`, `estado LOCKED` e indicador 🔒.

Todos los componentes de interacción (Generador de Cupón para el Agenciero, Copiado a Portapapeles para WhatsApp y Resumen Diario) quedan estrictamente alimentados desde los mismos registros canónicos sellados.

---

## 3. Confirmación de Invariantes del Sistema

```ini
TRACEABILITY_PROTOCOL = TRACEABILITY_V1
TRACEABILITY_HASH = E1A72F02707AFF77DBA6E392894489B2D7331454C1BD334E3CE39E3AA30A4279
RETROSPECTIVE_RECALCULATION = DISABLED
MODELS_MODIFIED = 0
PROSPECTIVE_N = 2
```

---

## 4. Estado de Evaluación y Cierre Operativo

> [!IMPORTANT]
> **DETENCIÓN OPERATIVA PRE-SORTEO:**
> - El sorteo 2026-09-05 La Previa **NO se ha realizado aún**.
> - **NO SE EVALÚAN RESULTADOS TODAVÍA.**
> - **NO SE INCREMENTA N (`PROSPECTIVE_N = 2` SE MANTIENE INTACTO).**
> - Se espera la extracción oficial post-sorteo a las 10:15 hs ART.
