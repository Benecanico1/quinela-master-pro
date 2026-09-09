// Result identity is supplied by the source, never inferred from stored numbers.
export const DRAW_TIMES = { previa: '10:15', primera: '12:00', matutina: '15:00', vespertina: '18:00', nocturna: '21:00' };

export function isVerifiedOfficialDraw(draw, now = Date.now()) {
  if (!draw || draw.source_verified !== true || !draw.source || !String(draw.draw_number || '').trim()) return false;
  if (!['PUBLISHED', 'COMPLETED', 'VERIFIED_OFFICIAL'].includes(draw.status)) return false;
  const date = draw.draw_date || draw.date;
  const shift = draw.shift;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !DRAW_TIMES[shift]) return false;
  if (!['ciudad', 'provincia'].includes(draw.lottery || draw.jurisdiction)) return false;
  if (!(draw.official_date || draw.extract_date || draw.verified_date)) return false;
  if ([draw.date, draw.real_date, draw.official_date, draw.extract_date, draw.verified_date].some(d => d && d !== date)) return false;
  if (draw.lottery && draw.jurisdiction && draw.lottery !== draw.jurisdiction) return false;
  const scheduled = Date.parse(`${date}T${DRAW_TIMES[shift]}:00-03:00`);
  const received = Date.parse(draw.received_at);
  // Receipt clocks can differ slightly across phones and the server. This
  // tolerance never permits a draw before its scheduled time.
  if (!Number.isFinite(scheduled) || scheduled > now || !Number.isFinite(received) || received < scheduled || received > now + 120000) return false;
  const board = draw.board;
  if (!Array.isArray(board) || board.length !== 20 || board.some(n => !/^\d{4}$/.test(String(n)))) return false;
  if (draw.head_millar && String(draw.head_millar) !== String(board[0])) return false;
  return board.every((n, i) => draw[`p${i + 1}`] == null || String(draw[`p${i + 1}`]) === String(n));
}

export function mergeOfficialDraws(existing, incoming) {
  const merged = { ...existing };
  for (const [key, draw] of Object.entries(incoming || {})) {
    const previous = existing[key];
    const valid = isVerifiedOfficialDraw(draw);
    const previousValid = isVerifiedOfficialDraw(previous);
    if ((valid && (!previousValid || Date.parse(draw.received_at) >= Date.parse(previous.received_at))) || (!valid && !previousValid)) merged[key] = draw;
  }
  return merged;
}
