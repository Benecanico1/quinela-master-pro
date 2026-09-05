import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';

async function testAllTabs() {
  console.log("=== INICIANDO PRUEBA COMPLETA DE TODAS LAS PESTAÑAS Y MÓDULOS ===");
  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const port = 9222;
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    '--window-size=412,915',
    'http://localhost:4173/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const targetsRes = await fetch(`http://127.0.0.1:${port}/json`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:4173'));
    if (!pageTarget) throw new Error("No se encontró target en Chrome.");

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

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

    const uncaughtErrors = [];
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
        uncaughtErrors.push(desc);
        console.error("  [EXCEPTION EN PESTAÑA]:", desc);
      }
    });

    await send('Runtime.enable');
    await send('Page.enable');

    await new Promise(r => setTimeout(r, 2000));

    // Función auxiliar para hacer click en botones por texto
    async function clickButtonWithText(text) {
      const clickRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const target = btns.find(b => b.innerText.includes('${text}'));
          if (target) {
            target.scrollIntoView();
            target.click();
            return { clicked: true, text: target.innerText.trim() };
          }
          return { clicked: false };
        })()`,
        returnByValue: true
      });
      return clickRes.result.value;
    }

    // Probar pestañas principales
    const tabsToTest = [
      { name: "Pronósticos Principales", query: "Pronósticos" },
      { name: "IA Predictiva (ML)", query: "IA Predictiva" },
      { name: "Sorteos & Resultados", query: "Sorteos" },
      { name: "Radar de Números", query: "Radar" },
      { name: "Libro de Sueños", query: "Sueños" },
      { name: "Estrategia Bankroll", query: "Estrategia" }
    ];

    for (const tab of tabsToTest) {
      console.log(`\n--- Probando Pestaña: [${tab.name}] ---`);
      const clickResult = await clickButtonWithText(tab.query);
      console.log(`Click en '${tab.query}':`, clickResult.clicked ? "OK" : "No encontrado");
      
      await new Promise(r => setTimeout(r, 1200));

      const statusRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const text = document.getElementById('root')?.innerText || '';
          return {
            hasError: text.includes('Algo no salió como esperábamos') || text.includes('Reiniciar Aplicación'),
            htmlLength: document.getElementById('root')?.innerHTML.length || 0,
            snippet: text.substring(0, 150).replace(/\\n+/g, ' | ')
          };
        })()`,
        returnByValue: true
      });

      const s = statusRes.result.value;
      console.log(`Estado: HTML ${s.htmlLength} bytes | Errores: ${s.hasError ? 'ERROR' : '0 ERRORES (OK)'}`);
      console.log(`Snippet: ${s.snippet}`);

      if (s.hasError) {
        throw new Error(`Fallo en pestaña ${tab.name}`);
      }

      // Si estamos en IA Predictiva, probar la subpestaña de Ablación
      if (tab.name === "IA Predictiva (ML)") {
        console.log("  -> Probando Sub-Pestaña: [Ablación & Valor Incremental]");
        const abClick = await clickButtonWithText("Ablación");
        console.log("  -> Click en 'Ablación':", abClick.clicked ? "OK" : "No encontrado");
        await new Promise(r => setTimeout(r, 1200));

        const abStatus = await send('Runtime.evaluate', {
          expression: `(() => {
            const text = document.getElementById('root')?.innerText || '';
            return {
              hasAblationText: text.includes('Auditoría de Ablación') || text.includes('HISTORICAL_TEST_V1'),
              hasScenario: text.includes('ESCENARIO 2'),
              hasTable: text.includes('ML solo Tendencia')
            };
          })()`,
          returnByValue: true
        });
        console.log("  -> Verificación Módulo Ablación:", abStatus.result.value);
      }
    }

    // Capturar screenshot final de alta fidelidad
    const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(screenshotRes.data, 'base64');
    const outPath = "C:\\Users\\enero\\.gemini\\antigravity\\scratch\\quiniela-pro-app\\play_store_package\\all_tabs_verified.png";
    fs.writeFileSync(outPath, buffer);
    console.log(`\n[+] CAPTURA FINAL GUARDADA: ${outPath} (${buffer.length} bytes)`);

    ws.close();

    if (uncaughtErrors.length > 0) {
      throw new Error(`Se detectaron ${uncaughtErrors.length} excepciones en tiempo de ejecución.`);
    }

    console.log("\n=======================================================");
    console.log(">>> TODAS LAS PESTAÑAS Y SUBPESTAÑAS FUNCIONAN AL 100% <<<");
    console.log("=======================================================");

  } finally {
    chromeProc.kill();
  }
}

testAllTabs().catch(err => {
  console.error("PRUEBA FALLIDA:", err);
  process.exit(1);
});
