import requests
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

r = requests.get("https://www.clarin.com/loterias-y-quinielas/", headers=headers)
# Search for API URLs in text
apis = re.findall(r'https?://[^\s"\'<>]+\.json[^\s"\'<>]*|https?://[^\s"\'<>]+/api/[^\s"\'<>]*', r.text)
print("Found APIs:", set(apis))

# Also search for numbers pattern
nums = re.findall(r'(\w+ del \d{2}-\d{2})(\d{4})', r.text)
print("Found draws in home:", nums)
