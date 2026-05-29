import express from 'express';
const router = express.Router();

const BOUNDS = 'lamin=54.5&lomin=7.0&lamax=58.5&lomax=15.5';

router.get('/', async (req, res) => {
  try {
    const resp = await fetch(`https://opensky-network.org/api/states/all?${BOUNDS}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(9000),
    });
    if (!resp.ok) return res.json({ states: [], time: Date.now() / 1000 });
    const data = await resp.json();
    const states = (data.states || []).filter(s => s[5] != null && s[6] != null);
    res.json({ states, time: data.time || Date.now() / 1000 });
  } catch {
    res.json({ states: [], time: Date.now() / 1000 });
  }
});

export default router;
