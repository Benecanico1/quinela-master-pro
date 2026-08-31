const fs = require('fs');

const db_code = `import sqlite3
import os
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "quiniela.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Draws table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS draws (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            draw_date TEXT NOT NULL,
            lottery TEXT NOT NULL,
            shift TEXT NOT NULL,
            p1 TEXT NOT NULL,
            p2 TEXT NOT NULL,
            p3 TEXT NOT NULL,
            p4 TEXT NOT NULL,
            p5 TEXT NOT NULL,
            p6 TEXT NOT NULL,
            p7 TEXT NOT NULL,
            p8 TEXT NOT NULL,
            p9 TEXT NOT NULL,
            p10 TEXT NOT NULL,
            p11 TEXT NOT NULL,
            p12 TEXT NOT NULL,
            p13 TEXT NOT NULL,
            p14 TEXT NOT NULL,
            p15 TEXT NOT NULL,
            p16 TEXT NOT NULL,
            p17 TEXT NOT NULL,
            p18 TEXT NOT NULL,
            p19 TEXT NOT NULL,
            p20 TEXT NOT NULL,
            head_ambo TEXT NOT NULL,
            head_centena TEXT NOT NULL,
            head_millar TEXT NOT NULL,
            UNIQUE(draw_date, lottery, shift)
        )
    ''')
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_draw_date ON draws(draw_date);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_lottery_shift ON draws(lottery, shift);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_head_ambo ON draws(head_ambo);")

    # 2. Users table (Trial 15 days + VIP)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user', -- 'admin' or 'user'
            trial_start TEXT NOT NULL,
            trial_end TEXT NOT NULL,
            vip_until TEXT,
            created_at TEXT NOT NULL
        )
    ''')

    # 3. Payments / Proofs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            user_name TEXT NOT NULL,
            amount REAL NOT NULL,
            payment_method TEXT NOT NULL DEFAULT 'mercadopago',
            proof_details TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
            created_at TEXT NOT NULL,
            reviewed_at TEXT
        )
    ''')

    # 4. Promotions / Pop-up table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS popup_promos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            subtitle TEXT NOT NULL,
            badge TEXT NOT NULL,
            discount_text TEXT NOT NULL,
            button_text TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        )
    ''')

    # 5. System Settings (CBU, Alias, WhatsApp, Prices)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS system_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            alias TEXT NOT NULL,
            cbu TEXT NOT NULL,
            titular TEXT NOT NULL,
            bank_name TEXT NOT NULL,
            whatsapp_number TEXT NOT NULL,
            price_usd REAL NOT NULL,
            price_ars REAL NOT NULL,
            instructions TEXT NOT NULL
        )
    ''')

    # Seed Admin User if not exists
    cursor.execute("SELECT * FROM users WHERE email = 'jesushidalgo25@gmail.com'")
    admin = cursor.fetchone()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    far_future = (datetime.now() + timedelta(days=3650)).strftime("%Y-%m-%d %H:%M:%S")
    
    if not admin:
        cursor.execute('''
            INSERT INTO users (email, password_hash, name, role, trial_start, trial_end, vip_until, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'jesushidalgo25@gmail.com',
            hash_password('admin1234'),
            'Jesús Hidalgo (Admin)',
            'admin',
            now_str,
            far_future,
            far_future,
            now_str
        ))
        print("Admin user seeded: jesushidalgo25@gmail.com / admin1234")

    # Seed Default Promo Popup if empty
    cursor.execute("SELECT COUNT(*) as count FROM popup_promos")
    if cursor.fetchone()["count"] == 0:
        cursor.execute('''
            INSERT INTO popup_promos (title, subtitle, badge, discount_text, button_text, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, 1, ?)
        ''', (
            '🔥 ¡OFERTA LANZAMIENTO VIP!',
            'Desbloquea Pronósticos AI, Calculadora de Bankroll y Redoblonas Candado por 30 días.',
            'OFERTA LIMITADA',
            'Solo $5 USD / mes (o $5.500 ARS vía Mercado Pago)',
            'ACTIVAR MI MES VIP AHORA',
            now_str
        ))

    # Seed Default System Settings if empty
    cursor.execute("SELECT COUNT(*) as count FROM system_settings")
    if cursor.fetchone()["count"] == 0:
        cursor.execute('''
            INSERT INTO system_settings (alias, cbu, titular, bank_name, whatsapp_number, price_usd, price_ars, instructions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'quiniela.vip.mp',
            '0000003100012345678901',
            'Jesús Hidalgo',
            'Mercado Pago / Banco',
            '+5491123456789',
            5.0,
            5500.0,
            'Transfiere el monto a nuestro Alias o CBU de Mercado Pago, envíanos el comprobante de pago vía WhatsApp o súbelo en esta ventana y te activaremos tu mes VIP al instante.'
        ))

    conn.commit()
    conn.close()

def insert_draw(draw: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    p1 = str(draw["p1"]).zfill(4)
    head_ambo = p1[-2:]
    head_centena = p1[-3:]
    head_millar = p1
    positions = [str(draw.get(f"p{i}", "0000")).zfill(4) for i in range(1, 21)]
    
    cursor.execute('''
        INSERT OR REPLACE INTO draws (
            draw_date, lottery, shift,
            p1, p2, p3, p4, p5, p6, p7, p8, p9, p10,
            p11, p12, p13, p14, p15, p16, p17, p18, p19, p20,
            head_ambo, head_centena, head_millar
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        draw["draw_date"], draw["lottery"].lower(), draw["shift"].lower(),
        *positions,
        head_ambo, head_centena, head_millar
    ))
    conn.commit()
    conn.close()

def get_all_draws(lottery: Optional[str] = None, shift: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM draws WHERE 1=1"
    params = []
    if lottery and lottery != "all":
        query += " AND lottery = ?"
        params.append(lottery.lower())
    if shift and shift != "all":
        query += " AND shift = ?"
        params.append(shift.lower())
    if start_date:
        query += " AND draw_date >= ?"
        params.append(start_date)
    if end_date:
        query += " AND draw_date <= ?"
        params.append(end_date)
    query += " ORDER BY draw_date ASC, id ASC"
    if limit:
        query += f" LIMIT {limit}"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_draw_count() -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM draws")
    count = cursor.fetchone()["count"]
    conn.close()
    return count
`;

fs.writeFileSync('database.py', db_code, 'utf8');
console.log('database.py successfully updated with users, payments, promos, and settings tables!');
