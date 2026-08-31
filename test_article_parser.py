import requests
from bs4 import BeautifulSoup
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# Fetch the main loterias page to find the exact URL for the 24-august Nocturna
r = requests.get("https://www.lanacion.com.ar/loterias/quiniela-nacional/", headers=headers, timeout=10)
soup = BeautifulSoup(r.text, 'html.parser')

links = soup.find_all('a', href=True)
target_url = None
for a in links:
    if 'nocturna' in a.get_text().lower() and '24' in a.get_text():
        target_url = a['href']
        print("Found target link:", a.get_text(), "->", target_url)
        break

if target_url:
    if not target_url.startswith('http'):
        target_url = "https://www.lanacion.com.ar" + target_url
    r_art = requests.get(target_url, headers=headers, timeout=10)
    soup_art = BeautifulSoup(r_art.text, 'html.parser')
    
    # Extract the 20 numbers
    text = soup_art.get_text(separator="\n")
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    
    # Find list items with 1., 2., 3., ...
    prizes = {}
    for line in lines:
        m = re.match(r'^(?:[0-9]{1,2}|[0-9]{1,2}[°º\.]?)\s*[:\-]?\s*([0-9]{4})$', line)
        if m:
            print("Prize line:", line)
        # Also check format like "1. 3169" or "1: 3169" or "01 - 3169"
        m2 = re.findall(r'(\b[1-9]|1[0-9]|20\b)[\.\:\°\º\s\-]+(\d{4})', line)
        for pos, val in m2:
            prizes[int(pos)] = val
            
    print("Parsed prizes from article:", prizes)
