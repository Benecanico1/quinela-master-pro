const fs = require('fs');

const auth_code = `import sqlite3
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from database import get_db_connection, hash_password

def compute_user_vip_status(user: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.now()
    
    # Parse trial_end
    trial_end = datetime.strptime(user["trial_end"], "%Y-%m-%d %H:%M:%S")
    vip_until = None
    if user.get("vip_until"):
        try:
            vip_until = datetime.strptime(user["vip_until"], "%Y-%m-%d %H:%M:%S")
        except Exception:
            vip_until = None

    trial_active = now < trial_end
    trial_days_left = max(0, (trial_end - now).days + 1) if trial_active else 0
    
    vip_active = (vip_until is not None and now < vip_until)
    vip_days_left = max(0, (vip_until - now).days + 1) if vip_active else 0

    is_vip = trial_active or vip_active or user.get("role") == "admin"
    
    tier = "ADMIN" if user.get("role") == "admin" else ("VIP_TRIAL" if trial_active else ("VIP_ACTIVE" if vip_active else "FREE"))

    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "is_vip": is_vip,
        "tier": tier,
        "trial_active": trial_active,
        "trial_days_left": trial_days_left,
        "vip_active": vip_active,
        "vip_days_left": vip_days_left,
        "vip_until": user.get("vip_until")
    }

def register_user(name: str, email: str, password: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    email_clean = email.strip().lower()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email_clean,))
    if cursor.fetchone():
        conn.close()
        return {"error": "El correo ya se encuentra registrado"}

    now = datetime.now()
    trial_end = now + timedelta(days=15)
    now_str = now.strftime("%Y-%m-%d %H:%M:%S")
    trial_end_str = trial_end.strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute('''
        INSERT INTO users (name, email, password_hash, role, trial_start, trial_end, vip_until, created_at)
        VALUES (?, ?, ?, 'user', ?, ?, ?, ?)
    ''', (
        name.strip(),
        email_clean,
        hash_password(password),
        now_str,
        trial_end_str,
        trial_end_str,
        now_str
    ))
    conn.commit()
    
    user_id = cursor.lastrowid
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = dict(cursor.fetchone())
    conn.close()

    return compute_user_vip_status(user)

def login_user(email: str, password: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    email_clean = email.strip().lower()
    p_hash = hash_password(password)

    cursor.execute("SELECT * FROM users WHERE email = ? AND password_hash = ?", (email_clean, p_hash))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {"error": "Credenciales inválidas"}

    return compute_user_vip_status(dict(row))

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    return compute_user_vip_status(dict(row))
`;

const admin_code = `import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from database import get_db_connection
from auth_engine import compute_user_vip_status

def list_all_users() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [compute_user_vip_status(dict(r)) for r in rows]

def grant_vip_days(user_id: int, days: int) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"error": "Usuario no encontrado"}

    user = dict(row)
    now = datetime.now()
    
    current_vip = None
    if user.get("vip_until"):
        try:
            current_vip = datetime.strptime(user["vip_until"], "%Y-%m-%d %H:%M:%S")
        except Exception:
            current_vip = None

    base_date = current_vip if (current_vip and current_vip > now) else now
    new_vip = base_date + timedelta(days=days)
    new_vip_str = new_vip.strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("UPDATE users SET vip_until = ? WHERE id = ?", (new_vip_str, user_id))
    conn.commit()
    
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    updated_user = dict(cursor.fetchone())
    conn.close()

    return compute_user_vip_status(updated_user)

def list_payments() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM payments ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_payment_proof(user_email: str, user_name: str, amount: float, proof_details: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('''
        INSERT INTO payments (user_email, user_name, amount, proof_details, status, created_at)
        VALUES (?, ?, ?, ?, 'pending', ?)
    ''', (user_email.strip().lower(), user_name.strip(), amount, proof_details.strip(), now_str))
    conn.commit()
    p_id = cursor.lastrowid
    conn.close()
    return {"status": "submitted", "payment_id": p_id}

def review_payment(payment_id: int, action: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM payments WHERE id = ?", (payment_id,))
    p_row = cursor.fetchone()
    if not p_row:
        conn.close()
        return {"error": "Comprobante no encontrado"}

    payment = dict(p_row)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_status = "approved" if action == "approve" else "rejected"

    cursor.execute("UPDATE payments SET status = ?, reviewed_at = ? WHERE id = ?", (new_status, now_str, payment_id))

    # If approved, automatically add 30 days of VIP to the user
    if action == "approve":
        cursor.execute("SELECT id FROM users WHERE email = ?", (payment["user_email"],))
        u_row = cursor.fetchone()
        if u_row:
            user_id = u_row["id"]
            grant_vip_days(user_id, 30)

    conn.commit()
    conn.close()
    return {"status": new_status, "payment_id": payment_id}

def get_active_popup_promo() -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM popup_promos WHERE is_active = 1 ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_popup_promo(promo_data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute('''
        INSERT INTO popup_promos (title, subtitle, badge, discount_text, button_text, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        promo_data.get("title", "¡OFERTA VIP!"),
        promo_data.get("subtitle", "Accede a las herramientas de predicción profesional."),
        promo_data.get("badge", "EXCLUSIVO"),
        promo_data.get("discount_text", "$5 USD / mes"),
        promo_data.get("button_text", "OBTENER VIP AHORA"),
        1 if promo_data.get("is_active", True) else 0,
        now_str
    ))
    conn.commit()
    conn.close()
    return {"status": "updated"}

def get_system_settings() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM system_settings ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {
            "alias": "quiniela.vip.mp",
            "cbu": "0000003100012345678901",
            "titular": "Jesús Hidalgo",
            "bank_name": "Mercado Pago",
            "whatsapp_number": "+5491123456789",
            "price_usd": 5.0,
            "price_ars": 5500.0,
            "instructions": "Transfiere el monto a nuestro Alias o CBU y envíanos el comprobante."
        }
    return dict(row)

def update_system_settings(settings: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO system_settings (alias, cbu, titular, bank_name, whatsapp_number, price_usd, price_ars, instructions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        settings.get("alias", "quiniela.vip.mp"),
        settings.get("cbu", "0000003100012345678901"),
        settings.get("titular", "Jesús Hidalgo"),
        settings.get("bank_name", "Mercado Pago"),
        settings.get("whatsapp_number", "+5491123456789"),
        float(settings.get("price_usd", 5.0)),
        float(settings.get("price_ars", 5500.0)),
        settings.get("instructions", "")
    ))
    conn.commit()
    conn.close()
    return {"status": "updated"}
`;

fs.writeFileSync('auth_engine.py', auth_code, 'utf8');
fs.writeFileSync('admin_engine.py', admin_code, 'utf8');
console.log('auth_engine.py and admin_engine.py successfully created!');
