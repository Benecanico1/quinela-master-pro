import sqlite3
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
