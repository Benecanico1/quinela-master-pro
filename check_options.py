import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
req = urllib.request.Request('https://quiniela.loteriadelaciudad.gob.ar/', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10, context=ctx) as res:
    html = res.read().decode('utf-8', errors='ignore')
    options = re.findall(r'<option\s+value=[\'"]?(\d+)[\'"]?>Fecha:\s*([^<]+)</option>', html)
    print("Total options found:", len(options))
    for opt in options[:20]:
        print(opt)
