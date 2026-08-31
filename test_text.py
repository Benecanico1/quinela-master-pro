import requests
import re
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

url = "https://www.clarin.com/loterias-y-quinielas/nacional"
r = requests.get(url, headers=headers, timeout=10)

# Check all text blocks in body
soup = BeautifulSoup(r.text, 'html.parser')
main = soup.find('main') or soup.find('body')

for p in main.find_all(['p', 'h2', 'h3', 'li', 'span', 'div']):
    t = p.get_text().strip()
    if re.search(r'\b\d{4}\b', t) and any(k in t.lower() for k in ['previa', 'primera', 'matutina', 'vespertina', 'nocturna', 'cabeza', 'sorteo']):
        print(f"[{p.name}] {t}")
