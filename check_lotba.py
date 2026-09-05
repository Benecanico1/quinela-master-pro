import urllib.request
import urllib.parse
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Content-Type': 'application/x-www-form-urlencoded'
}

sorteos = ['52842', '52843', '52844', '52845', '52846']
for s in sorteos:
    for jur, lot in [('51', 'ciudad'), ('53', 'provincia')]:
        data = urllib.parse.urlencode({'codigo': '0080', 'juridiccion': jur, 'sorteo': s}).encode('utf-8')
        req = urllib.request.Request(
            'https://quiniela.loteriadelaciudad.gob.ar/resultadosQuiniela/consultaResultados.php',
            data=data,
            headers=headers
        )
        try:
            with urllib.request.urlopen(req, timeout=10, context=ctx) as res:
                content = res.read().decode('utf-8', errors='ignore')
                prizes = re.findall(r'class=[\'"]pos[\'"]>(\d{2})</div>\s*<div>(\d{4})</div>', content)
                if prizes:
                    print(f"Sorteo {s} - {lot}: {len(prizes)} premios. Cabeza: {prizes[0]}")
                else:
                    print(f"Sorteo {s} - {lot}: Sin extracto publicado")
        except Exception as e:
            print(f"Error {s} - {lot}: {e}")
