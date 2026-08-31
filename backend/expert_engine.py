import re
from typing import List, Dict, Any, Optional
from seed_data import SIGNIFICADOS_QUINIELA
from database import get_all_draws
from predictor import calculate_composite_predictions

DREAM_DICTIONARY = {
    "00": ["huevos", "ovnis", "plato", "redondo", "nada", "cero", "hueco", "vacio", "pelota"],
    "01": ["agua", "mar", "rio", "lluvia", "lago", "vaso", "nadar", "pileta", "pescar", "ola"],
    "02": ["nino", "bebe", "hijo", "chico", "cuna", "juguete", "infancia", "chupete", "bautismo"],
    "03": ["san cono", "santo", "milagro", "rezar", "vela", "bendicion", "iglesia", "capilla"],
    "04": ["cama", "dormir", "sabanas", "almohada", "descanso", "hotel", "dormitorio", "sueno"],
    "05": ["gato", "felino", "maullido", "ronroneo", "mascota", "garra", "techos", "siames"],
    "06": ["perro", "ladrar", "cachorro", "morder", "mascota", "lealtad", "collar", "can"],
    "07": ["revolver", "pistola", "arma", "disparo", "bala", "policia", "ladron", "tiro"],
    "08": ["incendio", "fuego", "llamas", "cenizas", "humo", "quemar", "bomberos", "calor"],
    "09": ["arroyo", "vertiente", "puente", "cascada", "campo", "rio chico", "orilla"],
    "10": ["leche", "vaca", "desayuno", "botella", "blanco", "queso", "manteca", "merienda"],
    "11": ["minero", "cueva", "mina", "carbon", "oro", "pala", "piqueta", "tunel", "subsuelo"],
    "12": ["soldado", "ejercito", "guerra", "uniforme", "militar", "combate", "bandera", "fusil"],
    "13": ["yeta", "mala suerte", "gato negro", "bruja", "maldicion", "romper espejo", "viernes 13"],
    "14": ["borracho", "vino", "cerveza", "alcohol", "fiesta", "ebrio", "bar", "copa", "brindis"],
    "15": ["nina bonita", "quinceanera", "vestido", "chica", "fiesta de 15", "corona", "baile"],
    "16": ["anillo", "joya", "compromiso", "alianza", "oro", "diamante", "regalo", "casamiento"],
    "17": ["desgracia", "accidente", "choque", "tragedia", "caida", "dolor", "perdida", "ambulancia"],
    "18": ["sangre", "herida", "corte", "vampiro", "rojo", "operacion", "inyeccion", "accidente"],
    "19": ["pescado", "pez", "mar", "red", "pescador", "anzuelo", "acuario", "espina"],
    "20": ["fiesta", "baile", "musica", "cumpleanos", "festejo", "globos", "torta", "reunion"],
    "21": ["mujer", "femenina", "senora", "dama", "esposa", "novia", "madre", "amiga"],
    "22": ["loco", "locura", "manicomio", "grito", "risa", "descontrol", "payasada"],
    "23": ["cocinero", "comida", "chef", "olla", "sarten", "restaurante", "receta", "almuerzo"],
    "24": ["caballo", "carrera", "hipodromo", "jockey", "galope", "campo", "establo", "carreta", "auto"],
    "25": ["gallina", "huevo", "plumas", "granja", "gallo", "corral", "nido", "pollo"],
    "26": ["misa", "iglesia", "cura", "rezo", "comunion", "altar", "catedral", "biblia"],
    "27": ["peine", "pelo", "cabello", "peluqueria", "peinado", "espejo", "cepillo"],
    "28": ["cerro", "montana", "cordillera", "cumbre", "escalar", "roca", "nieve", "paisaje"],
    "29": ["san pedro", "llaves", "cielo", "paraiso", "puerta", "apostol", "pescador"],
    "30": ["santa rosa", "tormenta", "viento", "temporal", "santa", "trueno", "relampago"],
    "31": ["luz", "lampara", "foco", "sol", "brillo", "iluminacion", "claridad", "amanecer"],
    "32": ["dinero", "billetes", "plata", "pesos", "dolares", "banco", "riqueza", "tesoro", "premio"],
    "33": ["cristo", "cruz", "jesus", "religion", "redencion", "calvario", "semana santa"],
    "34": ["cabeza", "cerebro", "pensar", "dolor de cabeza", "sombrero", "corona", "rostro"],
    "35": ["pajarito", "pajaro", "volar", "nido", "plumas", "canto", "jaula", "paloma"],
    "36": ["manteca", "pan", "grasa", "untable", "desayuno", "comida"],
    "37": ["dentista", "diente", "muela", "dolor de muelas", "boca", "sonrisa", "ortodoncia"],
    "38": ["aceite", "motor", "fritura", "auto", "mecanico", "botella", "lubricante"],
    "39": ["lluvia", "paraguas", "charco", "gotas", "nube", "impermeable", "inundacion"],
    "40": ["cura", "sacerdote", "sotana", "iglesia", "bautismo", "confesion", "altar"],
    "41": ["cucho", "cuchillo", "facon", "punal", "asado", "cortar", "navaja"],
    "42": ["zapatilla", "zapato", "calzado", "correr", "zapatos", "cordones", "botas"],
    "43": ["balcon", "ventana", "edificio", "altura", "vista", "terraza", "asomarse"],
    "44": ["carcel", "prision", "preso", "rejas", "celda", "guardia", "esposas", "cadena"],
    "45": ["vino", "tinto", "blanco", "botella", "bodega", "uva", "copa", "brindis"],
    "46": ["tomates", "verdura", "ensalada", "rojo", "huerta", "planta"],
    "47": ["muerto", "fantasma", "cementerio", "feretro", "ataud", "velorio", "tumba", "entierro"],
    "48": ["muerto habla", "aparicion", "espiritu", "voz", "mensaje del mas alla", "sueno con difunto"],
    "49": ["carne", "asado", "carniceria", "vaca", "parrilla", "bife", "cuchillo"],
    "50": ["pan", "panaderia", "facturas", "medialunas", "harina", "horno", "alimento"],
    "51": ["serrucho", "carpintero", "madera", "herramienta", "cortar arbol", "taller"],
    "52": ["madre", "mama", "maternidad", "hijo", "abrazo", "familia", "anciana", "abuela"],
    "53": ["barco", "navegar", "mar", "barco pirata", "crucero", "puerto", "vela", "lancha"],
    "54": ["vaca", "toro", "leche", "campo", "pasto", "ternero", "cuernos"],
    "55": ["musica", "cancion", "guitarra", "piano", "concierto", "cantar", "auriculares"],
    "56": ["caida", "tropezar", "resbalar", "pozo", "abismo", "golpe", "escalera"],
    "57": ["jorobado", "espalda", "deforme", "campanero", "notre dame"],
    "58": ["ahogado", "agua profunda", "salvavidas", "hundirse", "asfixia", "rio"],
    "59": ["plantas", "jardin", "flores", "maceta", "hojas", "arboles", "naturaleza"],
    "60": ["virgen", "manto", "rezo", "gruta", "lujan", "milagro", "santeria"],
    "61": ["escopeta", "caza", "cazador", "tiro", "arma larga", "monte"],
    "62": ["inundacion", "agua desbordada", "rio crecido", "temporal", "evacuacion"],
    "63": ["casamiento", "boda", "novios", "alianzas", "fiesta", "torta de bodas", "iglesia"],
    "64": ["llanto", "lagrimas", "tristeza", "llorar", "dolor", "pena", "desconsuelo"],
    "65": ["cazador", "selva", "bosque", "presa", "trampa", "escopeta"],
    "66": ["lombrices", "gusanos", "tierra", "pesca", "bichos", "repugnancia"],
    "67": ["mordida", "dientes", "perro muerde", "vibora muerde", "ataque", "herida"],
    "68": ["sobrinos", "tios", "familia", "jovenes", "parientes", "visita"],
    "69": ["deuda", "pagar", "facturas", "cobrador", "dinero que falta", "embargo"],
    "70": ["muerto sueno", "dormir con muerto", "pesadilla", "difunto tranquilo"],
    "71": ["excremento", "bosta", "suciedad", "caca", "dinero inesperado", "inodoro"],
    "72": ["sorpresa", "regalo", "asombro", "fiesta sorpresa", "noticia inesperada"],
    "73": ["hospital", "medico", "enfermera", "cama de hospital", "cirugia", "clinica"],
    "74": ["gente negra", "africano", "noche oscura", "sombras", "baile candombe"],
    "75": ["payaso", "circo", "nariz roja", "risa", "disfraz", "maquillaje"],
    "76": ["llamas", "fuego intenso", "antorcha", "fogata", "volcan"],
    "77": ["pierna mujer", "medias", "tacones", "baile", "belleza", "piernas"],
    "78": ["ramera", "cabaret", "noche", "seduccion", "prostituta", "tentacion"],
    "79": ["ladron", "robo", "asalto", "delincuente", "bolso robado", "persecucion"],
    "80": ["bocha", "bochas", "juego", "club", "bola", "cancha de bochas"],
    "81": ["flores", "rosas", "ramo", "primavera", "jardin", "perfume", "floreria"],
    "82": ["pelea", "discusion", "golpes", "boxeo", "gritos", "ring", "enemigo"],
    "83": ["mal tiempo", "viento fuerte", "granizo", "cielo negro", "tormenta fea"],
    "84": ["iglesia", "templo", "campanario", "catedral", "cruz", "santuario"],
    "85": ["linterna", "luz en la oscuridad", "buscar", "foco", "bateria", "explorar"],
    "86": ["humo", "chimenea", "niebla", "asado humo", "tabaco", "cigarrillo"],
    "87": ["piojos", "picazon", "cabeza con piojos", "peine fino", "liendres"],
    "88": ["papa", "vaticano", "roma", "santo padre", "bendicion papal", "obispo"],
    "89": ["rata", "raton", "roedor", "alcantarilla", "queso", "miedo a ratas"],
    "90": ["miedo", "terror", "pesadilla", "temblor", "susto", "fantasma", "oscuridad"],
    "91": ["excusado", "bano", "inodoro", "letrina", "papel higienico"],
    "92": ["medico", "doctor", "estetoscopio", "receta", "consulta", "guardia"],
    "93": ["enamorado", "pareja", "beso", "amor", "corazon", "declaracion", "romance"],
    "94": ["cementerio", "lapida", "panteon", "flores en tumba", "noche en cementerio"],
    "95": ["anteojos", "lentes", "gafas", "optica", "ver claro", "lectura"],
    "96": ["marido", "esposo", "pareja", "casado", "anillo de boda", "hombre"],
    "97": ["mesa", "comedor", "mantel", "reunion de mesa", "sillas", "asado en mesa"],
    "98": ["lavandera", "lavar ropa", "jabon", "lavarropas", "tendedero", "ropa limpia"],
    "99": ["hermano", "hermana", "familia", "gemelo", "pariente cercano", "companero"]
};

