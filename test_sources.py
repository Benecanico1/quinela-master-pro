import requests
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
}

sources = [
    "https://www.clarin.com/loterias-y-quinielas/",
    "https://www.lanacion.com.ar/loterias/",
    "https://www.cronica.com.ar/quiniela/"
]

for url in sources:
    try:
        r = requests.get(url, headers=headers, timeout=8)
        print(f"URL: {url} -> Status: {r.status_code}, Length: {len(r.text)}")
    except Exception as e:
        print(f"Error {url}: {e}")
