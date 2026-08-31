import requests
from bs4 import BeautifulSoup
import re
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

r = requests.get("https://www.lanacion.com.ar/loterias/quiniela-nacional/", headers=headers, timeout=10)
soup = BeautifulSoup(r.text, 'html.parser')

# Find sections with tables or grids
sections = soup.find_all(['section', 'div', 'article'])

for s in sections:
    h2 = s.find(['h2', 'h3', 'h4'])
    if h2:
        title = h2.get_text().strip()
        if any(k in title.lower() for k in ['previa', 'primera', 'matutina', 'vespertina', 'nocturna']):
            nums = re.findall(r'\b\d{4}\b', s.get_text())
            print(f"Shift section '{title}' -> {len(nums)} numbers: {nums[:10]}")
