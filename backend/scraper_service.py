import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from database import get_db_connection

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
}

def detect_shift_from_text(text: str) -> Optional[str]:
    t = text.lower()
    if 'previa' in t:
        return 'previa'
    if 'primera' in t:
        return 'primera'
    if 'matutina' in t:
        return 'matutina'
    if 'vespertina' in t:
        return 'vespertina'
    if 'nocturna' in t:
        return 'nocturna'
    return None

def detect_lottery_from_text(text: str) -> Optional[str]:
    t = text.lower()
    if 'provincia' in t or ('buenos aires' in t and 'ciudad' not in t):
        return 'provincia'
    if 'nacional' in t or 'ciudad' in t:
        return 'ciudad'
    return None

def parse_lotba_html(html_content: bytes) -> Optional[List[str]]:
    html_text = html_content.decode('utf-8', errors='ignore') if isinstance(html_content, bytes) else str(html_content)
    pos_matches = re.findall(r'<div class=["\']pos["\']>(\d{2})</div>\s*<div>(\d{4})</div>', html_text, re.IGNORECASE)
    prizes = {}
    for pos_str, num_str in pos_matches:
        pos = int(pos_str)
        if 1 <= pos <= 20 and pos not in prizes:
            prizes[pos] = num_str
    if len(prizes) == 20:
        return [prizes[i] for i in range(1, 21)]
    return None

def scrape_lotba_official() -> List[Dict[str, Any]]:
    """Scrapes official LOTBA portal (https://quiniela.loteriadelaciudad.gob.ar/)"""
    results = []
    lotba_url = 'https://quiniela.loteriadelaciudad.gob.ar/'
    endpoint = 'https://quiniela.loteriadelaciudad.gob.ar/resultadosQuiniela/consultaResultados.php'
    
    try:
        r_home = requests.get(lotba_url, headers=HEADERS, timeout=10)
        if r_home.status_code != 200:
            return results
        
        options = re.findall(r'<option[^>]*value=[\'"]?(\d{5})[\'"]?[^>]*>(.*?)</option>', r_home.text, re.IGNORECASE)
        now_arg = datetime.now(timezone(timedelta(hours=-3)))
        date_str = now_arg.strftime("%Y-%m-%d")
        today_dmy = now_arg.strftime("%d/%m/%Y")
        
        today_options = []
        for s_id, label in options:
            if today_dmy in label or date_str in label:
                today_options.append((int(s_id), label))

        # Sort ascending (chronological): previa, primera, matutina, vespertina, nocturna
        today_options.sort(key=lambda x: x[0])
        shift_names = ['previa', 'primera', 'matutina', 'vespertina', 'nocturna']
        
        for idx, (sorteo_id, label) in enumerate(today_options):
            shift = shift_names[idx] if idx < len(shift_names) else 'nocturna'
            verified_shift = None

            for jur_code, lot_name in [('51', 'ciudad'), ('53', 'provincia')]:
                try:
                    payload = {'codigo': '0080', 'juridiccion': jur_code, 'sorteo': str(sorteo_id)}
                    r_res = requests.post(endpoint, data=payload, headers=HEADERS, timeout=8)
                    if r_res.status_code == 200:
                        extract = re.search(r'QNL(51|53)([A-Z])(\d{8})\.(?:pdf|xml)', r_res.text, re.I)
                        shift_match = re.search(r'<tr>\s*<td>\s*(PREVIA|PRIMERA|MATUTINA|VESPERTINA|NOCTURNA)\s*</td>\s*</tr>', r_res.text, re.I)
                        if jur_code == '51':
                            if not extract or extract[1] != jur_code or extract[3] != now_arg.strftime('%Y%m%d') or not shift_match:
                                continue
                            verified_shift = shift_match[1].lower()
                        elif not verified_shift or not re.search(r'<p>\s*BUENOS AIRES\s*</p>', r_res.text, re.I):
                            continue
                        shift = verified_shift
                        hours = {'previa': (10, 15), 'primera': (12, 0), 'matutina': (15, 0), 'vespertina': (18, 0), 'nocturna': (21, 0)}
                        hour, minute = hours[shift]
                        if now_arg < now_arg.replace(hour=hour, minute=minute, second=0, microsecond=0):
                            continue
                        board20 = parse_lotba_html(r_res.content)
                        if board20 and len(board20) == 20:
                            results.append({
                                "draw_number": str(sorteo_id),
                                "draw_date": date_str,
                                "official_date": date_str,
                                "source_verified": True,
                                "status": "PUBLISHED",
                                "received_at": datetime.now(timezone.utc).isoformat(),
                                "lottery": lot_name,
                                "shift": shift,
                                "p1": board20[0], "p2": board20[1], "p3": board20[2], "p4": board20[3], "p5": board20[4],
                                "p6": board20[5], "p7": board20[6], "p8": board20[7], "p9": board20[8], "p10": board20[9],
                                "p11": board20[10], "p12": board20[11], "p13": board20[12], "p14": board20[13], "p15": board20[14],
                                "p16": board20[15], "p17": board20[16], "p18": board20[17], "p19": board20[18], "p20": board20[19],
                                "head_ambo": board20[0][-2:],
                                "head_centena": board20[0][-3:],
                                "head_millar": board20[0],
                                "board": board20,
                                "source": f"LOTBA_DIRECT_EXTRACT (Sorteo #{sorteo_id})"
                            })
                            print(f"[LOTBA Oficial] {date_str} {lot_name} {shift} (Sorteo #{sorteo_id}) -> Cabeza {board20[0]}")
                except Exception as e:
                    print(f"Error sorteo #{sorteo_id} {lot_name}: {e}")
    except Exception as e:
        print(f"Error scraping LOTBA: {e}")
        
    return results