SYMPATHETIC_RULES = {
    "14": ["48", "45", "71"],
    "48": ["14", "47", "70"],
    "32": ["69", "71", "39"],
    "08": ["76", "86", "62"],
    "06": ["05", "67", "24"],
    "13": ["17", "90", "07"],
    "20": ["14", "55", "15"],
    "47": ["48", "94", "70"],
    "88": ["03", "40", "84"],
    "24": ["25", "54", "06"]
};

def search_dreams(query: str, lottery: str = "all", shift: str = "all") -> Dict[str, Any]:
    cleaned_query = re.sub(r'[^\w\s]', ' ', query.lower())
    words = set(cleaned_query.split())
    
    pred_data = calculate_composite_predictions(lottery=lottery, shift=shift, top_k=100)
    scores_map = {p["number"]: p for p in pred_data.get("top_predictions", [])}
    
    matches = []
    
    for ambo, keywords in DREAM_DICTIONARY.items():
        matched_words = []
        for kw in keywords:
            for w in words:
                if len(w) >= 3 and (w in kw or kw in w):
                    matched_words.append(kw)
                    break
        
        if matched_words:
            cand_info = scores_map.get(ambo, {
                "composite_score": 50.0,
                "current_delay": 0,
                "suggested_centenas": [f"7{ambo}"],
                "suggested_millar": [f"47{ambo}"]
            })
            matches.append({
                "number": ambo,
                "significado": SIGNIFICADOS_QUINIELA.get(ambo, ""),
                "matched_keywords": list(set(matched_words)),
                "composite_score": cand_info.get("composite_score", 50.0),
                "current_delay": cand_info.get("current_delay", 0),
                "suggested_centena": cand_info.get("suggested_centenas", [f"7{ambo}"])[0],
                "suggested_cuaterno": cand_info.get("suggested_millar", [f"47{ambo}"])[0]
            })
            
    matches = sorted(matches, key=lambda x: (len(x["matched_keywords"]), x["composite_score"]), reverse=True)
    
    return {
        "query": query,
        "total_matched": len(matches),
        "dream_candidates": matches[:12]
    }

