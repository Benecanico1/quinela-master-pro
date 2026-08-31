import requests
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

urls = [
    "https://api.loteriadelaciudad.gob.ar/api/juegos/quiniela/extractos",
    "https://www.loteriadelaciudad.gob.ar/api/extractos",
    "https://noticiasquiniela.com.ar/api",
    "https://www.ambito.com/contenidos/quiniela.html",
    "https://www.lanacion.com.ar/loterias/quiniela-nacional/",
    "https://www.lanacion.com.ar/loterias/quiniela-de-la-provincia/"
]

for u in urls:
    try:
        r = requests.get(u, headers=headers, timeout=6)
        print(f"{u} -> {r.status_code} ({len(r.text)} bytes)")
    except Exception as e:
        print(f"{u} -> Error: {e}")