def scrape_clarin_and_lanacion() -> List[Dict[str, Any]]:
    results = []
    
    # 1. Scrape Clarin Home & Section Articles
    try:
        r_cla = requests.get("https://www.clarin.com/loterias-y-quinielas/", headers=HEADERS, timeout=10)
        if r_cla.status_code == 200:
            soup_cla = BeautifulSoup(r_cla.text, 'html.parser')
            # Extract links to individual draw articles
            article_links = soup_cla.find_all('a', href=re.compile(r'quiniela.*resultado|resultado.*quiniela', re.I))
            for a in article_links:
                href = a['href']
                title = a.get_text().strip()
                full_url = href if href.startswith('http') else f"https://www.clarin.com{href}"
                lottery = detect_lottery_from_text(title) or detect_lottery_from_text(href) or "ciudad"
                shift = detect_shift_from_text(title) or detect_shift_from_text(href) or "nocturna"
                
                try:
                    r_art = requests.get(full_url, headers=HEADERS, timeout=8)
                    if r_art.status_code == 200:
                        soup_art = BeautifulSoup(r_art.text, 'html.parser')
                        
                        # Extract 4-digit numbers
                        all_li = soup_art.find_all(['li', 'td', 'p'])
                        prizes = []
                        for el in all_li:
                            txt = el.get_text().strip()
                            if re.match(r'^\d{4}$', txt) and txt not in prizes:
                                prizes.append(txt)
                                
                        if len(prizes) >= 20:
                            board20 = prizes[:20]
                            # Date
                            date_str = datetime.now().strftime("%Y-%m-%d")
                            m_date = re.search(r'(\d{2})[-_](\d{2})[-_](\d{4})', href)
                            if m_date:
                                d, m, y = m_date.groups()
                                date_str = f"{y}-{m}-{d}"
                                
                            results.append({
                                "draw_date": date_str,
                                "lottery": lottery,
                                "shift": shift,
                                "p1": board20[0], "p2": board20[1], "p3": board20[2], "p4": board20[3], "p5": board20[4],
                                "p6": board20[5], "p7": board20[6], "p8": board20[7], "p9": board20[8], "p10": board20[9],
                                "p11": board20[10], "p12": board20[11], "p13": board20[12], "p14": board20[13], "p15": board20[14],
                                "p16": board20[15], "p17": board20[16], "p18": board20[17], "p19": board20[18], "p20": board20[19],
                                "head_ambo": board20[0][-2:],
                                "head_centena": board20[0][-3:],
                                "head_millar": board20[0],
                                "source": full_url
                            })
                            print(f"[Clarin] {date_str} {lottery} {shift} -> {board20[0]}")
                except Exception as ex:
                    pass
    except Exception as e:
        print(f"Error scraping Clarin: {e}")
        
    # 2. Scrape La Nacion Quiniela Nacional Section
    try:
        r_ln = requests.get("https://www.lanacion.com.ar/loterias/quiniela-nacional/", headers=HEADERS, timeout=10)
        if r_ln.status_code == 200:
            soup_ln = BeautifulSoup(r_ln.text, 'html.parser')
            links = soup_ln.find_all('a', href=True)
            seen_urls = set()
            for a in links:
                href = a['href']
                title = a.get_text().strip()
                if 'resultados-de-la-quiniela' in href and href not in seen_urls:
                    seen_urls.add(href)
                    full_url = href if href.startswith('http') else f"https://www.lanacion.com.ar{href}"
                    shift = detect_shift_from_text(title) or detect_shift_from_text(href) or "nocturna"
                    lottery = detect_lottery_from_text(title) or "ciudad"
                    
                    try:
                        r_art = requests.get(full_url, headers=HEADERS, timeout=8)
                        if r_art.status_code == 200:
                            soup_art = BeautifulSoup(r_art.text, 'html.parser')
                            date_match = re.search(r'nid(\d{2})(\d{2})(\d{4})', full_url)
                            if date_match:
                                day, month, year = date_match.groups()
                                date_str = f"{year}-{month}-{day}"
                            else:
                                date_str = datetime.now().strftime("%Y-%m-%d")
                                
                            li_items = soup_art.find_all('li')
                            prizes = []
                            for li in li_items:
                                num_text = li.get_text().strip()
                                if re.match(r'^\d{4}$', num_text):
                                    prizes.append(num_text)
                                    
                            if len(prizes) >= 20:
                                board20 = prizes[:20]
                                results.append({
                                    "draw_date": date_str,
                                    "lottery": lottery,
                                    "shift": shift,
                                    "p1": board20[0], "p2": board20[1], "p3": board20[2], "p4": board20[3], "p5": board20[4],
                                    "p6": board20[5], "p7": board20[6], "p8": board20[7], "p9": board20[8], "p10": board20[9],
                                    "p11": board20[10], "p12": board20[11], "p13": board20[12], "p14": board20[13], "p15": board20[14],
                                    "p16": board20[15], "p17": board20[16], "p18": board20[17], "p19": board20[18], "p20": board20[19],
                                    "head_ambo": board20[0][-2:],
                                    "head_centena": board20[0][-3:],
                                    "head_millar": board20[0],
                                    "source": full_url
                                })
                                print(f"[La Nacion] {date_str} {lottery} {shift} -> {board20[0]}")
                    except Exception as ex:
                        pass
    except Exception as e:
        print(f"Error scraping La Nacion: {e}")
        
    return results