def get_sympathy_and_attractions(last_head_ambo: Optional[str] = None) -> Dict[str, Any]:
    all_draws = get_all_draws(limit=5)
    if not last_head_ambo:
        last_head_ambo = all_draws[-1]["head_ambo"] if all_draws else "23"

    val = int(last_head_ambo)
    inverso = f"{last_head_ambo[1]}{last_head_ambo[0]}"
    comp_100 = f"{(100 - val) % 100:02d}"
    espejo_99 = f"{99 - val:02d}"
    
    attracted = SYMPATHETIC_RULES.get(last_head_ambo, [
        f"{(val + 10) % 100:02d}",
        f"{(val + 50) % 100:02d}",
        inverso
    ])

    pred_data = calculate_composite_predictions(top_k=100)
    scores_map = {p["number"]: p for p in pred_data.get("top_predictions", [])}

    def enrich(num):
        info = scores_map.get(num, {})
        return {
            "number": num,
            "significado": SIGNIFICADOS_QUINIELA.get(num, ""),
            "composite_score": info.get("composite_score", 50.0),
            "current_delay": info.get("current_delay", 0)
        }

    return {
        "base_ambo": last_head_ambo,
        "base_significado": SIGNIFICADOS_QUINIELA.get(last_head_ambo, ""),
        "inverso": enrich(inverso),
        "complementario_100": enrich(comp_100),
        "espejo_99": enrich(espejo_99),
        "attracted_numbers": [enrich(a) for a in attracted]
    }

