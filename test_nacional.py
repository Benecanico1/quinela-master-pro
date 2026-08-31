import requests
from bs4 import BeautifulSoup
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

url = "https://www.clarin.com/loterias-y-quinielas/nacional"
r = requests.get(url, headers=headers, timeout=10)
soup = BeautifulSoup(r.text, 'html.parser')

print(f"Page title: {soup.title.string if soup.title else 'No title'}")

# Look for extract tables or numbers
tables = soup.find_all('table')
print(f"Found {len(tables)} tables")

for idx, t in enumerate(tables):
    rows = t.find_all('tr')
    print(f"Table #{idx+1} has {len(rows)} rows")
    for row in rows[:5]:
        print("  Row:", [td.get_text().strip() for td in row.find_all(['td', 'th'])])

# If no standard tables, inspect cards
cards = soup.find_all('div', class_=re.compile(r'extracto|sorteo|pizarra|board|card|numbers|result', re.I))
print(f"Found {len(cards)} card containers")
for c in cards[:5]:
    text = c.get_text(separator=" | ").strip()
    if len(text) > 10:
        print(f"Card: {text[:150]}")