def save_scraped_draws_to_db(draws: List[Dict[str, Any]]) -> int:
    from datetime import datetime, timezone, timedelta
    ARG_TZ = timezone(timedelta(hours=-3))
    now_arg = datetime.now(ARG_TZ)
    today_str = now_arg.strftime('%Y-%m-%d')

    # Official ready times (Argentina, 15 min after draw start)
    SHIFT_READY_HOUR = {
        'previa':     (10, 30),
        'primera':    (12, 15),
        'matutina':   (15, 15),
        'vespertina': (18, 15),
        'nocturna':   (21, 15),
    }

    conn = get_db_connection()
    cursor = conn.cursor()
    saved = 0
    for d in draws:
        try:
            draw_date = d.get('draw_date', '')
            shift = d.get('shift', '').lower()

            # GUARD: Never save a shift that hasn't happened yet today
            if draw_date == today_str and shift in SHIFT_READY_HOUR:
                ready_h, ready_m = SHIFT_READY_HOUR[shift]
                now_h = now_arg.hour
                now_m = now_arg.minute
                now_total = now_h * 60 + now_m
                ready_total = ready_h * 60 + ready_m
                if now_total < ready_total:
                    print(f"[GUARD] Skipping {shift} ({draw_date}) - not ready yet (now={now_h}:{now_m:02d}, ready={ready_h}:{ready_m:02d})")
                    continue

            cursor.execute('''
                INSERT INTO draws (
                    draw_date, lottery, shift,
                    p1, p2, p3, p4, p5, p6, p7, p8, p9, p10,
                    p11, p12, p13, p14, p15, p16, p17, p18, p19, p20,
                    head_ambo, head_centena, head_millar
                ) VALUES (
                    ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?
                )
                ON CONFLICT(draw_date, lottery, shift) DO UPDATE SET
                    p1=excluded.p1, p2=excluded.p2, p3=excluded.p3, p4=excluded.p4, p5=excluded.p5,
                    p6=excluded.p6, p7=excluded.p7, p8=excluded.p8, p9=excluded.p9, p10=excluded.p10,
                    p11=excluded.p11, p12=excluded.p12, p13=excluded.p13, p14=excluded.p14, p15=excluded.p15,
                    p16=excluded.p16, p17=excluded.p17, p18=excluded.p18, p19=excluded.p19, p20=excluded.p20,
                    head_ambo=excluded.head_ambo, head_centena=excluded.head_centena, head_millar=excluded.head_millar
            ''', (
                d['draw_date'], d['lottery'], d['shift'],
                d['p1'], d['p2'], d['p3'], d['p4'], d['p5'], d['p6'], d['p7'], d['p8'], d['p9'], d['p10'],
                d['p11'], d['p12'], d['p13'], d['p14'], d['p15'], d['p16'], d['p17'], d['p18'], d['p19'], d['p20'],
                d['head_ambo'], d['head_centena'], d['head_millar']
            ))
            saved += 1
        except Exception as e:
            print(f"Error saving draw: {e}")
    conn.commit()
    conn.close()
    return saved

