import time, subprocess, sys, os
from datetime import datetime

def run_sync():
    now = datetime.now()
    if now.weekday() < 6 and 10 <= now.hour <= 22:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Sincronizando con LOTBA...")
        base_dir = r"C:\Users\enero\.gemini\antigravity\scratch\quiniela-pro-app"
        portal_dir = r"C:\Users\enero\.gemini\antigravity\scratch\ingenieriajh-portal"
        subprocess.run([sys.executable, "backend/scraper_service.py"], cwd=base_dir)
        
        dump_src = os.path.join(base_dir, "backend", "real_draws_dump.json")
        portal_api = os.path.join(portal_dir, "public", "api", "draws.json")
        frontend_api = os.path.join(base_dir, "frontend", "public", "api", "draws.json")
        
        try:
            with open(dump_src, "rb") as f_src:
                c = f_src.read()
            with open(portal_api, "wb") as f_dst:
                f_dst.write(c)
            with open(frontend_api, "wb") as f_dst2:
                f_dst2.write(c)
            subprocess.run(["cmd.exe", "/c", "npx firebase deploy --only hosting:ingenieriajh --project openclaw-nyj-ia-web"], cwd=portal_dir)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Firebase Hosting actualizado correctamente!")
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    print("Quinela Master Pro - Daemon 24/7 Activo")
    while True:
        try:
            run_sync()
            time.sleep(120)
        except Exception as e:
            print("Error daemon:", e)
            time.sleep(60)
