import urllib.request
import urllib.parse
import ssl
import re
import json
import os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Content-Type': 'application/x-www-form-urlencoded'
}

# Try to discover sorteos from LOTBA homepage
sorteo_candidates = [
    ('52862', 'previa'),
    ('52863', 'primera'),
    ('52864', 'matutina'),
    ('52865', 'vespertina'),
    ('52866', 'nocturna')
]

try:
    req_home = urllib.request.Request('https://quiniela.loteriadelaciudad.gob.ar/', headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req_home, timeout=10, context=ctx) as r:
        html = r.read().decode('utf-8', errors='ignore')
        opts = re.findall(r'<option[^>]*value=[\'"](\d+)[\'"][^>]*>(.*?)</option>', html)
        print("Encontradas opciones en select LOTBA:", len(opts))
        for val, txt in opts:
            txt_lower = txt.lower()
            if '04/09/2026' in txt:
                print(f"Hoy sorteo detectado: {val} -> {txt.strip()}")
except Exception as ex:
    print("No se pudo leer home LOTBA:", ex)

today_results = {}

for s_id, s_shift in sorteo_candidates:
    for jur, lot in [('51', 'ciudad'), ('53', 'provincia')]:
        data = urllib.parse.urlencode({'codigo': '0080', 'juridiccion': jur, 'sorteo': s_id}).encode('utf-8')
        req = urllib.request.Request(
            'https://quiniela.loteriadelaciudad.gob.ar/resultadosQuiniela/consultaResultados.php',
            data=data,
            headers=headers
        )
        try:
            with urllib.request.urlopen(req, timeout=10, context=ctx) as res:
                content = res.read().decode('utf-8', errors='ignore')
                prizes = re.findall(r'class=[\'"]pos[\'"]>(\d{2})</div>\s*<div>(\d{4})</div>', content)
                if len(prizes) >= 20:
                    board_20 = [p[1] for p in prizes[:20]]
                    key = f"2026-09-04_{lot}_{s_shift}"
                    today_results[key] = {
                        "draw_date": "2026-09-04",
                        "lottery": lot,
                        "shift": s_shift,
                        "head_millar": board_20[0],
                        "head_centena": board_20[0][-3:],
                        "head_ambo": board_20[0][-2:],
                        "board": board_20
                    }
                    print(f"CONFIRMADO: {key} -> Cabeza: {board_20[0]}")
                else:
                    print(f"No disponible aun: {s_id} {lot} {s_shift} -> {len(prizes)} premios")
        except Exception as e:
            print(f"Error {s_id} {lot}: {e}")

print(f"\nTotal confirmados hoy: {len(today_results)}")

# Update files
target_files = [
    r'frontend/public/api/draws.json',
    r'backend/ml_pipeline/draws_curated.json',
    r'../ingenieriajh-portal/public/api/draws.json'
]

for tf in target_files:
    if os.path.exists(tf):
        with open(tf, 'r', encoding='utf-8') as f:
            data = json.load(f)
        before_count = len(data)
        if isinstance(data, dict):
            data.update(today_results)
            with open(tf, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Actualizado dict {tf}: {before_count} -> {len(data)} sorteos (+{len(data)-before_count})")
        elif isinstance(data, list):
            existing_ids = {f"{x['draw_date']}_{x['lottery']}_{x['shift']}" for x in data}
            shift_order_map = {'previa': 1, 'primera': 2, 'matutina': 3, 'vespertina': 4, 'nocturna': 5}
            added = 0
            for k, val in today_results.items():
                if k not in existing_ids:
                    item = dict(val)
                    item['shift_order'] = shift_order_map.get(item['shift'], 1)
                    data.append(item)
                    added += 1
            with open(tf, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Actualizado list {tf}: {before_count} -> {len(data)} sorteos (+{added})")
    else:
        print(f"No existe: {tf}")


