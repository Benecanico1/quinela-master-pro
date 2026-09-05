import urllib.request
import urllib.parse
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    'https://quiniela.loteriadelaciudad.gob.ar/',
    headers={'User-Agent': 'Mozilla/5.0'}
)
with urllib.request.urlopen(req, timeout=10, context=ctx) as res:
    html = res.read().decode('utf-8', errors='ignore')
    # find table rows
    rows = re.findall(r'<tr>\s*<td>(\d{5})</td>\s*<td>([^<]+)</td>\s*<td>([^<]+)</td>', html)
    print("Table rows from homepage:")
    for r in rows:
        print(r)
