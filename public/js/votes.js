// ── Community voting on news items, tweets and AI insights ───────────────────
// Votes persist in localStorage. A delegated document-level handler updates
// any rendered vote bar in-place without a full re-render.

VG.votes = {};

const VOTES_STORE = 'vg_votes_v1';

VG.votes.getAll = function() {
  try { return JSON.parse(localStorage.getItem(VOTES_STORE) || '{}'); }
  catch(e) { return {}; }
};

VG.votes.get = function(itemId) {
  return VG.votes.getAll()[itemId] || null;
};

// Cast or toggle a vote. Returns updated vote object.
VG.votes.vote = function(itemId, direction, basePos, baseNeg) {
  const all  = VG.votes.getAll();
  const curr = all[itemId] || { pos: basePos || 0, neg: baseNeg || 0, userVote: null };

  if (curr.userVote === direction) {
    // Toggle off (undo)
    curr.userVote = null;
    if (direction === 'pos') curr.pos = Math.max(0, curr.pos - 1);
    else                      curr.neg = Math.max(0, curr.neg - 1);
  } else {
    // Remove previous vote if switching
    if (curr.userVote === 'pos') curr.pos = Math.max(0, curr.pos - 1);
    if (curr.userVote === 'neg') curr.neg = Math.max(0, curr.neg - 1);
    curr.userVote = direction;
    if (direction === 'pos') curr.pos++;
    else                      curr.neg++;
  }

  all[itemId] = curr;
  localStorage.setItem(VOTES_STORE, JSON.stringify(all));
  return curr;
};

// Render a vote bar. Safe to call anywhere — uses data-* attrs for delegation.
VG.votes.renderBar = function(itemId, basePos, baseNeg) {
  const stored   = VG.votes.get(itemId);
  const pos      = stored ? stored.pos : (basePos || 0);
  const neg      = stored ? stored.neg : (baseNeg || 0);
  const userVote = stored ? stored.userVote : null;
  const total    = pos + neg;
  const posPct   = total > 0 ? Math.round(pos / total * 100) : 50;

  return `<div class="vbar" data-vid="${itemId}" data-bp="${basePos || 0}" data-bn="${baseNeg || 0}">
    <button class="vbar-btn vbar-pos${userVote === 'pos' ? ' on' : ''}" data-vdir="pos" title="Positiv stemme">
      👍 <span class="vbar-n">${pos}</span>
    </button>
    <div class="vbar-track" title="${posPct}% positive">
      <div class="vbar-fill" style="width:${posPct}%"></div>
    </div>
    <button class="vbar-btn vbar-neg${userVote === 'neg' ? ' on' : ''}" data-vdir="neg" title="Negativ stemme">
      👎 <span class="vbar-n">${neg}</span>
    </button>
    <span class="vbar-total">${total} stemmer</span>
  </div>`;
};

// Global delegated handler — intercepts clicks on ANY vote bar anywhere in the page
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-vdir]');
  if (!btn) return;
  const bar = btn.closest('[data-vid]');
  if (!bar) return;

  const itemId  = bar.dataset.vid;
  const dir     = btn.dataset.vdir;
  const basePos = parseInt(bar.dataset.bp || '0');
  const baseNeg = parseInt(bar.dataset.bn || '0');

  const result = VG.votes.vote(itemId, dir, basePos, baseNeg);
  if (result) {
    const tmp = document.createElement('div');
    tmp.innerHTML = VG.votes.renderBar(itemId, basePos, baseNeg);
    bar.replaceWith(tmp.firstElementChild);
  }
});

// Overall platform sentiment (used by dashboard widget + topbar badge)
VG.votes.getSentiment = function() {
  const all = VG.votes.getAll();
  let pos = 0, neg = 0;
  for (const v of Object.values(all)) {
    pos += v.pos || 0;
    neg += v.neg || 0;
  }
  const total = pos + neg;
  if (!total) return null;
  return { pos, neg, total, pct: Math.round(pos / total * 100) };
};

// Compact inline sentiment widget (used in topbar / dashboard cards)
VG.votes.renderSentimentBadge = function() {
  const s = VG.votes.getSentiment();
  if (!s) return '';
  const label = s.pct >= 60 ? 'Positiv' : s.pct <= 40 ? 'Negativ' : 'Blandet';
  const cls   = s.pct >= 60 ? 'sent-pos' : s.pct <= 40 ? 'sent-neg' : 'sent-mid';
  return `<span class="sentiment-badge ${cls}" title="${s.pos} positive / ${s.neg} negative stemmer">${label} ${s.pct}%</span>`;
};
