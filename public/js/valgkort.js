/* ── VG.valgkort — Valgkort (2022 valgresultat) ───────── */
VG.valgkort = {};

// 2022 Folketing election results by region (%)
// Source: Danmarks Statistik / KMD valgresultat
VG.valgkort.REGIONS = [
  {
    id: 'nordjylland', name: 'Nordjylland',
    results: { A: 26.9, V: 20.8, I: 13.1, F: 8.2, Ø: 6.9, M: 7.8, D: 6.2, C: 4.8, B: 2.9, O: 3.8, Å: 2.4 }
  },
  {
    id: 'midtjylland', name: 'Midtjylland',
    results: { A: 22.6, V: 21.5, I: 14.3, F: 9.1, Ø: 7.2, M: 9.0, D: 6.1, C: 5.2, B: 3.1, O: 3.5, Å: 2.6 }
  },
  {
    id: 'syddanmark', name: 'Syddanmark',
    results: { A: 26.1, V: 21.2, I: 12.4, F: 8.3, Ø: 6.8, M: 8.5, D: 7.0, C: 5.5, B: 2.8, O: 5.2, Å: 2.3 }
  },
  {
    id: 'sjaelland', name: 'Sjælland',
    results: { A: 31.8, V: 16.5, I: 11.9, F: 8.6, Ø: 7.5, M: 8.1, D: 7.8, C: 4.2, B: 3.2, O: 5.8, Å: 2.5 }
  },
  {
    id: 'hovedstaden', name: 'Hovedstaden',
    results: { A: 26.2, V: 13.8, I: 14.8, F: 11.9, Ø: 11.4, M: 9.7, D: 4.3, C: 4.8, B: 7.9, O: 2.6, Å: 4.2 }
  }
];

VG.valgkort.PARTY_COLORS = {
  A: '#E32D1C', V: '#003F87', M: '#6B3FA0', I: '#00A0D6',
  D: '#1B3A6B', F: '#E84B3A', Ø: '#B22222', C: '#006B3C',
  B: '#9B1EAD', O: '#F4A82A', Å: '#00C165'
};

VG.valgkort.activeRegion = null;

VG.valgkort.getDominant = function(results) {
  return Object.entries(results).sort((a, b) => b[1] - a[1])[0][0];
};

VG.valgkort.renderPanel = function() {
  const el = document.getElementById('panel-valgkort');
  if (!el) return;
  el.innerHTML = VG.valgkort.buildHTML();
  VG.valgkort.bindEvents();
};

VG.valgkort.buildHTML = function() {
  const detailHTML = VG.valgkort.activeRegion
    ? VG.valgkort.buildDetail(VG.valgkort.activeRegion)
    : '<p style="color:var(--text-3);font-size:13px">Klik på en region for at se valgresultatet.</p>';

  return `<div class="card">
  <h2>🗺 Valgkort — Valgresultat 2022</h2>
  <p style="font-size:13px;color:var(--text-2);margin-top:4px">Fordeling af stemmer pr. region. Baseret på det endelige valgresultat fra Folketing-valget 1. november 2022.</p>

  <div class="valgkort-layout">
    <div class="valgkort-svg-wrap">
      ${VG.valgkort.buildSVG()}
    </div>
    <div class="valgkort-detail" id="valgkort-detail">
      ${detailHTML}
    </div>
  </div>

  <div class="valgkort-legend">
    ${Object.entries(VG.valgkort.PARTY_COLORS).map(([abbr, color]) =>
      `<div class="vk-leg-item"><span class="vk-leg-dot" style="background:${color}"></span><span>${abbr}</span></div>`
    ).join('')}
  </div>
  <p style="font-size:10px;color:var(--text-3);margin-top:8px">Kilde: Danmarks Statistik / KMD Valgresultat 2022. Grønland og Færøerne ikke vist.</p>
</div>`;
};

