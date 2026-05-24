VG.maskinen = {};

/* ── Cluster definitions ─────────────────────────────────────────────── */
VG.maskinen.CLUSTER_COLORS = {
  velfaerd:   '#1e7eb4',
  klima:      '#2d8a50',
  okonomi:    '#0a7a8a',
  samfund:    '#6b5ea8',
  uddannelse: '#b87333',
  sikkerhed:  '#9a4040',
};

/* ── Node definitions (id, label, emoji, SVG x/y, cluster, key stat) ── */
VG.maskinen.NODES = [
  // Velfærd
  { id: 'sundhed',      label: 'Sundhed',      emoji: '🏥', x: 130, y: 88,  cluster: 'velfaerd',   stat: 'Offentligt sundhedsvæsen' },
  { id: 'psykiatri',    label: 'Psykiatri',    emoji: '🧠', x: 65,  y: 178, cluster: 'velfaerd',   stat: '2,1 års ventetid' },
  { id: 'ventetider',   label: 'Ventetider',   emoji: '⏳', x: 200, y: 170, cluster: 'velfaerd',   stat: 'Hospitalsventetider' },
  { id: 'aeldrepleje',  label: 'Ældrepleje',   emoji: '👴', x: 262, y: 88,  cluster: 'velfaerd',   stat: '65.000 ansatte' },
  // Klima
  { id: 'co2',          label: 'CO₂ & Klima',  emoji: '🌿', x: 742, y: 88,  cluster: 'klima',      stat: '47% CO₂-reduktion' },
  { id: 'energi',       label: 'Energi',        emoji: '⚡', x: 828, y: 168, cluster: 'klima',      stat: '84% vedvarende el' },
  { id: 'naturvand',    label: 'Natur & Vand',  emoji: '🌊', x: 658, y: 168, cluster: 'klima',      stat: '39 mg/l nitrat' },
  { id: 'landbrug',     label: 'Landbrug',      emoji: '🌾', x: 802, y: 48,  cluster: 'klima',      stat: '14,8 mio. svin' },
  // Økonomi
  { id: 'overview',     label: 'Budget',        emoji: '📊', x: 450, y: 208, cluster: 'okonomi',    stat: 'Finanslov 2026' },
  { id: 'statsgaeld',   label: 'Statsgæld',     emoji: '🏦', x: 372, y: 148, cluster: 'okonomi',    stat: '28,1% af BNP' },
  { id: 'erhverv',      label: 'Erhverv',        emoji: '🏢', x: 530, y: 148, cluster: 'okonomi',    stat: 'BNP +2,3%' },
  { id: 'inflation',    label: 'Inflation',      emoji: '📈', x: 428, y: 284, cluster: 'okonomi',    stat: '2,1% år/år' },
  // Samfund
  { id: 'demografi',    label: 'Demografi',      emoji: '📊', x: 108, y: 302, cluster: 'samfund',    stat: '5,97 mio. indb.' },
  { id: 'indkomst',     label: 'Indkomst',       emoji: '💰', x: 175, y: 374, cluster: 'samfund',    stat: 'Gini: 29,2' },
  { id: 'boligmarked',  label: 'Boligmarked',    emoji: '🏗', x: 102, y: 438, cluster: 'samfund',    stat: 'Median 2,35 mio.' },
  // Uddannelse / Integration
  { id: 'folkeskolen',  label: 'Folkeskolen',    emoji: '🏫', x: 312, y: 448, cluster: 'uddannelse', stat: '1 af 4 forlader' },
  { id: 'integration',  label: 'Integration',    emoji: '🌍', x: 516, y: 448, cluster: 'uddannelse', stat: '15,2% af befolkning' },
  { id: 'ledighed',     label: 'Ledighed',       emoji: '📉', x: 412, y: 365, cluster: 'uddannelse', stat: '4,8%' },
  // Sikkerhed
  { id: 'forsvar',      label: 'Forsvar',        emoji: '🛡️', x: 795, y: 295, cluster: 'sikkerhed',  stat: '1,65% → 3% BNP' },
  { id: 'kriminalitet', label: 'Kriminalitet',   emoji: '🚨', x: 822, y: 382, cluster: 'sikkerhed',  stat: '▼ 31% siden 2005' },
];

/* ── Edges (undirected connections between node IDs) ─────────────────── */
VG.maskinen.EDGES = [
  ['sundhed',     'psykiatri'],
  ['sundhed',     'ventetider'],
  ['sundhed',     'aeldrepleje'],
  ['psykiatri',   'folkeskolen'],
  ['psykiatri',   'ledighed'],
  ['aeldrepleje', 'demografi'],
  ['co2',         'energi'],
  ['co2',         'landbrug'],
  ['naturvand',   'landbrug'],
  ['overview',    'statsgaeld'],
  ['overview',    'erhverv'],
  ['overview',    'inflation'],
  ['erhverv',     'ledighed'],
  ['erhverv',     'inflation'],
  ['inflation',   'indkomst'],
  ['indkomst',    'boligmarked'],
  ['demografi',   'aeldrepleje'],
  ['demografi',   'ledighed'],
  ['folkeskolen', 'integration'],
  ['folkeskolen', 'ledighed'],
  ['integration', 'ledighed'],
  ['integration', 'kriminalitet'],
  ['forsvar',     'statsgaeld'],
];

