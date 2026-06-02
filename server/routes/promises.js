import express from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import db from '../lib/db.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let _data = null;
function loadData() {
  if (!_data) {
    const raw = readFileSync(path.join(__dirname, '..', 'data', 'promises.json'), 'utf8');
    _data = JSON.parse(raw);
  }
  return _data;
}

// Reload data on change (for manual updates in production)
export function invalidateCache() { _data = null; }

/* ── Aggregated totals ───────────────────────────────────────────────── */
function buildTotals(promises) {
  return promises.reduce((acc, p) => {
    const amort = p.cost.per_year ? 1 : 0.2;
    const cost  = p.cost.static_bn_dkk * amort;
    if (cost > 0) { acc.total_cost += cost; acc.total_cost_dynamic += p.cost.dynamic_bn_dkk * amort; }
    else          { acc.total_savings += Math.abs(cost); }
    acc.count++;
    return acc;
  }, { total_cost: 0, total_cost_dynamic: 0, total_savings: 0, count: 0 });
}

/* ── GET /api/promises — list with optional filters ─────────────────── */
router.get('/', (req, res) => {
  const { category, status, party } = req.query;
  const { promises, government } = loadData();

  let filtered = promises;
  if (category && category !== 'alle') filtered = filtered.filter(p => p.category === category);
  if (status   && status   !== 'alle') filtered = filtered.filter(p => p.status   === status);
  if (party    && party    !== 'alle') filtered = filtered.filter(p => p.parties?.includes(party.toUpperCase()));

  const totals = buildTotals(promises);
  totals.total_cost         = Math.round(totals.total_cost         * 10) / 10;
  totals.total_cost_dynamic = Math.round(totals.total_cost_dynamic * 10) / 10;
  totals.total_savings      = Math.round(totals.total_savings      * 10) / 10;
  totals.net_cost           = Math.round((totals.total_cost - totals.total_savings) * 10) / 10;

  // Attach signal counts to each promise
  let signalCounts = {};
  try {
    const rows = db.prepare(
      'SELECT promise_id, COUNT(*) as cnt, SUM(CASE WHEN signal_type="scope_change" THEN 1 ELSE 0 END) as scope_cnt FROM promise_signals GROUP BY promise_id'
    ).all();
    rows.forEach(r => { signalCounts[r.promise_id] = { total: r.cnt, scope: r.scope_cnt }; });
  } catch {}

  const annotated = filtered.map(p => ({
    ...p,
    _signals: signalCounts[p.id] || { total: 0, scope: 0 },
  }));

  res.json({ government, promises: annotated, totals });
});

/* ── GET /api/promises/signals — all recent signals (scope changes first) */
router.get('/signals', (req, res) => {
  const { limit = 50, type } = req.query;
  try {
    const where = type ? `WHERE signal_type = '${type}'` : '';
    const rows = db.prepare(`
      SELECT * FROM promise_signals ${where}
      ORDER BY
        CASE signal_type WHEN 'scope_change' THEN 0 ELSE 1 END,
        detected_at DESC
      LIMIT ?
    `).all(parseInt(limit));
    res.json({ signals: rows });
  } catch {
    res.json({ signals: [] });
  }
});

/* ── GET /api/promises/events — manual/editorial events feed ─────────── */
router.get('/events', (req, res) => {
  const { promise_id } = req.query;
  try {
    const where = promise_id ? 'WHERE promise_id = ?' : '';
    const args  = promise_id ? [promise_id] : [];
    const rows  = db.prepare(`SELECT * FROM promise_events ${where} ORDER BY event_date DESC LIMIT 100`).all(...args);
    res.json({ events: rows });
  } catch {
    res.json({ events: [] });
  }
});

/* ── GET /api/promises/:id/signals — signals for one promise ─────────── */
router.get('/:id/signals', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT * FROM promise_signals WHERE promise_id = ? ORDER BY CASE signal_type WHEN "scope_change" THEN 0 ELSE 1 END, detected_at DESC LIMIT 30'
    ).all(req.params.id);
    res.json({ signals: rows });
  } catch {
    res.json({ signals: [] });
  }
});

/* ── POST /api/promises/events — add editorial event (admin, no auth yet) */
router.post('/events', (req, res) => {
  const { promise_id, event_type, description, source_url, source_name } = req.body || {};
  if (!promise_id || !event_type || !description) {
    return res.status(400).json({ error: 'promise_id, event_type og description er påkrævet' });
  }
  try {
    const result = db.prepare(
      'INSERT INTO promise_events (promise_id, event_type, description, source_url, source_name) VALUES (?, ?, ?, ?, ?)'
    ).run(promise_id, event_type, description, source_url || null, source_name || null);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── GET /api/promises/:id — single promise with signals ─────────────── */
router.get('/:id', (req, res) => {
  const { promises } = loadData();
  const promise = promises.find(p => p.id === req.params.id);
  if (!promise) return res.status(404).json({ error: 'Løfte ikke fundet' });

  let signals = [], events = [];
  try {
    signals = db.prepare(
      'SELECT * FROM promise_signals WHERE promise_id = ? ORDER BY signal_type = "scope_change" DESC, detected_at DESC LIMIT 20'
    ).all(req.params.id);
    events = db.prepare(
      'SELECT * FROM promise_events WHERE promise_id = ? ORDER BY event_date DESC'
    ).all(req.params.id);
  } catch {}

  res.json({ ...promise, signals, events });
});

export default router;