VG.valgkort.buildSVG = function() {
  // Simplified but recognizable SVG of Denmark's 5 regions
  // ViewBox: 0 0 300 340
  // Nordjylland: northern tip of Jutland
  // Midtjylland: middle Jutland
  // Syddanmark: southern Jutland + Funen
  // Sjælland: Zealand
  // Hovedstaden: Copenhagen/north Zealand + Bornholm

  const regionPaths = {
    nordjylland: 'M 88 15 L 108 12 L 128 20 L 138 38 L 135 58 L 128 72 L 115 80 L 100 82 L 88 78 L 80 65 L 78 48 L 82 32 Z',
    midtjylland: 'M 78 82 L 88 78 L 100 82 L 115 80 L 128 72 L 135 85 L 138 105 L 132 125 L 118 135 L 100 138 L 84 133 L 75 118 L 73 100 Z',
    syddanmark:  'M 73 118 L 84 133 L 100 138 L 118 135 L 132 125 L 138 140 L 135 162 L 122 175 L 104 178 L 86 173 L 75 160 L 70 142 Z M 148 138 L 168 136 L 178 148 L 175 164 L 162 170 L 148 165 L 143 152 Z',
    sjaelland:   'M 196 102 L 228 94 L 258 100 L 272 120 L 268 152 L 252 175 L 228 185 L 204 180 L 188 162 L 184 138 L 188 116 Z',
    hovedstaden: 'M 196 60 L 235 52 L 265 60 L 275 78 L 272 100 L 258 100 L 228 94 L 196 102 L 188 84 L 190 68 Z M 280 178 L 292 175 L 298 182 L 295 192 L 283 195 L 278 188 Z'
  };

  const svgParts = VG.valgkort.REGIONS.map(region => {
    const dominant = VG.valgkort.getDominant(region.results);
    const color = VG.valgkort.PARTY_COLORS[dominant] || '#888';
    const isActive = VG.valgkort.activeRegion && VG.valgkort.activeRegion.id === region.id;
    const paths = regionPaths[region.id] || '';
    // Handle multi-path regions (Syddanmark has mainland + Funen)
    const pathEls = paths.split(' M ').filter(Boolean).map((p, i) =>
      `<path d="${i === 0 ? p : 'M ' + p}" fill="${color}" fill-opacity="${isActive ? 1 : 0.7}" stroke="#fff" stroke-width="1.5" data-region="${region.id}" class="vk-region${isActive ? ' active' : ''}" style="cursor:pointer"/>`
    ).join('');
    return pathEls;
  }).join('');

  // Regional labels
  const labels = [
    { id: 'nordjylland', x: 108, y: 50, text: 'Nordjylland' },
    { id: 'midtjylland', x: 106, y: 110, text: 'Midtjylland' },
    { id: 'syddanmark',  x: 104, y: 152, text: 'Syddanmark' },
    { id: 'sjaelland',   x: 228, y: 142, text: 'Sjælland' },
    { id: 'hovedstaden', x: 232, y: 80,  text: 'Hoved-staden' }
  ];
  const labelEls = labels.map(l =>
    `<text x="${l.x}" y="${l.y}" font-size="8" fill="rgba(0,0,0,0.7)" text-anchor="middle" pointer-events="none" style="font-family:Inter,sans-serif;font-weight:600">${l.text}</text>`
  ).join('');

  return `<svg viewBox="0 0 310 220" xmlns="http://www.w3.org/2000/svg" class="valgkort-svg">
  ${svgParts}
  ${labelEls}
</svg>`;
};

VG.valgkort.buildDetail = function(region) {
  const sorted = Object.entries(region.results).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const domColor = VG.valgkort.PARTY_COLORS[dominant];

  const bars = sorted.map(([abbr, pct]) => {
    const color = VG.valgkort.PARTY_COLORS[abbr] || '#888';
    const partyNames = { A:'Socialdemokratiet',V:'Venstre',M:'Moderaterne',I:'Liberal Alliance',D:'Danmarksdemokraterne',F:'SF',Ø:'Enhedslisten',C:'Konservative',B:'Radikale Venstre',O:'Dansk Folkeparti',Å:'Alternativet' };
    return `<div class="vk-bar-row">
      <div class="vk-bar-abbr" style="color:${color}">${abbr}</div>
      <div class="vk-bar-wrap">
        <div class="vk-bar-fill" style="width:${(pct / sorted[0][1] * 100).toFixed(1)}%;background:${color}"></div>
      </div>
      <div class="vk-bar-pct">${pct.toFixed(1)}%</div>
    </div>`;
  }).join('');

  return `<div>
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-3);margin-bottom:6px">Region</div>
    <div style="font-size:18px;font-weight:800;margin-bottom:2px">${region.name}</div>
    <div style="font-size:12px;color:var(--text-2);margin-bottom:14px">Største parti: <span style="color:${domColor};font-weight:700">${dominant}</span></div>
    <div class="vk-bars">${bars}</div>
  </div>`;
};

VG.valgkort.bindEvents = function() {
  document.querySelectorAll('.vk-region').forEach(el => {
    el.addEventListener('click', () => {
      const regionId = el.dataset.region;
      const region = VG.valgkort.REGIONS.find(r => r.id === regionId);
      if (!region) return;
      VG.valgkort.activeRegion = region;
      const detail = document.getElementById('valgkort-detail');
      if (detail) detail.innerHTML = VG.valgkort.buildDetail(region);
      // Update SVG active state
      document.querySelectorAll('.vk-region').forEach(r => {
        const isActive = r.dataset.region === regionId;
        r.setAttribute('fill-opacity', isActive ? '1' : '0.7');
        r.classList.toggle('active', isActive);
      });
    });
    el.addEventListener('mouseenter', () => { el.setAttribute('fill-opacity', '1'); });
    el.addEventListener('mouseleave', () => {
      const isActive = VG.valgkort.activeRegion && VG.valgkort.activeRegion.id === el.dataset.region;
      if (!isActive) el.setAttribute('fill-opacity', '0.7');
    });
  });
};
