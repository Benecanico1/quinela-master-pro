# PROCEDIMIENTO DE ROLLBACK — FASE 5
**Versión de Resguardo:** v1.4.3 (Build 75)  
**Directorio de Snapshot:** `releases/pre_phase5_v1.4.3/`  
**Manifiesto:** `PRE_PHASE5_MANIFEST.json`  
**ROLLBACK_VERIFIED:** PASS  
**Fecha:** 2026-09-04 15:24:03 (2026-09-04T18:24:03.817217+00:00)  

## Procedimiento de Rollback Inmediato
1. Restaurar código fuente:
   `cp releases/pre_phase5_v1.4.3/source/* frontend/src/services/`
2. Restaurar modelos:
   `cp releases/pre_phase5_v1.4.3/models/* backend/ml_pipeline/`
3. Restaurar datasets:
   `cp releases/pre_phase5_v1.4.3/datasets/draws.json frontend/public/api/`
   `cp releases/pre_phase5_v1.4.3/datasets/draws_curated.json backend/ml_pipeline/`
   `cp releases/pre_phase5_v1.4.3/datasets/historical_test_v1_frozen.json backend/ml_pipeline/`
4. Verificar checksums contra `PRE_PHASE5_MANIFEST.json`
5. Recompilar frontend: `npm run build` en `frontend/`

**Estado de Verificación:** PASS