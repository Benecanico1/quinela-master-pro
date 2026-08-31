import requests
from bs4 import BeautifulSoup
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

url = "https://www.lanacion.com.ar/loterias/quiniela-nacional/resultados-de-la-quiniela-nacional-ronda-nocturna-de-hoy-24-de-agosto-nid24082026/"
r = requests.get(url, headers=headers, timeout=10)
soup = BeautifulSoup(r.text, 'html.parser')

paragraphs = soup.find_all(['p', 'li', 'h2', 'h3', 'div'])
for p in paragraphs:
    t = p.get_text().strip()
    if re.search(r'\b\d{4}\b', t) and len(t) < 300:
        print(f"[{p.name}] {t}")
