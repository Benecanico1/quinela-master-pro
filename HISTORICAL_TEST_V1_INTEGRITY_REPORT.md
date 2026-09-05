# HISTORICAL TEST V1 — INTEGRITY REPORT & AUDIT
**Conjunto de Datos:** `HISTORICAL_TEST_V1`  
**Archivo Fuente:** `backend/ml_pipeline/historical_test_v1_frozen.json`  
**Estado:** `FROZEN_IMMUTABLE`  
**READ_ONLY:** `TRUE`  
**IMMUTABLE:** `TRUE`  
**ROLE:** `HISTORICAL_VALIDATION_ONLY`  

---

## 1. Métrica Central de Integridad
- **Cantidad exacta de sorteos (`exact_count`):** **`400`**
- **Primer sorteo del test:** `2026-07-19_provincia_matutina` (Cabeza: `2118`)
- **Último sorteo del test:** `2026-09-03_provincia_nocturna` (Cabeza: `9044`)
- **Fecha Inicial:** `2026-07-19`
- **Fecha Final:** `2026-09-03`
- **Duplicados detectados:** `0`
- **Faltantes en la secuencia:** `0`
- **Integridad temporal:** `PASS` (Secuencia estrictamente cronológica y continua)

---

## 2. Distribución de Sorteos

### Por Jurisdicción
- **Lotería de la Ciudad (Nacional):** `208` sorteos (52.0%)
- **Lotería de la Provincia de Buenos Aires:** `192` sorteos (48.0%)
- **Total:** `400` sorteos

### Por Turno
- **Previa:** `76` sorteos
- **Primera:** `84` sorteos
- **Matutina:** `86` sorteos
- **Vespertina:** `77` sorteos
- **Nocturna:** `77` sorteos

---

## 3. Resolución Documental de la Inconsistencia `#1826–#2225` vs `#1825–#2225`
En los reportes de Fases 3 y 4 se observaron dos formas de citar el rango del conjunto congelado:
1. **Rango 1-indexed (notación humana / ordinal):** Al enumerar los 2.225 sorteos del histórico de 1 a 2.225, los últimos 400 sorteos son exactamente los sorteos desde el **#1.826 al #2.225** ($2225 - 400 + 1 = 1826$). En total son $2225 - 1826 + 1 = 400$ sorteos.
2. **Rango 0-indexed (notación Python slicing):** En Python, un slice sobre una lista de 2.225 elementos para extraer los últimos 400 se escribe como `draws[1825:2225]`. En este caso, el índice inicial es 1825 (que corresponde al elemento ordinal #1.826) y el límite superior no inclusivo es 2225 (que abarca hasta el índice 2224, elemento ordinal #2.225).

**Conclusión Científica:**
Ambas menciones hacen referencia exactamente al **mismo conjunto idéntico de 400 sorteos**. No existe discrepancia en los datos; la aparente inconsistencia fue simplemente una diferencia entre la indexación basada en cero (código) y la indexación basada en uno (texto del reporte). Los 400 registros son idénticos, deterministas e inmutables.

---

## 4. Hash Criptográfico Canónico
- **SHA-256 Canónico del Dataset (Draws deterministas):**  
  `a9fa37c07f563f5bc433d3e0a454e8b49096bfca3a55c7791cb8607f1fb5a12e`
- **SHA-256 del Archivo `historical_test_v1_frozen.json`:**  
  `ab3991069aa5a381c3b4f3c08bce755c41687cd8ffcbc1f882324497fe10081f`

---

## 5. Declaración de Congelación
Los 400 sorteos quedan formalmente bloqueados bajo las siguientes restricciones inviolables:
- **NO** se utilizarán para ajustar pesos ni coeficientes.
- **NO** se utilizarán para seleccionar variables ni modelos.
- **NO** se utilizarán para afinar ventanas temporales ni hiperparámetros.
- **NO** se reentrenarán modelos buscando mejorar sus métricas sobre estos 400 sorteos.
- Rol exclusivo: **HISTORICAL_VALIDATION_ONLY**.