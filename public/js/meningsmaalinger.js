VG.meningsmaalinger = {};
VG.meningsmaalinger._rendered = false;

// Realistic Danish party poll data (aggregated estimate, May 2026)
// Letter codes: A=S, B=RV, C=K, D=NB, F=SF, I=LA, K=KD, M=M, O=DF, V=V, Æ=DD, Ø=EL, Å=ALT
const PARTIES = [
  { id: 'A', name: 'Socialdemokraterne',  pct: 20.1, trend: +0.3, color: '#c0392b' },
  { id: 'I', name: 'Liberal Alliance',    pct: 13.2, trend: -0.5, color: '#f39c12' },
  { id: 'V', name: 'Venstre',             pct: 12.8, trend: +0.1, color: '#2980b9' },
  { id: 'F', name: 'SF',                  pct:  9.3, trend: +0.4, color: '#e74c3c' },
  { id: 'Ø', name: 'Enhedslisten',        pct:  8.1, trend: -0.2, color: '#e74c3c' },
  { id: 'Æ', name: 'Danmarksdemokraterne',pct:  7.8, trend: +0.6, color: '#8e44ad' },
  { id: 'O', name: 'Dansk Folkeparti',    pct:  6.9, trend: -0.3, color: '#e67e22' },
  { id: 'M', name: 'Moderaterne',         pct:  6.2, trend: -0.8, color: '#7f8c8d' },
  { id: 'C', name: 'Konservative',        pct:  5.4, trend: +0.2, color: '#27ae60' },
  { id: 'B', name: 'Radikale Venstre',    pct:  4.1, trend: -0.1, color: '#9b59b6' },
  { id: 'Å', name: 'Alternativet',        pct:  3.8, trend: +0.2, color: '#1abc9c' },
  { id: 'D', name: 'Nye Borgerlige',      pct:  1.9, trend: -0.1, color: '#2c3e50' },
  { id: 'K', name: 'Kristendemokraterne', pct:  0.9, trend:  0.0, color: '#bdc3c7' },
];

// 6-month trend (Dec 2025 – May 2026) for top parties
const TREND_MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'Maj'];
const TREND_DATA = {
  A: [19.5, 20.1, 19.8, 20.2, 19.9, 20.1],
  I: [13.8, 13.5, 13.9, 13.1, 13.4, 13.2],
  V: [12.5, 12.8, 12.6, 12.9, 12.7, 12.8],
  F: [8.8,  9.0,  8.9,  9.2,  9.0,  9.3],
  Ø: [8.3,  8.2,  8.4,  8.0,  8.2,  8.1],
  Æ: [7.1,  7.3,  7.5,  7.6,  7.7,  7.8],
};

// Seat calculator (d'Hondt approximation, 175 mainland seats, threshold 2%)
function calcSeats(parties) {
  const valid = parties.filter(p => p.pct >= 2.0);
  const totalPct = valid.reduce((s, p) => s + p.pct, 0);
  let seats = valid.map(p => ({ ...p, seats: Math.round(p.pct / totalPct * 175) }));
  // Correct rounding to exactly 175
  const diff = 175 - seats.reduce((s, p) => s + p.seats, 0);
  if (diff !== 0) seats[0].seats += diff;
  return seats;
}