/* ── Connection lookup: panelId → [connected panelIds] ─────────────────*/
VG.maskinen._connMap = {};
VG.maskinen.EDGES.forEach(([a, b]) => {
  (VG.maskinen._connMap[a] = VG.maskinen._connMap[a] || []).push(b);
  (VG.maskinen._connMap[b] = VG.maskinen._connMap[b] || []).push(a);
});

/* ── Tab → Group reverse lookup ──────────────────────────────────────── */
VG.maskinen.TAB_GROUP = {
  borger:'personligt', bolig:'personligt', pension:'personligt', elpris:'personligt',
  overview:'samfund', demographics:'samfund', kommuner:'samfund', sundhed:'samfund',
  forbrug:'samfund', energi:'samfund', ledighed:'samfund', ventetider:'samfund',
  dsb:'samfund', aeldrepleje:'samfund', boligmarked:'samfund', indkomst:'samfund',
  co2:'samfund', kriminalitet:'samfund', uddannelse:'samfund', inflation:'samfund',
  udenrigshandel:'samfund', landbrug:'samfund', folkesundhed:'samfund', ligestilling:'samfund',
  velfaerdsstat:'samfund', generationsregnskab:'samfund', arbejdsmiljoe:'samfund',
  medietillid:'samfund', groenomstilling:'samfund', boligkrise:'samfund',
  psykiatri:'samfund', folkeskolen:'samfund', naturvand:'samfund', integration:'samfund',
  forsvar:'samfund',
  platform:'politik', party:'politik', partier:'politik', regering:'politik',
  folketing:'politik', mandater:'politik', valgkort:'politik', meningsmaalinger:'politik',
  rygter:'oekonomi', policy:'oekonomi', spending:'oekonomi', revenue:'oekonomi',
  projection:'oekonomi', historik:'oekonomi', scenarios:'oekonomi',
  statsgaeld:'oekonomi', erhverv:'oekonomi', innovation:'oekonomi',
};

/* Navigate to a panel from anywhere ─────────────────────────────────── */
window.__mkClick = function(tabId) {
  const group = VG.maskinen.TAB_GROUP[tabId] || 'samfund';
  if (window.__switchGroup) window.__switchGroup(group);
  setTimeout(() => {
    const btn = document.querySelector(`.sub-tab[data-tab="${tabId}"]`);
    if (btn) btn.click();
  }, 20);
};

/* ── Render systems diagram (returns HTML string) ────────────────────── */
VG.maskinen.renderDiagram = function() {
  const W = 900, H = 510;
  const nodeMap = {};
  VG.maskinen.NODES.forEach(n => { nodeMap[n.id] = n; });
  const CC = VG.maskinen.CLUSTER_COLORS;

  const edges = VG.maskinen.EDGES.map(([a, b]) => {
    const na = nodeMap[a], nb = nodeMap[b];
    if (!na || !nb) return '';
    const mx = (na.x + nb.x) / 2;
    const my = (na.y + nb.y) / 2 - 20;
    return `<path d="M${na.x},${na.y} Q${mx},${my} ${nb.x},${nb.y}" class="mk-edge"/>`;
  }).join('');

  const nodes = VG.maskinen.NODES.map(n => {
    const c = CC[n.cluster];
    return `<g class="mk-node" onclick="window.__mkClick('${n.id}')">
      <circle cx="${n.x}" cy="${n.y}" r="30" fill="${c}" fill-opacity="0.15" stroke="${c}" stroke-width="1.5" class="mk-ring"/>
      <text x="${n.x}" y="${n.y - 6}" text-anchor="middle" dominant-baseline="middle" class="mk-emoji">${n.emoji}</text>
      <text x="${n.x}" y="${n.y + 18}" text-anchor="middle" class="mk-label">${n.label}</text>
      <title>${n.label} — ${n.stat}</title>
    </g>`;
  }).join('');

  const clusterTags = [
    { t: 'VELFÆRD',    x: 163, y: 20,  c: CC.velfaerd },
    { t: 'KLIMA',      x: 742, y: 20,  c: CC.klima },
    { t: 'ØKONOMI',    x: 450, y: 110, c: CC.okonomi },
    { t: 'SAMFUND',    x: 185, y: 258, c: CC.samfund },
    { t: 'UDDANNELSE', x: 412, y: 415, c: CC.uddannelse },
    { t: 'SIKKERHED',  x: 820, y: 258, c: CC.sikkerhed },
  ].map(t => `<text x="${t.x}" y="${t.y}" text-anchor="middle" class="mk-cluster-tag" fill="${t.c}">${t.t}</text>`).join('');

  return `<div class="mk-wrap">
  <div class="mk-header">
    <h2>🇩🇰 Danmarksmaskinen</h2>
    <p class="mk-sub">Klik på et emne for at udforske data. Linjerne viser hvor tingene hænger sammen.</p>
  </div>
  <svg class="mk-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${clusterTags}
    <g class="mk-edges">${edges}</g>
    <g class="mk-nodes">${nodes}</g>
  </svg>
  <p class="mk-hint">💡 Tip: Ændr budgettet i Økonomi-fanen — sundhedsmåleren øverst opdateres i realtid</p>
</div>`;
};

