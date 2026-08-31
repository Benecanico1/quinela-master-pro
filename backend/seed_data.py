import random
from datetime import datetime, timedelta
from database import init_db, insert_draw, get_draw_count

SIGNIFICADOS_QUINIELA = {
    "00": "Huevos", "01": "Agua", "02": "Ni�o", "03": "San Cono", "04": "La Cama",
    "05": "Gato", "06": "Perro", "07": "Rev�lver", "08": "Incendio", "09": "Arroyo",
    "10": "La Leche", "11": "Minero", "12": "Soldado", "13": "La Yeta", "14": "Borracho",
    "15": "Ni�a Bonita", "16": "Anillo", "17": "Desgracia", "18": "Sangre", "19": "Pescado",
    "20": "La Fiesta", "21": "La Mujer", "22": "El Loco", "23": "Cocinero", "24": "Caballo",
    "25": "Gallina", "26": "La Misa", "27": "El Peine", "28": "El Cerro", "29": "San Pedro",
    "30": "Santa Rosa", "31": "La Luz", "32": "Dinero", "33": "Cristo", "34": "Cabeza",
    "35": "Pajarito", "36": "Manteca", "37": "Dentista", "38": "Aceite", "39": "Lluvia",
    "40": "El Cura", "41": "Cucho", "42": "Zapatilla", "43": "Balc�n", "44": "La C�rcel",
    "45": "El Vino", "46": "Tomates", "47": "Muerto", "48": "Muerto habla", "49": "La Carne",
    "50": "El Pan", "51": "Serrucho", "52": "Madre", "53": "El Barco", "54": "La Vaca",
    "55": "La M�sica", "56": "La Ca�da", "57": "Jorobado", "58": "Ahogado", "59": "Las Plantas",
    "60": "La Virgen", "61": "Escopeta", "62": "Inundaci�n", "63": "Casamiento", "64": "Llanto",
    "65": "Cazador", "66": "Lombrices", "67": "Mordida", "68": "Sobrinos", "69": "La Deuda",
    "70": "Muerto Sue�o", "71": "Excremento", "72": "Sorpresa", "73": "Hospital", "74": "Gente Negra",
    "75": "Payaso", "76": "Las Llamas", "77": "Pierna Mujer", "78": "Ramera", "79": "Ladr�n",
    "80": "La Bocha", "81": "Flores", "82": "La Pelea", "83": "Mal Tiempo", "84": "La Iglesia",
    "85": "Linterna", "86": "Humo", "87": "Piojos", "88": "El Papa", "89": "La Rata",
    "90": "El Miedo", "91": "Excusado", "92": "M�dico", "93": "Enamorado", "94": "Cementerio",
    "95": "Anteojos", "96": "Marido", "97": "La Mesa", "98": "Lavandera", "99": "Hermano"
}

def generate_quiniela_draws_2026():
    init_db()
    current_count = get_draw_count()
    if current_count >= 1500:
        print(f"Database already populated with {current_count} draws.")
        return

    random.seed(12345)
    start_date = datetime(2026, 1, 1)
    end_date = datetime(2026, 8, 18)
    
    lotteries = ["ciudad", "provincia"]
    shifts = ["previa", "primera", "matutina", "vespertina", "nocturna"]
    
    delta = (end_date - start_date).days
    total_draws = 0
    recent_head_pool = []
    
    for d in range(delta + 1):
        cur_date = start_date + timedelta(days=d)
        date_str = cur_date.strftime("%Y-%m-%d")
        
        is_sunday = cur_date.weekday() == 6
        active_shifts = ["primera", "matutina"] if is_sunday else shifts
        
        for shift in active_shifts:
            for lottery in lotteries:
                positions = {}
                used_in_draw = set()
                
                for pos in range(1, 21):
                    if random.random() < 0.07 and recent_head_pool:
                        chosen_base = random.choice(recent_head_pool)
                        if random.random() < 0.5:
                            num = chosen_base
                        else:
                            millar = random.randint(0, 9)
                            num = f"{millar}{chosen_base[1:]}"
                    else:
                        num = f"{random.randint(0, 9999):04d}"
                    
                    positions[f"p{pos}"] = num
                    used_in_draw.add(num)
                
                p1_num = positions["p1"]
                recent_head_pool.append(p1_num)
                if len(recent_head_pool) > 30:
                    recent_head_pool.pop(0)
                
                draw_data = {
                    "draw_date": date_str,
                    "lottery": lottery,
                    "shift": shift,
                    **positions
                }
                insert_draw(draw_data)
                total_draws += 1
                
    print(f"Successfully generated and inserted {total_draws} draws for 2026.")

if __name__ == "__main__":
    generate_quiniela_draws_2026()