def simulate_bankroll_progression(
    base_bet: float = 100.0,
    turns: int = 5,
    strategy: str = "martingale",
    target_profit: float = 5000.0,
    bet_type: str = "ambo_cabeza"
) -> Dict[str, Any]:
    multipliers = {
        "ambo_cabeza": 70.0,
        "terno": 500.0,
        "cuaterno": 3500.0,
        "ambo_20": 3.5,
        "ambo_10": 7.0,
        "ambo_5": 14.0
    }
    multiplier = multipliers.get(bet_type, 70.0)
    
    steps = []
    accumulated_cost = 0.0
    current_bet = base_bet

    for t in range(1, turns + 1):
        if strategy == "martingale":
            if t == 1:
                current_bet = base_bet
            else:
                needed = (accumulated_cost + base_bet * 10) / (multiplier - 1)
                current_bet = max(base_bet * (1.5 ** (t - 1)), needed)
                current_bet = round(current_bet, -1) if current_bet > 100 else round(current_bet, 0)
        elif strategy == "dalembert":
            current_bet = base_bet * t
        elif strategy == "target_profit":
            needed = (accumulated_cost + target_profit) / multiplier
            current_bet = max(base_bet, round(needed, -1))

        accumulated_cost += current_bet
        gross_payout = current_bet * multiplier
        net_profit = gross_payout - accumulated_cost

        steps.append({
            "turn_number": t,
            "turn_bet": round(current_bet, 2),
            "accumulated_investment": round(accumulated_cost, 2),
            "gross_prize": round(gross_payout, 2),
            "net_profit": round(net_profit, 2),
            "roi_percentage": round((net_profit / accumulated_cost * 100), 1)
        })

    return {
        "strategy": strategy,
        "bet_type": bet_type,
        "multiplier": multiplier,
        "base_bet": base_bet,
        "total_budget_needed": round(accumulated_cost, 2),
        "progression_table": steps
    }