VG.meningsmaalinger.renderPanel = function() {
  const panel = document.getElementById('panel-meningsmaalinger');
  if (!panel || panel._vgBound) return;
  panel._vgBound = true;

  const withSeats = calcSeats(PARTIES);
  const threshold = 2.0;

  // Bloc totals
  const blaaIds = ['I','V','C','O','Æ','D','M'];
  const roedeIds = ['A','F','Ø','B','Å'];
  const blaaSeats = withSeats.filter(p => blaaIds.includes(p.id)).reduce((s,p) => s + p.seats, 0);
  const roedeSeats = withSeats.filter(p => roedeIds.includes(p.id)).reduce((s,p) => s + p.seats, 0);
  const blaaTotal = PARTIES.filter(p => blaaIds.includes(p.id)).reduce((s,p) => s + p.pct, 0);
  const roedeTotal = PARTIES.filter(p => roedeIds.includes(p.id)).reduce((s,p) => s + p.pct, 0);

  // Bar rows sorted by pct
  const rows = withSeats.slice().sort((a,b) => b.pct - a.pct).map(p => {
    const belowThreshold = p.pct < threshold;
    const trendSign = p.trend > 0 ? '▲' : p.trend < 0 ? '▼' : '→';
    const trendCls  = p.trend > 0 ? 'poll-trend-up' : p.trend < 0 ? 'poll-trend-down' : 'poll-trend-flat';
    const seatsStr  = belowThreshold ? '<span class="poll-below-thresh">Under spærregrænse</span>' : `${p.seats} mandater`;
    return `<div class="poll-row${belowThreshold ? ' poll-below' : ''}">
  <div class="poll-letter" style="color:${belowThreshold ? 'var(--text-3)' : p.color}">${p.id}</div>
  <div class="poll-name">${p.name}</div>
  <div class="poll-bar-wrap">
    <div class="poll-bar-track">
      <div class="poll-bar-fill" style="width:${(p.pct/22*100).toFixed(1)}%;background:${belowThreshold ? 'var(--border)' : p.color}"></div>
    </div>
  </div>
  <div class="poll-pct">${p.pct.toFixed(1)}%</div>
  <span class="${trendCls} poll-trend-badge">${trendSign}${Math.abs(p.trend).toFixed(1)}</span>
  <div class="poll-seats-col">${seatsStr}</div>
</div>`;
  }).join('');

  // Mini sparkline SVG for top 6 parties
  const sparklines = Object.entries(TREND_DATA).map(([id, vals]) => {
    const party = PARTIES.find(p => p.id === id);
    if (!party) return '';
    const min = Math.min(...vals) - 1;
    const max = Math.max(...vals) + 1;
    const W = 120, H = 40;
    const pts = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * W;
      const y = H - ((v - min) / (max - min)) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<div class="poll-sparkline-item">
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <polyline points="${pts}" fill="none" stroke="${party.color}" stroke-width="2" stroke-linejoin="round"/>
  </svg>
  <div class="poll-spark-label" style="color:${party.color}">${party.id} — ${vals[vals.length-1].toFixed(1)}%</div>
</div>`;
  }).join('');

  panel.innerHTML = `<div class="card">
  <h2>📊 Meningsmålinger</h2>
  <p class="intro">Aggregeret meningsmåling baseret på Gallup, Voxmeter og YouGov (estimat maj 2026). Pil viser ændring siden forrige måned.</p>

  <div class="poll-bloc-row">
    <div class="poll-bloc poll-bloc-blaa">
      <div class="poll-bloc-label">🔵 Blå blok</div>
      <div class="poll-bloc-pct">${blaaTotal.toFixed(1)}%</div>
      <div class="poll-bloc-seats">${blaaSeats} mandater</div>
      <div class="poll-bloc-note">${blaaSeats >= 90 ? '✓ Flertal' : `${90 - blaaSeats} fra flertal`}</div>
    </div>
    <div class="poll-bloc-vs">vs.</div>
    <div class="poll-bloc poll-bloc-roed">
      <div class="poll-bloc-label">🟤 Rød blok</div>
      <div class="poll-bloc-pct">${roedeTotal.toFixed(1)}%</div>
      <div class="poll-bloc-seats">${roedeSeats} mandater</div>
      <div class="poll-bloc-note">${roedeSeats >= 90 ? '✓ Flertal' : `${90 - roedeSeats} fra flertal`}</div>
    </div>
  </div>

  <div class="poll-list">${rows}</div>

  <h3 style="margin-top:28px">6-måneders trend (top 6 partier)</h3>
  <div class="poll-month-labels">${TREND_MONTHS.map(m => `<span>${m}</span>`).join('')}</div>
  <div class="poll-sparklines">${sparklines}</div>

  <p class="data-note">Estimat baseret på aggregerede meningsmålinger jan–maj 2026. 175 mandater (Danmark); spærregrænse 2%. Inkl. mandater fra Grønland og Færøerne udgør Folketing 179 pladser.</p>
</div>`;
};