/* ── Health strip (6 live indicators) ───────────────────────────────── */
VG.maskinen.renderHealth = function() {
  const el = document.getElementById('health-strip');
  if (!el) return;

  let balPct = 0, expRatio = 1, revRatio = 1;
  try {
    if (VG.state.current && VG.state.baseline) {
      const bal = VG.sumRev() - VG.sumExp();
      balPct = bal / VG.state.baseline.gdp * 100;
      expRatio = VG.sumExp() / (VG.baseExp() || 1);
      revRatio = VG.sumRev() / (VG.baseRev() || 1);
    }
  } catch(e) {}

  // Scores 0-100
  const oekoScore    = Math.max(5,  Math.min(98, 62 + balPct * 9));
  const velfaerdScore = Math.max(10, Math.min(95, 65 + (expRatio - 1) * 90));
  const klimaScore    = 52; // reflects ~47% CO₂ reduction vs 70% target
  const sikkerScore   = Math.max(10, Math.min(95, 54 + (expRatio - 1) * 60));
  const uddScore      = Math.max(10, Math.min(95, 62 + (expRatio - 1) * 70));
  const lighedScore   = Math.max(10, Math.min(95, 59 + (expRatio - 1) * 50 - (revRatio - 1) * 30));

  const dims = [
    { label: 'Økonomi',    emoji: '💰', score: oekoScore,     note: `${balPct >= 0 ? '+' : ''}${balPct.toFixed(1)}% BNP saldo` },
    { label: 'Velfærd',    emoji: '🏥', score: velfaerdScore, note: 'Sundhed & omsorg' },
    { label: 'Klima',      emoji: '🌱', score: klimaScore,    note: '47% mod 70%-mål' },
    { label: 'Sikkerhed',  emoji: '🛡️', score: sikkerScore,   note: '1,65% BNP forsvar' },
    { label: 'Uddannelse', emoji: '🎓', score: uddScore,      note: 'Folkeskole → uni' },
    { label: 'Lighed',     emoji: '⚖️', score: lighedScore,   note: 'Gini & overførsler' },
  ];

  el.innerHTML = dims.map(d => {
    const sc  = Math.round(d.score);
    const col = sc >= 68 ? 'var(--neg)' : sc >= 44 ? 'var(--warn)' : 'var(--pos)';
    return `<div class="hs-item" title="${d.label}: ${d.note}">
      <span class="hs-emoji">${d.emoji}</span>
      <div class="hs-body">
        <div class="hs-row">
          <span class="hs-label">${d.label}</span>
          <span class="hs-score" style="color:${col}">${sc}</span>
        </div>
        <div class="hs-track"><div class="hs-fill" style="width:${sc}%;background:${col}"></div></div>
      </div>
    </div>`;
  }).join('');
};

/* ── Connection strip for individual panels ──────────────────────────── */
VG.maskinen.renderConnectionStrip = function(tabId) {
  const connected = VG.maskinen._connMap[tabId];
  if (!connected || !connected.length) return '';
  const nodeMap = {};
  VG.maskinen.NODES.forEach(n => { nodeMap[n.id] = n; });
  const chips = connected.map(id => {
    const n = nodeMap[id];
    if (!n) return '';
    return `<button class="mk-chip" onclick="window.__mkClick('${id}')">${n.emoji} ${n.label}</button>`;
  }).filter(Boolean).join('');
  if (!chips) return '';
  return `<div class="mk-conn-strip"><span class="mk-conn-lbl">Hænger sammen med</span>${chips}</div>`;
};

/* ── Inject connection strip into active panel (called from fast()) ──── */
VG.maskinen.injectConnections = function(tabId) {
  const panel = document.getElementById('panel-' + tabId);
  if (!panel || panel.querySelector('.mk-conn-strip')) return;
  const html = VG.maskinen.renderConnectionStrip(tabId);
  if (html) panel.insertAdjacentHTML('beforeend', html);
};
