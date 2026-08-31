from fastapi import FastAPI, Query, HTTPException, Body, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Optional, List, Dict, Any
import os
import uvicorn

from database import init_db, get_all_draws, get_draw_count
from seed_data import generate_quiniela_draws_2026, SIGNIFICADOS_QUINIELA
from stats_engine import compute_frequency_and_delays
from pattern_engine import analyze_patterns, analyze_cross_lottery
from markov_model import compute_markov_transitions
from predictor import calculate_composite_predictions, run_backtesting
from expert_engine import search_dreams, get_sympathy_and_attractions, simulate_bankroll_progression, verify_ticket_payout
from auth_engine import register_user, login_user, get_user_by_email
from admin_engine import (
    list_all_users, grant_vip_days, list_payments, create_payment_proof,
    review_payment, get_active_popup_promo, update_popup_promo,
    get_system_settings, update_system_settings
)

app = FastAPI(
    title="Quiniela Master Suite Pro - Argentina",
    description="Plataforma profesional con sistema VIP/Free, Periodo de Prueba de 15 Días, Pagos Mercado Pago y Panel de Administración.",
    version="4.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    generate_quiniela_draws_2026()

# --- AUTH & USER MANAGEMENT ---

@app.post("/api/auth/register")
def post_register(payload: Dict[str, Any] = Body(...)):
    name = payload.get("name", "")
    email = payload.get("email", "")
    password = payload.get("password", "")
    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Todos los campos son requeridos")
    res = register_user(name, email, password)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@app.post("/api/auth/login")
def post_login(payload: Dict[str, Any] = Body(...)):
    email = payload.get("email", "")
    password = payload.get("password", "")
    res = login_user(email, password)
    if "error" in res:
        raise HTTPException(status_code=401, detail=res["error"])
    return res

@app.get("/api/auth/status")
def get_status(email: str = Query(...)):
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

# --- PUBLIC PAYMENT INFO & PROMOS ---

@app.get("/api/public/promo-popup")
def get_promo():
    return get_active_popup_promo()

@app.get("/api/public/payment-info")
def get_payment_info():
    return get_system_settings()

@app.post("/api/payments/submit-proof")
def post_payment_proof(payload: Dict[str, Any] = Body(...)):
    email = payload.get("email", "")
    name = payload.get("name", "")
    amount = float(payload.get("amount", 5500.0))
    proof = payload.get("proof_details", "")
    if not email or not proof:
        raise HTTPException(status_code=400, detail="Faltan datos del comprobante")
    return create_payment_proof(email, name, amount, proof)

# --- ADMIN PANEL ENDPOINTS (Sole Admin: jesushidalgo25@gmail.com) ---

def verify_admin(admin_email: str):
    if admin_email.strip().lower() != "jesushidalgo25@gmail.com":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo el administrador principal puede realizar esta acción.")

@app.get("/api/admin/users")
def get_admin_users(admin_email: str = Query(...)):
    verify_admin(admin_email)
    return list_all_users()

@app.post("/api/admin/users/grant-vip")
def post_grant_vip(payload: Dict[str, Any] = Body(...)):
    admin_email = payload.get("admin_email", "")
    verify_admin(admin_email)
    user_id = int(payload.get("user_id", 0))
    days = int(payload.get("days", 30))
    return grant_vip_days(user_id, days)

@app.get("/api/admin/payments")
def get_admin_payments(admin_email: str = Query(...)):
    verify_admin(admin_email)
    return list_payments()

@app.post("/api/admin/payments/review")
def post_review_payment(payload: Dict[str, Any] = Body(...)):
    admin_email = payload.get("admin_email", "")
    verify_admin(admin_email)
    payment_id = int(payload.get("payment_id", 0))
    action = payload.get("action", "approve") # 'approve' or 'reject'
    return review_payment(payment_id, action)

@app.post("/api/admin/promo-popup")
def post_update_promo(payload: Dict[str, Any] = Body(...)):
    admin_email = payload.get("admin_email", "")
    verify_admin(admin_email)
    return update_popup_promo(payload)

@app.post("/api/admin/settings")
def post_update_settings(payload: Dict[str, Any] = Body(...)):
    admin_email = payload.get("admin_email", "")
    verify_admin(admin_email)
    return update_system_settings(payload)

# --- CORE ANALYTICAL ENDPOINTS ---

@app.get("/api/info")
def read_info():
    return {
        "app": "Quiniela Master Suite Pro",
        "status": "online",
        "total_draws": get_draw_count(),
        "lotteries": ["ciudad", "provincia"],
        "shifts": ["previa", "primera", "matutina", "vespertina", "nocturna"]
    }

@app.get("/api/draws")
def get_draws(
    lottery: Optional[str] = Query("all"),
    shift: Optional[str] = Query("all"),
    limit: Optional[int] = Query(50)
):
    draws = get_all_draws(lottery=lottery, shift=shift, limit=limit)
    return {"total": len(draws), "draws": draws}

@app.get("/api/stats/frequencies")
def get_frequencies(
    lottery: Optional[str] = Query("all"),
    shift: Optional[str] = Query("all"),
    target: Optional[str] = Query("head")
):
    return compute_frequency_and_delays(lottery=lottery, shift=shift, target=target)

@app.get("/api/patterns")
def get_patterns(
    lottery: Optional[str] = Query("all"),
    shift: Optional[str] = Query("all")
):
    return analyze_patterns(lottery=lottery, shift=shift)

@app.get("/api/patterns/cross")
def get_cross_analysis():
    return analyze_cross_lottery()

@app.get("/api/markov")
def get_markov(
    lottery: Optional[str] = Query("all"),
    shift: Optional[str] = Query("all")
):
    return compute_markov_transitions(lottery=lottery, shift=shift)

@app.get("/api/predictions")
def get_predictions(
    lottery: Optional[str] = Query("all"),
    shift: Optional[str] = Query("all"),
    top_k: Optional[int] = Query(15)
):
    return calculate_composite_predictions(lottery=lottery, shift=shift, top_k=top_k)

@app.get("/api/backtest")
def get_backtest(
    lottery: Optional[str] = Query("all"),
    shift: Optional[str] = Query("all"),
    draws_count: Optional[int] = Query(50)
):
    return run_backtesting(lottery=lottery, shift=shift, test_draws_count=draws_count)

@app.get("/api/dreams/search")
def get_dreams_search(
    q: str = Query(..., description="Texto del sueño del usuario"),
    lottery: Optional[str] = Query("all"),
    shift: Optional[str] = Query("all")
):
    return search_dreams(query=q, lottery=lottery, shift=shift)

@app.get("/api/sympathetic")
def get_sympathetic(
    number: Optional[str] = Query(None)
):
    return get_sympathy_and_attractions(last_head_ambo=number)

@app.get("/api/bankroll/simulate")
def get_bankroll_simulation(
    base_bet: float = Query(100.0),
    turns: int = Query(5),
    strategy: str = Query("martingale"),
    target_profit: float = Query(5000.0),
    bet_type: str = Query("ambo_cabeza")
):
    return simulate_bankroll_progression(
        base_bet=base_bet,
        turns=turns,
        strategy=strategy,
        target_profit=target_profit,
        bet_type=bet_type
    )

@app.post("/api/tickets/verify")
def post_verify_ticket(payload: Dict[str, Any] = Body(...)):
    draw_date = payload.get("draw_date", "2026-08-18")
    lottery = payload.get("lottery", "ciudad")
    shift = payload.get("shift", "nocturna")
    items = payload.get("items", [])
    return verify_ticket_payout(draw_date=draw_date, lottery=lottery, shift=shift, items=items)

@app.get("/api/meanings")
def get_meanings():
    return {"meanings": SIGNIFICADOS_QUINIELA}

# Mount Frontend static files
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
