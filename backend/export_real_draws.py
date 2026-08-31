import sqlite3
import json

conn = sqlite3.connect("quiniela.db")
cursor = conn.cursor()
cursor.execute("SELECT draw_date, lottery, shift, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, head_ambo, head_centena, head_millar FROM draws ORDER BY draw_date DESC, shift DESC")

draws_dict = {}
for row in cursor.fetchall():
    date_str, lot, sh = row[0], row[1], row[2]
    key = f"{date_str}_{lot}_{sh}"
    draws_dict[key] = {
        "draw_date": date_str,
        "lottery": lot,
        "shift": sh,
        "head_millar": row[3],
        "head_centena": row[3][-3:],
        "head_ambo": row[3][-2:],
        "board": list(row[3:23])
    }

print(f"Exported {len(draws_dict)} real official draws.")
with open("real_draws_dump.json", "w", encoding="utf-8") as f:
    json.dump(draws_dict, f, indent=2)
