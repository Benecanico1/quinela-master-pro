import json
from typing import Dict, Any, List

OFFICIAL_PAYOUT_TABLE = {
    "cabeza": 70.0,         # Paga 70 veces por ambo a la cabeza
    "top5": 14.0,           # Paga 14 veces si acierta dentro de los 5
    "top10": 7.0,           # Paga 7 veces si acierta dentro de los 10
    "top20": 3.5            # Paga 3.5 veces si acierta dentro de los 20
}

def simulate_economic_performance(
    hits_data: Dict[str, List[bool]],
    stake_per_bet: float = 100.0,
    bet_type: str = "top20_board", # "cabeza" | "top20_board"
    top_n_played: int = 5
) -> Dict[str, Any]:
    """
    Simula el rendimiento económico hipotético sobre una serie histórica de sorteos.
    """
    total_draws = len(hits_data["head"])
    if total_draws == 0:
        return {}

    cost_per_draw = stake_per_bet * (1 if bet_type == "cabeza" else top_n_played)
    total_cost = cost_per_draw * total_draws

    multiplier = OFFICIAL_PAYOUT_TABLE["cabeza"] if bet_type == "cabeza" else OFFICIAL_PAYOUT_TABLE["top20"]

    # Calcular premios según aciertos
    if bet_type == "cabeza":
        total_hits = sum(hits_data["head"])
    else:
        total_hits = sum(hits_data["top20"])

    gross_return = total_hits * (stake_per_bet * multiplier)
    net_balance = gross_return - total_cost
    roi_pct = round((net_balance / total_cost) * 100.0, 2) if total_cost > 0 else 0.0

    return {
        "bet_type": bet_type,
        "stake_per_bet": stake_per_bet,
        "numbers_played_per_draw": 1 if bet_type == "cabeza" else top_n_played,
        "total_draws": total_draws,
        "total_cost": round(total_cost, 2),
        "total_hits": total_hits,
        "hit_rate_pct": round((total_hits / total_draws) * 100.0, 2),
        "gross_return": round(gross_return, 2),
        "net_balance": round(net_balance, 2),
        "roi_pct": roi_pct,
        "payout_multiplier": multiplier,
        "disclaimer": "Simulación histórica retrospectiva con propósitos exclusivamente analíticos. No representa ganancias futuras ni garantiza rentabilidad. En los juegos de azar el margen de la casa siempre genera un valor esperado negativo en el largo plazo."
    }

if __name__ == "__main__":
    results_path = "./backend/ml_pipeline/four_systems_results.json"
    with open(results_path, "r", encoding="utf-8") as f:
        res = json.load(f)

    print("=== SIMULADOR DE RENDIMIENTO ECONÓMICO (400 Sorteos, $100 por ambo) ===")
    for sys in res["summary"]:
        # Simulación a la pizarra Top 20 jugando los 5 números
        # Para cada sistema calculamos con sus aciertos reportados
        hits_count = sys["board_top20_hits"]
        draws_count = res["total_eval_draws"]
        mock_hits = {"head": [False]*draws_count, "top20": [True]*hits_count + [False]*(draws_count - hits_count)}
        sim = simulate_economic_performance(mock_hits, stake_per_bet=100.0, bet_type="top20_board", top_n_played=5)
        print(f"  * {sys['name']}: Costo=${sim['total_cost']} | Retorno=${sim['gross_return']} | Balance=${sim['net_balance']} | ROI={sim['roi_pct']}%")
