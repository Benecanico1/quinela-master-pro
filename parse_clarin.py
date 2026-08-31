import requests
import re
import json
from bs4 import BeautifulSoup

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

url = "https://www.clarin.com/loterias-y-quinielas/"
r = requests.get(url, headers=headers, timeout=10)
soup = BeautifulSoup(r.text, 'html.parser')

# Search for lotteries blocks
tables = soup.find_all('div', class_=re.compile(r'game|lottery|quiniela|card|board|draw', re.I))
print(f"Found {len(tables)} candidate containers")

# Print all text chunks containing "Nacional" or "Provincia"
for tag in soup.find_all(['div', 'section', 'h2', 'h3']):
    title = tag.get_text().strip()
    if any(k in title.lower() for k in ['nacional', 'provincia', 'la previa', 'primera', 'matutina', 'vespertina', 'nocturna']):
        if len(title) < 200 and len(title) > 5:
            print(f"[{tag.name}] {title[:100]}")
