"""Offline regression against real LOTBA response structure; no database writes."""
import sys
import types
import importlib.util
from datetime import datetime, timezone, timedelta
sys.modules['requests'] = types.ModuleType('requests')
sys.modules['bs4'] = types.SimpleNamespace(BeautifulSoup=None)
sys.modules['database'] = types.SimpleNamespace(get_db_connection=lambda: None)
spec = importlib.util.spec_from_file_location('scraper', 'backend/scraper_service.py')
scraper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scraper)
class Clock(datetime):
    @classmethod
    def now(cls, tz=None):
        return cls(2026, 9, 8, 16, tzinfo=timezone(timedelta(hours=-3))).astimezone(tz)
scraper.datetime = Clock
board = ''.join(f'<div class="pos">{i:02}</div><div>{5000+i:04}</div>' for i in range(1,21))
city = 'QNL51M20260908.pdf<tr><td>MATUTINA</td></tr>' + board
province = '<p>BUENOS AIRES</p>' + board
def response(text): return types.SimpleNamespace(status_code=200, text=text, content=text.encode())
scraper.requests.get = lambda *a, **kw: response('<option value=52879>Fecha: 08/09/2026 - Sorteo: 52879</option>')
scraper.requests.post = lambda *a, **kw: response(city if kw['data']['juridiccion']=='51' else province)
draws=scraper.scrape_lotba_official()
assert len(draws)==2 and all(d['shift']=='matutina' and d['source_verified'] for d in draws)
city = city.replace('20260908', '20260907')
assert scraper.scrape_lotba_official()==[]
city = city.replace('20260907', '20260908').replace('MATUTINA','NOCTURNA')
assert scraper.scrape_lotba_official()==[]
print('Scraper identity: omitted earlier options, jurisdiction, stale date and future shift passed.')