def scrape_jugandoonline() -> List[Dict[str, Any]]:
    """
    Fuente alternativa robusta: jugandoonline.com.ar
    Extrae los 5 turnos (Previa, Primera, Matutina, Vespertina, Nocturna)
    para Ciudad de Buenos Aires y Provincia de Buenos Aires.
    Estructura HTML simple: div.versionmovilquinielas contiene div.Num (20 números).
    """
    results = []
    date_str = datetime.now().strftime("%Y-%m-%d")

    SHIFT_URLS = {
        'previa':     'https://www.jugandoonline.com.ar/Quiniela-Previa.aspx',
        'primera':    'https://www.jugandoonline.com.ar/Quiniela-Primera.aspx',
        'matutina':   'https://www.jugandoonline.com.ar/Quiniela-Matutina.aspx',
        'vespertina': 'https://www.jugandoonline.com.ar/Quiniela-Vespertina.aspx',
        'nocturna':   'https://www.jugandoonline.com.ar/Quiniela-Nocturna.aspx',
    }
    # Texto que aparece en el título del bloque de cada lotería
    # El sitio usa "Prov. Bs. As." (con puntos) para Provincia
    LOTTERY_MAP = [
        ('Prov. Bs. As.', 'provincia'),
        ('Prov Bs As',    'provincia'),   # por si cambia el formato
        ('Provincia',     'provincia'),   # alias adicional
        ('Ciudad',        'ciudad'),
    ]

    for shift, url in SHIFT_URLS.items():
        try:
            r = requests.get(url, headers=HEADERS, timeout=12)
            if r.status_code != 200:
                print(f"[JugandoOnline] {shift}: HTTP {r.status_code}")
                continue
            soup = BeautifulSoup(r.content, 'html.parser')
            boxes = soup.find_all('div', class_='versionmovilquinielas')

            for box in boxes:
                txt = box.get_text(' ', strip=True)
                lottery = None
                for key, val in LOTTERY_MAP:
                    if key in txt:
                        lottery = val
                        break
                if lottery is None:
                    continue  # Ignorar Córdoba u otras provincias

                # Extraer los 20 números de la pizarra
                num_divs = box.find_all('div', class_='Num')
                nums = [el.get_text(strip=True) for el in num_divs]
                # Solo aceptar números de 4 dígitos; descartar "----" o vacíos
                nums = [n for n in nums if re.match(r'^\d{4}$', n)]

                if len(nums) != 20:
                    # El sorteo todavía no tiene los 20 números (turno aún no jugado)
                    print(f"[JugandoOnline] {shift} {lottery}: solo {len(nums)} nums - sorteo pendiente")
                    continue

                board20 = nums
                results.append({
                    "draw_date": date_str,
                    "lottery": lottery,
                    "shift": shift,
                    "p1":  board20[0],  "p2":  board20[1],  "p3":  board20[2],
                    "p4":  board20[3],  "p5":  board20[4],  "p6":  board20[5],
                    "p7":  board20[6],  "p8":  board20[7],  "p9":  board20[8],
                    "p10": board20[9],  "p11": board20[10], "p12": board20[11],
                    "p13": board20[12], "p14": board20[13], "p15": board20[14],
                    "p16": board20[15], "p17": board20[16], "p18": board20[17],
                    "p19": board20[18], "p20": board20[19],
                    "head_ambo":    board20[0][-2:],
                    "head_centena": board20[0][-3:],
                    "head_millar":  board20[0],
                    "board": board20,
                    "status": "PUBLISHED",
                    "source": f"JUGANDOONLINE_{shift.upper()}"
                })
                print(f"[JugandoOnline] {date_str} {lottery} {shift} -> Cabeza {board20[0]}")

        except Exception as e:
            print(f"[JugandoOnline] Error en {shift}: {e}")

    return results


