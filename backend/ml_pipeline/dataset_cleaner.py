import json
import re
from datetime import datetime
from pathlib import Path

SHIFT_ORDER = {
    "previa": 1,
    "primera": 2,
    "matutina": 3,
    "vespertina": 4,
    "nocturna": 5
}

VALID_LOTTERIES = {"ciudad", "provincia"}

def clean_and_curate_dataset(raw_path: Path, output_path: Path):
    print(f"[*] Cargando dataset original desde: {raw_path}")
    with open(raw_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    if isinstance(raw_data, dict):
        raw_items = list(raw_data.values())
    elif isinstance(raw_data, list):
        raw_items = raw_data
    else:
        raise ValueError("Formato de datos no reconocido en draws.json")

    total_raw = len(raw_items)
    print(f"[*] Sorteos leídos originalmente: {total_raw}")

    seen_keys = set()
    curated = []
    duplicates = 0
    invalid_dates = 0
    invalid_lottery = 0
    invalid_shift = 0
    invalid_board = 0

    date_regex = re.compile(r"^\d{4}-\d{2}-\d{2}$")

    for item in raw_items:
        if not isinstance(item, dict):
            continue

        d_date = item.get("draw_date") or item.get("date")
        lottery = (item.get("lottery") or "").lower().strip()
        shift = (item.get("shift") or "").lower().strip()

        # 1. Validar fecha
        if not d_date or not date_regex.match(d_date):
            invalid_dates += 1
            continue
        try:
            datetime.strptime(d_date, "%Y-%m-%d")
        except ValueError:
            invalid_dates += 1
            continue

        # 2. Validar lotería
        if lottery not in VALID_LOTTERIES:
            invalid_lottery += 1
            continue

        # 3. Validar turno
        if shift not in SHIFT_ORDER:
            invalid_shift += 1
            continue

        # 4. Validar pizarra y números
        board = item.get("board")
        if not board or not isinstance(board, list) or len(board) < 20:
            # Reconstruir si tiene p1..p20
            board = [item.get(f"p{p}") for p in range(1, 21)]
            if any(n is None for n in board):
                invalid_board += 1
                continue

        # Validar formato de 4 cifras
        clean_board = []
        board_valid = True
        for num in board[:20]:
            s_num = str(num).strip().zfill(4)
            if not (len(s_num) == 4 and s_num.isdigit()):
                board_valid = False
                break
            clean_board.append(s_num)

        if not board_valid:
            invalid_board += 1
            continue

        head_millar = clean_board[0]
        head_centena = head_millar[-3:]
        head_ambo = head_millar[-2:]

        # 5. Control de duplicados
        unique_key = (d_date, lottery, shift)
        if unique_key in seen_keys:
            duplicates += 1
            continue
        seen_keys.add(unique_key)

        curated.append({
            "draw_date": d_date,
            "lottery": lottery,
            "shift": shift,
            "shift_order": SHIFT_ORDER[shift],
            "head_millar": head_millar,
            "head_centena": head_centena,
            "head_ambo": head_ambo,
            "board": clean_board
        })

    # Ordenamiento cronológico estricto (Fecha ascendente, Turno ascendente)
    curated.sort(key=lambda x: (x["draw_date"], x["shift_order"], x["lottery"]))

    print(f"[*] Limpieza completada:")
    print(f"    - Duplicados descartados: {duplicates}")
    print(f"    - Fechas inválidas: {invalid_dates}")
    print(f"    - Loterías inválidas: {invalid_lottery}")
    print(f"    - Turnos inválidos: {invalid_shift}")
    print(f"    - Pizarras incompletas/inválidas: {invalid_board}")
    print(f"    - Total de sorteos curados: {len(curated)}")
    print(f"    - Rango de fechas: {curated[0]['draw_date']} al {curated[-1]['draw_date']}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(curated, f, indent=2, ensure_ascii=False)

    print(f"[+] Dataset curado guardado en: {output_path}")
    return curated

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent.parent
    raw_file = base_dir / "frontend" / "public" / "api" / "draws.json"
    curated_file = Path(__file__).resolve().parent / "draws_curated.json"
    clean_and_curate_dataset(raw_file, curated_file)
