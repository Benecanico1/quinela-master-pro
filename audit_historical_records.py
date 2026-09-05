import json

with open('frontend/public/api/draws.json', 'r', encoding='utf-8') as f:
    draws = json.load(f)

print(f'Total draws in draws.json: {len(draws)}')

with open('backend/ml_pipeline/prospective_audit_ledger.json', 'r', encoding='utf-8') as f:
    ledger = json.load(f)

locked_keys = set()
for p in ledger.get('predictions', []):
    jur = p.get('jurisdiction', '')
    sh = p.get('shift', '')
    dt = p.get('date', '')
    key = f"{dt}_{jur}_{sh}".lower()
    locked_keys.add(key)

print(f'Pre-draw locked draws in ledger: {len(locked_keys)} -> {locked_keys}')

valid_count = 0
unverifiable_count = 0
retrospective_count = 0

for k in draws.keys():
    k_clean = k.lower()
    if '2026-09-04_ciudad_vespertina' in k_clean or '2026-09-04_provincia_vespertina' in k_clean:
        valid_count += 1
    elif '2026-09-04_ciudad_nocturna' in k_clean or '2026-09-04_provincia_nocturna' in k_clean:
        retrospective_count += 1
    else:
        unverifiable_count += 1

print(f'VALID_PRE_DRAW_PREDICTION: {valid_count}')
print(f'RETROSPECTIVE_FALSE_ATTRIBUTION: {retrospective_count}')
print(f'UNVERIFIABLE_LEGACY_RECORD: {unverifiable_count}')
print(f'Total Audited: {valid_count + retrospective_count + unverifiable_count}')
