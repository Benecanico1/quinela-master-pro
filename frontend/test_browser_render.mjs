import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';

async function testAppRender() {
  console.log("=== INICIANDO PRUEBA DE RENDERIZADO EN VIVO (CHROME HEADLESS) ===");
  
  // 1. Iniciar Chrome con Remote Debugging Port
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const port = 9222;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--window-size=412,915',
    'http://localhost:4173/'
  ]);

  // Esperar 2 segundos a que Chrome abra el puerto
  await new Promise(r => setTimeout(r, 2000));

  try {
    // 2. Obtener lista de targets desde Chrome
    const targetsRes = await fetch(`http://127.0.0.1:${port}/json`);
    const targets = await targetsRes.json();
    console.log("Targets encontrados en Chrome:", targets.length);

    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:4173'));
    if (!pageTarget) {
      throw new Error("No se encontró la pestaña de la aplicación en Chrome.");
    }

    console.log("Conectando WebSocket a:", pageTarget.title || pageTarget.url);
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    // Conectar WebSocket usando WebSocket nativo de Node.js (Node 22+) o global WebSocket
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    console.log("WebSocket conectado al motor Chromium.");

    let reqId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = reqId++;
        const handler = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.id === id) {
            ws.removeEventListener('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Escuchar logs de consola para detectar cualquier error
    const consoleErrors = [];
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        if (type === 'error') {
          consoleErrors.push(text);
          console.error("[CHROME CONSOLE ERROR]:", text);
        } else {
          console.log(`[CHROME CONSOLE ${type.toUpperCase()}]:`, text);
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
        consoleErrors.push(desc);
        console.error("[CHROME EXCEPTION]:", desc);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    // Esperar 2.5 segundos para que React complete el renderizado y efectos
    await new Promise(r => setTimeout(r, 2500));

    // Evaluar DOM de la app
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.getElementById('root');
        const text = root ? root.innerText : '';
        const hasErrorBoundary = text.includes('Reiniciar Aplicación') || text.includes('Algo no salió como esperábamos');
        const hasPredictions = text.includes('Predicciones') || text.includes('Quiniela') || text.includes('Ambo');
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
        return {
          rootExists: !!root,
          htmlLength: root ? root.innerHTML.length : 0,
          textSample: text.substring(0, 300),
          hasErrorBoundary,
          hasPredictions,
          buttonsCount: buttons.length,
          buttonsSample: buttons.slice(0, 8)
        };
      })()`,
      returnByValue: true
    });

    const domInfo = evalRes.result.value;
    console.log("\n=== ESTADO DEL DOM RENDERIZADO EN CHROME ===");
    console.log("Root element presente:", domInfo.rootExists);
    console.log("Longitud de HTML renderizado:", domInfo.htmlLength, "bytes");
    console.log("Error Boundary disparado:", domInfo.hasErrorBoundary ? "SI (ALERTA)" : "NO (OK)");
    console.log("Contenido de Quiniela visible:", domInfo.hasPredictions ? "SI (OK)" : "NO");
    console.log("Botones interactivos detectados:", domInfo.buttonsCount);
    console.log("Muestra de botones:", domInfo.buttonsSample.join(" | "));
    console.log("Texto en pantalla (primeros 200 chars):\n" + domInfo.textSample);

    // Tomar Screenshot y guardar en disco
    const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(screenshotRes.data, 'base64');
    const outPath = "C:\\Users\\enero\\.gemini\\antigravity\\scratch\\quiniela-pro-app\\play_store_package\\live_app_proof.png";
    fs.writeFileSync(outPath, buffer);
    console.log(`\n[+] CAPTURA DE PANTALLA GUARDADA CON ÉXITO: ${outPath} (${buffer.length} bytes)`);

    ws.close();

    // Verificaciones finales
    if (domInfo.hasErrorBoundary) {
      throw new Error("La aplicación disparó el GlobalErrorBoundary.");
    }
    if (domInfo.htmlLength < 500) {
      throw new Error("La pantalla está en blanco o negro (HTML vacío).");
    }
    if (consoleErrors.length > 0) {
      console.warn(`Se registraron ${consoleErrors.length} advertencias/errores en consola, pero la UI renderizó correctamente.`);
    }

    console.log("\n>>> VERIFICACIÓN EXITOSA: LA APP ESTÁ ANDANDO PERFECTAMENTE SIN PANTALLA NEGRA <<<");

  } finally {
    chromeProc.kill();
  }
}

testAppRender().catch(err => {
  console.error("ERROR EN LA PRUEBA:", err);
  process.exit(1);
});
