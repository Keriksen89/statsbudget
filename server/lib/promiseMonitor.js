/**
 * Promise Monitor — RSS scanner for government promise tracking
 *
 * Polls DR.dk and TV2 RSS feeds every 30 minutes, matches articles
 * against promise keyword sets, detects scope changes, and stores
 * signals in the SQLite DB for the frontend to surface.
 */

import db from './db.js';

/* ── RSS feeds to monitor ─────────────────────────────────────────────── */
const FEEDS = [
  { src: 'DR',       url: 'https://www.dr.dk/nyheder/service/feeds/politik' },
  { src: 'DR',       url: 'https://www.dr.dk/nyheder/service/feeds/indland' },
  { src: 'DR',       url: 'https://www.dr.dk/nyheder/service/feeds/penge' },
  { src: 'TV2',      url: 'https://nyheder.tv2.dk/rss' },
  { src: 'TV2',      url: 'https://finans.tv2.dk/rss' },
  { src: 'Altinget', url: 'https://www.altinget.dk/rss/articles' },
  { src: 'JP',       url: 'https://jyllands-posten.dk/rss/jp_politik.rss' },
  { src: 'Berlingske', url: 'https://www.berlingske.dk/rss/berlingske.rss' },
  { src: 'Politiken', url: 'https://politiken.dk/rss/' },
];

/* ── Keywords that signal a scope change / refinement ────────────────── */
const SCOPE_CHANGE_PATTERNS = [
  /kun for\s+\w/i,
  /begrænset til/i,
  /indfasning|indfases|indfaset/i,
  /fase\s*\d|første fase|anden fase/i,
  /udskudt|udskydes/i,
  /ændret|ændres/i,
  /justeret|justeres/i,
  /tilbagetrukket|trækkes tilbage/i,
  /droppet|dropper|opgiver/i,
  /reduceret|reduceres/i,
  /revideret|revideres/i,
  /ikke længere/i,
  /skrinlægger|skrinlagt/i,
  /afblæst|aflyst/i,
  /lempes|strammes/i,
];

/* ── Minimal RSS parser (no deps) ────────────────────────────────────── */
function parseRSS(xml, src) {
  const items = [];
  const reItem = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = reItem.exec(xml)) !== null && items.length < 30) {
    const b = m[1];
    const get = re => (b.match(re) || [])[1] || '';
    const clean = s => s
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#\d+;/g, '').trim();
    const title   = clean(get(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i));
    const link    = clean(get(/<link[^>]*>\s*(https?[^\s<]+)/i));
    const desc    = clean(get(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)).slice(0, 500);
    const pub     = clean(get(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i));
    if (!title || !link) continue;
    const pubMs = pub ? new Date(pub).getTime() : Date.now();
    if (Date.now() - pubMs > 7 * 24 * 3600 * 1000) continue; // skip > 7 days old
    items.push({ title, link, desc, pub, pubMs, src });
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'statsbudget.dk/3.0 (+https://www.statsbudget.dk)' }
    });
    if (!res.ok) return [];
    return parseRSS(await res.text(), feed.src);
  } catch {
    return [];
  }
}

/* ── Load promise keyword sets ──────────────────────────────────────── */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadPromiseKeywords() {
  // First try DB (populated by seedKeywords), fall back to JSON file
  try {
    const rows = db.prepare('SELECT id, keywords_json FROM promise_keywords').all();
    if (rows.length) return rows.map(r => ({ id: r.id, keywords: JSON.parse(r.keywords_json) }));
  } catch {}
  // Fall back to keywords JSON file
  const raw = readFileSync(path.join(__dirname, '..', 'data', 'promise-keywords.json'), 'utf8');
  const map = JSON.parse(raw);
  return Object.entries(map).map(([id, keywords]) => ({ id, keywords }));
}

/* ── Match article text against promise keywords ─────────────────────── */
function matchesPromise(text, keywords) {
  const t = text.toLowerCase();
  return keywords.some(kw => t.includes(kw.toLowerCase()));
}

function detectScopeChange(text) {
  return SCOPE_CHANGE_PATTERNS.some(p => p.test(text));
}

/* ── Store signal in DB (lazy-init after table creation) ─────────────── */
let _insertSignal = null;
function insertSignal(...args) {
  if (!_insertSignal) {
    _insertSignal = db.prepare(`
      INSERT OR IGNORE INTO promise_signals
        (promise_id, title, summary, source, url, pub_date, signal_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
  }
  return _insertSignal.run(...args);
}

/* ── Main scan loop ──────────────────────────────────────────────────── */
async function scan() {
  let keywordSets;
  try {
    keywordSets = loadPromiseKeywords();
  } catch (e) {
    console.warn('[monitor] No keyword table yet:', e.message);
    return;
  }
  if (!keywordSets.length) return;

  const allItems = (await Promise.all(FEEDS.map(fetchFeed))).flat();
  let newSignals = 0;

  for (const item of allItems) {
    const text = `${item.title} ${item.desc}`;
    for (const { id, keywords } of keywordSets) {
      if (!matchesPromise(text, keywords)) continue;
      const isScope = detectScopeChange(text);
      const type    = isScope ? 'scope_change' : 'mention';
      const result  = insertSignal(
        id, item.title, item.desc.slice(0, 300),
        item.src, item.link, item.pub || null, type
      );
      if (result.changes) {
        newSignals++;
        if (isScope) {
          console.log(`[monitor] Scope-change signal for ${id}: "${item.title.slice(0, 60)}"`);
        }
      }
    }
  }

  if (newSignals > 0) {
    console.log(`[monitor] Scan complete — ${newSignals} new signals from ${allItems.length} articles`);
  }
}

/* ── Public API ──────────────────────────────────────────────────────── */
export function startMonitor() {
  // Ensure tables exist before running
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS promise_keywords (
        id           TEXT PRIMARY KEY,
        keywords_json TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS promise_signals (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        promise_id   TEXT    NOT NULL,
        title        TEXT    NOT NULL,
        summary      TEXT,
        source       TEXT    NOT NULL,
        url          TEXT    NOT NULL,
        pub_date     TEXT,
        signal_type  TEXT    NOT NULL DEFAULT 'mention',
        detected_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        UNIQUE(url, promise_id)
      );

      CREATE TABLE IF NOT EXISTS promise_events (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        promise_id   TEXT    NOT NULL,
        event_type   TEXT    NOT NULL,
        description  TEXT    NOT NULL,
        source_url   TEXT,
        source_name  TEXT,
        event_date   TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_signals_promise  ON promise_signals(promise_id);
      CREATE INDEX IF NOT EXISTS idx_signals_type     ON promise_signals(signal_type);
      CREATE INDEX IF NOT EXISTS idx_events_promise   ON promise_events(promise_id);
    `);
  } catch (e) {
    console.error('[monitor] DB setup error:', e.message);
    return;
  }

  // Initial scan after 10s startup delay, then every 30 min
  setTimeout(() => scan().catch(e => console.error('[monitor] scan error:', e.message)), 10_000);
  setInterval(() => scan().catch(e => console.error('[monitor] scan error:', e.message)), 30 * 60 * 1000);

  console.log('[monitor] Promise monitor started — polling every 30 min');
}

export function seedKeywords(promises) {
  const upsert = db.prepare(
    'INSERT OR REPLACE INTO promise_keywords (id, keywords_json) VALUES (?, ?)'
  );
  const tx = db.transaction(() => {
    for (const p of promises) {
      if (p.keywords?.length) upsert.run(p.id, JSON.stringify(p.keywords));
    }
  });
  try { tx(); } catch {}
}

export { scan };
