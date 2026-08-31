import requests
from bs4 import BeautifulSoup
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

r = requests.get("https://www.lanacion.com.ar/loterias/quiniela-nacional/", headers=headers, timeout=10)
soup = BeautifulSoup(r.text, 'html.parser')

print(f"Title: {soup.title.string if soup.title else 'No title'}")

# Look for lottery items
for tag in soup.find_all(['table', 'div', 'section']):
    t = tag.get_text(separator=' ').strip()
    if 'previa' in t.lower() or 'nocturna' in t.lower() or 'matutina' in t.lower():
        # Check if contains numbers
        nums = re.findall(r'\b\d{4}\b', t)
        if len(nums) >= 5:
            print(f"Tag <{tag.name}> has {len(nums)} 4-digit numbers: {nums[:10]}")
            print(f"Snippet: {t[:120]}")
            break
