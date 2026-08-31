import requests
import re
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

url = "https://www.clarin.com/loterias-y-quinielas/"
r = requests.get(url, headers=headers, timeout=10)
soup = BeautifulSoup(r.text, 'html.parser')

links = soup.find_all('a', href=re.compile(r'quiniela', re.I))
seen = set()

for a in links:
    href = a['href']
    title = a.get_text().strip()
    if href not in seen and len(title) > 10:
        seen.add(href)
        if not href.startswith('http'):
            href = "https://www.clarin.com" + href
        print(f"Article: {title} -> {href}")