def run_live_sync():

    print("Running Multi-Source Real Quiniela Sync Engine [LOTBA -> JugandoOnline -> Clarin/LaNacion]...")

    # --- Fuente 1: LOTBA Oficial ---
    draws_lotba = scrape_lotba_official()
    lotba_keys = {f"{d['draw_date']}_{d['lottery']}_{d['shift']}" for d in draws_lotba}
    print(f"[LOTBA] {len(draws_lotba)} resultados obtenidos")

    # --- Fuente 2: JugandoOnline (siempre corre como complemento) ---
    # Agrega sorteos que LOTBA no trajo (ej: aún no publicados en el dropdown o falla)
    # Secondary pages do not provide a verified date/shift identity.
    draws_jugando_raw = []
    draws_jugando = [d for d in draws_jugando_raw
                     if f"{d['draw_date']}_{d['lottery']}_{d['shift']}" not in lotba_keys]
    print(f"[JugandoOnline] {len(draws_jugando_raw)} raw, {len(draws_jugando)} nuevos (no en LOTBA)")

    combined_keys = lotba_keys | {f"{d['draw_date']}_{d['lottery']}_{d['shift']}" for d in draws_jugando}

    # --- Fuente 3: Clarín / La Nación (solo si ambas fuentes anteriores dieron 0) ---
    draws_other = []
    if False:  # Never publish undated fallback numbers as today's official results.
        draws_other = scrape_clarin_and_lanacion()
        print(f"[Clarin/LaNacion] {len(draws_other)} resultados (fallback)")

    all_draws = draws_lotba + draws_jugando + draws_other
    saved = save_scraped_draws_to_db(all_draws)
    
    # Export full JSON
    conn = get_db_connection()
    conn.row_factory = __import__('sqlite3').Row  # acceso por nombre de columna
    cur = conn.cursor()
    cur.execute("""
        SELECT draw_date, lottery, shift,
               p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,
               p11,p12,p13,p14,p15,p16,p17,p18,p19,p20,
               head_ambo, head_centena, head_millar
        FROM draws
        ORDER BY draw_date DESC
    """)
    all_dict = {}
    for row in cur.fetchall():
        key = f"{row['draw_date']}_{row['lottery']}_{row['shift']}"
        board = [row[f'p{i}'] for i in range(1, 21)]
        all_dict[key] = {
            "draw_date":    row['draw_date'],
            "lottery":      row['lottery'],
            "shift":        row['shift'],
            "head_millar":  row['head_millar'],
            "head_centena": row['head_centena'],
            "head_ambo":    row['head_ambo'],
            "board":        board,
            "status":       "PUBLISHED",
        }
    conn.close()

    # Preserve independently verified extracts across runs; SQLite's legacy
    # columns do not retain the official identity and provenance metadata.
    import json
    from pathlib import Path
    dump_path = Path(__file__).resolve().parent / 'real_draws_dump.json'
    try:
        previous = json.loads(dump_path.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        previous = {}
    for key, draw in previous.items():
        if draw.get('source_verified') is True and draw.get('draw_number') and draw.get('official_date') and draw.get('received_at'):
            all_dict[key] = draw
    for draw in draws_lotba:
        all_dict[f"{draw['draw_date']}_{draw['lottery']}_{draw['shift']}"] = draw
    
    import json
    with open(dump_path, "w", encoding="utf-8") as f:
        json.dump(all_dict, f, indent=2)
        
    try:
        with open("../ingenieriajh-portal/public/api/draws.json", "w", encoding="utf-8") as f:
            json.dump(all_dict, f, indent=2)
    except Exception:
        pass
        
    print(f"Total live draws extracted: {len(all_draws)}, Saved to SQLite & JSON: {saved}, Total in repository: {len(all_dict)}")
    return {
        "status": "success",
        "total_extracted": len(all_draws),
        "total_saved": saved,
        "total_repository": len(all_dict)
    }

if __name__ == "__main__":
    run_live_sync()
