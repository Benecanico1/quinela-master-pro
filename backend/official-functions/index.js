import { onRequest } from 'firebase-functions/v2/https';
import { isVerifiedOfficialDraw } from './validation.js';
import { fetchDirectFromLotba } from './extractor.js';

let cached = {};
let checkedAt = 0;
let inFlight;

export const quinelaOfficialDraws = onRequest({
  region: 'us-central1', cors: true, invoker: 'public',
  memory: '256MiB', maxInstances: 2, minInstances: 0, timeoutSeconds: 40,
}, async (req, res) => {
  if (req.method !== 'GET') return res.status(405).send('GET required');
  if (Date.now() - checkedAt > 60000) {
    if (!inFlight) inFlight = fetchDirectFromLotba().then(draws => {
      const verified = Object.fromEntries(Object.entries(draws || {}).filter(([, draw]) => isVerifiedOfficialDraw(draw)));
      if (Object.keys(verified).length) cached = { ...cached, ...verified };
      checkedAt = Date.now();
    }).finally(() => { inFlight = null; });
    await inFlight;
  }
  res.set('Cache-Control', 'public, max-age=30, s-maxage=30');
  if (!Object.keys(cached).length) return res.status(503).json({ error: 'Official source temporarily unavailable' });
  return res.json(cached);
});
