export async function fetchDirectFromLotba() {
  try {
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
    const homeRes = await fetch('https://quiniela.loteriadelaciudad.gob.ar/', {
      signal: AbortSignal.timeout(10000),
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store' }
    });
    if (!homeRes.ok) return null;
    const homeHtml = await homeRes.text();

    // Discover today's active sorteo IDs strictly from the live home select dropdown
    // Matches both value="52872" and unquoted value=52872
    const optionRegex = /<option[^>]*value=['"]?(\d{5})['"]?[^>]*>(.*?)<\/option>/gi;
    let optMatch;
    const todayDrawsFound = [];
    const SHIFT_NAMES_ORDER = ['previa', 'primera', 'matutina', 'vespertina', 'nocturna'];

    // Convert todayStr (YYYY-MM-DD) to DD/MM/YYYY
    const [tYear, tMonth, tDay] = todayStr.split('-');
    const todayDmy = `${tDay}/${tMonth}/${tYear}`;

    while ((optMatch = optionRegex.exec(homeHtml)) !== null) {
      const sId = optMatch[1];
      const text = optMatch[2] || '';
      const lower = text.toLowerCase();

      // Check if this option belongs to today
      if (text.includes(todayDmy) || text.includes(todayStr)) {
        let cleanShift = null;
        if (lower.includes('previa')) cleanShift = 'previa';
        else if (lower.includes('primera')) cleanShift = 'primera';
        else if (lower.includes('matutina')) cleanShift = 'matutina';
        else if (lower.includes('vespertina')) cleanShift = 'vespertina';
        else if (lower.includes('nocturna')) cleanShift = 'nocturna';

        if (!todayDrawsFound.some(s => s.id === sId)) {
          todayDrawsFound.push({ id: sId, shift: cleanShift, text });
        }
      }
    }

    // If shift is not explicitly named in the option label, deduce it from chronological sorteo ID order
    // Sorteo IDs increase monotonically for each shift in the day:
    // 1st of day = previa, 2nd = primera, 3rd = matutina, 4th = vespertina, 5th = nocturna
    const sortedToday = [...todayDrawsFound].sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10));
    const sorteos = sortedToday.map((item, idx) => ({
      id: item.id,
      shift: item.shift || SHIFT_NAMES_ORDER[idx] || 'previa'
    }));

    // PROHIBITED: Hardcoded static fallbackCandidates from previous dates (e.g. 52864 from 2026-09-04)
    if (sorteos.length === 0) return null;

    const extracted = {};
    await Promise.all(sorteos.slice(0, 5).map(async s => {
      let verifiedShift = null;
      for (const [jur, lot] of [['51', 'ciudad'], ['53', 'provincia']]) {
        try {
          const formData = new URLSearchParams();
          formData.append('codigo', '0080');
          formData.append('juridiccion', jur);
          formData.append('sorteo', s.id);

          const res = await fetch('https://quiniela.loteriadelaciudad.gob.ar/resultadosQuiniela/consultaResultados.php', {
            signal: AbortSignal.timeout(10000),
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
          });
          if (res.ok) {
            const html = await res.text();
            const extract = html.match(/QNL(51|53)([A-Z])(\d{8})\.(?:pdf|xml)/i);
            const shiftMatch = html.match(/<tr>\s*<td>\s*(PREVIA|PRIMERA|MATUTINA|VESPERTINA|NOCTURNA)\s*<\/td>\s*<\/tr>/i);
            if (jur === '51') {
              if (!extract || extract[1] !== jur || extract[3] !== todayStr.replaceAll('-', '') || !shiftMatch) continue;
              verifiedShift = shiftMatch[1].toLowerCase();
            } else if (!verifiedShift || !/<p>\s*BUENOS AIRES\s*<\/p>/i.test(html)) continue;
            // LOTBA serves the other jurisdiction for the same requested sorteo.
            const officialShift = verifiedShift;
            const posRegex = /<div class=["']pos["']>(\d{2})<\/div>\s*<div>(\d{4})<\/div>/gi;
            let m;
            const prizes = {};
            while ((m = posRegex.exec(html)) !== null) {
              const pos = parseInt(m[1], 10);
              if (pos >= 1 && pos <= 20 && !prizes[pos]) {
                prizes[pos] = m[2];
              }
            }
            if (Object.keys(prizes).length === 20) {
              const boardArr = Array.from({ length: 20 }, (_, i) => prizes[i + 1]);
              const nowIso = new Date().toISOString();
              const key = `${todayStr}_${lot}_${officialShift}`;
              extracted[key] = {
                draw_number: s.id,
                draw_date: todayStr,
                date: todayStr,
                official_date: todayStr,
                lottery: lot,
                jurisdiction: lot,
                shift: officialShift,
                head_millar: boardArr[0],
                head_centena: boardArr[0].slice(-3),
                head_ambo: boardArr[0].slice(-2),
                p1: boardArr[0],
                board: boardArr,
                status: 'PUBLISHED',
                received_at: nowIso,
                source: 'LOTBA_DIRECT_EXTRACT',
                source_verified: true
              };
              for (let i = 0; i < 20; i++) {
                extracted[key][`p${i + 1}`] = boardArr[i];
              }
            }
          }
        } catch (e) {}
      }
    }));

    if (Object.keys(extracted).length > 0) {
      return extracted;
    }
  } catch (err) {
    console.warn("Direct LOTBA in-app extractor fallback:", err.message);
  }
  return null;
}