def verify_ticket_payout(
    draw_date: str,
    lottery: str,
    shift: str,
    items: List[Dict[str, Any]]
) -> Dict[str, Any]:
    all_draws = get_all_draws(lottery=lottery, shift=shift, start_date=draw_date, end_date=draw_date)
    if not all_draws:
        all_draws = get_all_draws(lottery=lottery, shift=shift, limit=1)
        
    if not all_draws:
        return {"error": "Sorteo no encontrado para la fecha y turno especificados"}

    draw = all_draws[0]
    board = [draw[f"p{p}"] for p in range(1, 21)]
    head_4 = board[0]
    head_3 = head_4[-3:]
    head_2 = head_4[-2:]

    total_cost = 0.0
    total_won = 0.0
    verified_items = []

    for it in items:
        num = str(it.get("number", "00")).strip()
        bet_amount = float(it.get("amount", 100))
        target_pos = it.get("position", "cabeza")
        
        total_cost += bet_amount
        is_hit = False
        won_amount = 0.0
        details = ""

        if len(num) == 2:
            if target_pos == "cabeza":
                if num == head_2:
                    is_hit = True
                    won_amount = bet_amount * 70.0
                    details = "�Acierto exacto a la Cabeza (70x)!"
                else:
                    details = f"Sali� {head_2} a la cabeza"
            elif target_pos in ["5", "10", "20"]:
                limit_pos = int(target_pos)
                sub_board = [p[-2:] for p in board[:limit_pos]]
                hit_count = sub_board.count(num)
                if hit_count > 0:
                    is_hit = True
                    mult = 70.0 / limit_pos
                    won_amount = bet_amount * mult * hit_count
                    details = f"�Apareci� {hit_count} vez/veces a los {limit_pos}!"
                else:
                    details = f"No apareci� en los primeros {limit_pos}"

        elif len(num) == 3:
            if target_pos == "cabeza":
                if num == head_3:
                    is_hit = True
                    won_amount = bet_amount * 500.0
                    details = "�Acierto de Terno a la Cabeza (500x)!"
                else:
                    details = f"Sali� {head_3}"
            else:
                limit_pos = int(target_pos) if target_pos.isdigit() else 20
                sub_board = [p[-3:] for p in board[:limit_pos]]
                hit_count = sub_board.count(num)
                if hit_count > 0:
                    is_hit = True
                    won_amount = bet_amount * (500.0 / limit_pos) * hit_count
                    details = f"�Terno a los {limit_pos} ({hit_count}x)!"
                else:
                    details = f"No apareci� en los primeros {limit_pos}"

        elif len(num) == 4:
            if target_pos == "cabeza":
                if num == head_4:
                    is_hit = True
                    won_amount = bet_amount * 3500.0
                    details = "�CUATERNO A LA CABEZA (3500x)!"
                else:
                    details = f"Sali� {head_4}"
            else:
                limit_pos = int(target_pos) if target_pos.isdigit() else 20
                hit_count = board[:limit_pos].count(num)
                if hit_count > 0:
                    is_hit = True
                    won_amount = bet_amount * (3500.0 / limit_pos) * hit_count
                    details = f"�Cuaterno a los {limit_pos}!"
                else:
                    details = f"No apareci� en los primeros {limit_pos}"

        total_won += won_amount
        verified_items.append({
            "number": num,
            "amount": bet_amount,
            "position": target_pos,
            "is_hit": is_hit,
            "won_amount": round(won_amount, 2),
            "details": details
        })

    return {
        "draw_date": draw["draw_date"],
        "lottery": draw["lottery"],
        "shift": draw["shift"],
        "official_head": head_4,
        "total_cost": round(total_cost, 2),
        "total_won": round(total_won, 2),
        "balance": round(total_won - total_cost, 2),
        "items": verified_items
    }
