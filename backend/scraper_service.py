import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta
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
    soup = BeautifulSoup(html_content, 'html.parser')
    prizes = {}
    for td in soup.find_all('td'):
        txt = td.get_text(strip=True)
        m = re.match(r'^(\d{2})(\d{4})$', txt)
        if m:
            pos = int(m.group(1))
            num = m.group(2)
            if 1 <= pos <= 20 and pos not in prizes:
                prizes[pos] = num
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
        
        soup = BeautifulSoup(r_home.content, 'html.parser')
        
        sorteos_found = []
        for tr in soup.find_all('tr'):
            tds = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
            if len(tds) >= 3 and re.match(r'^\d{5}$', tds[0]):
                sorteo_id = tds[0]
                shift_raw = tds[1].lower()
                shift = detect_shift_from_text(shift_raw) or 'previa'
                sorteos_found.append((sorteo_id, shift))
                
        now_arg = datetime.now()
        date_str = now_arg.strftime("%Y-%m-%d")
        current_minutes = now_arg.hour * 60 + now_arg.minute

        SHIFT_START_MINUTES = {
            'previa': 10 * 60 + 15,    # 10:15
            'primera': 12 * 60 + 0,    # 12:00
            'matutina': 15 * 60 + 0,   # 15:00
            'vespertina': 18 * 60 + 0, # 18:00
            'nocturna': 21 * 60 + 0    # 21:00
        }
        
        for sorteo_id, shift in sorteos_found:
            # Critical Safety: Only record for today if the shift's official start time has arrived!
            shift_min = SHIFT_START_MINUTES.get(shift, 0)
            if current_minutes < shift_min:
                continue

            for jur_code, lot_name in [('51', 'ciudad'), ('53', 'provincia')]:
                try:
                    payload = {'codigo': '0080', 'juridiccion': jur_code, 'sorteo': sorteo_id}
                    r_res = requests.post(endpoint, data=payload, headers=HEADERS, timeout=8)
                    if r_res.status_code == 200:
                        board20 = parse_lotba_html(r_res.content)
                        if board20 and len(board20) == 20:
                            results.append({
                                "draw_date": date_str,
                                "lottery": lot_name,
                                "shift": shift,
                                "p1": board20[0], "p2": board20[1], "p3": board20[2], "p4": board20[3], "p5": board20[4],
                                "p6": board20[5], "p7": board20[6], "p8": board20[7], "p9": board20[8], "p10": board20[9],
                                "p11": board20[10], "p12": board20[11], "p13": board20[12], "p14": board20[13], "p15": board20[14],
                                "p16": board20[15], "p17": board20[16], "p18": board20[17], "p19": board20[18], "p20": board20[19],
                                "head_ambo": board20[0][-2:],
                                "head_centena": board20[0][-3:],
                                "head_millar": board20[0],
                                "source": f"https://quiniela.loteriadelaciudad.gob.ar/ (Sorteo #{sorteo_id})"
                            })
                            print(f"[LOTBA Oficial] {date_str} {lot_name} {shift} -> {board20[0]}")
                except Exception:
                    pass
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
    conn = get_db_connection()
    cursor = conn.cursor()
    saved = 0
    for d in draws:
        try:
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

def run_live_sync():
    print("Running Multi-Source Real Quiniela Sync Engine with LOTBA Official Source...")
    draws_lotba = scrape_lotba_official()
    draws_other = scrape_clarin_and_lanacion()
    all_draws = draws_lotba + draws_other
    saved = save_scraped_draws_to_db(all_draws)
    
    # Export full JSON
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT draw_date, lottery, shift, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, head_ambo, head_centena, head_millar FROM draws")
    all_dict = {}
    for row in cur.fetchall():
        key = f"{row[0]}_{row[1]}_{row[2]}"
        all_dict[key] = {
            "draw_date": row[0],
            "lottery": row[1],
            "shift": row[2],
            "head_millar": row[3],
            "head_centena": row[3][-3:],
            "head_ambo": row[3][-2:],
            "board": list(row[3:23])
        }
    conn.close()
    
    import json
    with open("backend/real_draws_dump.json", "w", encoding="utf-8") as f:
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
