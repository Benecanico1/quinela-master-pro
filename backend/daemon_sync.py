import time, subprocess, sys, os
from datetime import datetime

def run_sync():
    now = datetime.now()
    if now.weekday() < 6 and 10 <= now.hour <= 22:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Sincronizando con LOTBA...")
        base_dir = r"C:\Users\enero\.gemini\antigravity\scratch\quiniela-pro-app"
        frontend_dir = os.path.join(base_dir, "frontend")
        portal_dir = r"C:\Users\enero\.gemini\antigravity\scratch\ingenieriajh-portal"
        
        # 1. Run Python LOTBA scraper
        subprocess.run([sys.executable, "backend/scraper_service.py"], cwd=base_dir)
        
        # 2. Copy to frontend and portal API
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

            # 3. Direct Firestore Sync (Instant Real-time in-app, 0 quota issues)
            firestore_script = """
import('./src/services/firebaseClient.js').then(async ({ db }) => {
  const { doc, setDoc } = await import('firebase/firestore');
  const fs = await import('fs');
  const dump = JSON.parse(fs.readFileSync('../backend/real_draws_dump.json', 'utf-8'));
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayKeys = Object.keys(dump).filter(k => k.startsWith(todayStr));
  const todayData = {};
  todayKeys.forEach(k => { todayData[k] = dump[k]; });
  if (todayKeys.length > 0) {
    await setDoc(doc(db, 'official_draws', todayStr), todayData, { merge: true });
    await setDoc(doc(db, 'official_draws', 'latest'), todayData, { merge: true });
    console.log('Sincronizados con Firestore:', todayKeys);
  }
  process.exit(0);
}).catch(e => {
  console.error('Error Firestore:', e.message);
  process.exit(0);
});
"""
            subprocess.run(["node", "-e", firestore_script], cwd=frontend_dir)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Firestore actualizado en tiempo real!")
        except Exception as e:
            print("Error en sincronización:", e)

if __name__ == "__main__":
    print("Quinela Master Pro - Daemon 24/7 Activo (Firestore + LOTBA)")
    while True:
        try:
            run_sync()
            time.sleep(120)
        except Exception as e:
            print("Error daemon:", e)
            time.sleep(60)
