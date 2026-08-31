import urllib.request
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def test_fetch(url):
    print(f"Testing URL: {url}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            print(f"Success! Content length: {len(content)} chars")
            return content
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

# Test live endpoints
test_fetch("https://noticiasquiniela.com.ar/")
test_fetch("https://www.tuquiniela.com.ar/")
