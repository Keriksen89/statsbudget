VG.rygter = {};

VG.rygter._data      = null;
VG.rygter._scenarios = null;
VG.rygter._filter    = 'Alle';
VG.rygter._sort      = 'nyeste';

// Category color map (all neutral — NO party colors)
VG.rygter.CAT_COLORS = {
  Skat:          'var(--warn)',
  Velfærd:       'var(--neg)',
  Klima:         '#2d8a50',
  Bolig:         '#6b5ea8',
  Forsvar:       '#8a5c2d',
  Uddannelse:    'var(--accent)',
  Sundhed:       '#c05858',
  Arbejdsmarked: '#4a7fa5',
  Immigration:   '#7a6b55',
  Pension:       '#5a8a7a',
  Øvrig:         'var(--text-3)',
};

VG.rygter.CONFIDENCE_LABELS = {
  rygte:        { label: 'Rygte',        cls: 'conf-rygte' },
  forhandling:  { label: 'Forhandling',  cls: 'conf-forhandling' },
  forslag:      { label: 'Forslag',      cls: 'conf-forslag' },
  vedtaget:     { label: 'Vedtaget',     cls: 'conf-vedtaget' },
};

const ALL_CATEGORIES = ['Alle','Skat','Velfærd','Klima','Bolig','Forsvar','Uddannelse','Sundhed','Arbejdsmarked','Immigration','Pension','Øvrig'];

VG.rygter.load = async function() {
  try {
    const data = await fetch('/api/rygter/feed').then(r => r.json());
    VG.rygter._data = Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('[rygter] feed load failed', e);
    VG.rygter._data = [];
  }
};

VG.rygter.loadScenarios = async function() {
  try {
    const data = await fetch('/api/rygter/scenarios').then(r => r.json());
    VG.rygter._scenarios = Array.isArray(data) ? data : null;
  } catch (e) {
    console.warn('[rygter] scenarios load failed', e);
    VG.rygter._scenarios = null;
  }
};

VG.rygter.renderPanel = async function() {
  const panel = document.getElementById('panel-rygter');
  if (!panel) return;

  if (!VG.rygter._data) {
    panel.innerHTML = '<div class="panel-loading">Henter politiske nyheder og analyserer økonomi…</div>';
    await Promise.all([VG.rygter.load(), VG.rygter.loadScenarios()]);
  }

  VG.rygter._renderContent(panel);
};

VG.rygter._renderContent = function(panel) {
  const data = VG.rygter._data || [];

  // Filter
  let filtered = data;
  if (VG.rygter._filter !== 'Alle') {
    filtered = data.filter(item => item.impact && item.impact.category === VG.rygter._filter);
  }

  // Sort
  if (VG.rygter._sort === 'fiscal') {
    filtered = [...filtered].sort((a, b) => {
      const aF = a.impact ? Math.abs(a.impact.fiscalBn || 0) : 0;
      const bF = b.impact ? Math.abs(b.impact.fiscalBn || 0) : 0;
      return bF - aF;
    });
  }

  const filterBtns = ALL_CATEGORIES.map(cat => {
    const active = VG.rygter._filter === cat ? ' active' : '';
    return `<button class="rygte-btn${active}" data-filter="${cat}">${cat}</button>`;
  }).join('');

  const sortNewActive  = VG.rygter._sort === 'nyeste' ? ' active' : '';
  const sortFiscActive = VG.rygter._sort === 'fiscal' ? ' active' : '';

  const cards = filtered.length === 0
    ? '<div class="rygte-empty">Ingen nyheder i denne kategori.</div>'
    : filtered.map(item => VG.rygter._renderCard(item)).join('');

  const scenariosHtml = VG.rygter._scenarios
    ? VG.rygter._renderScenarios(VG.rygter._scenarios)
    : '';

  panel.innerHTML = `
<div class="card">
  ${scenariosHtml}
  <h2 style="margin-top:${scenariosHtml ? '32px' : '0'}">📰 Nyheder med DREAM-analyse</h2>
  <p class="intro" style="margin-bottom:16px">Politiske nyheder fra DR, TV2, Jyllands-Posten, Berlingske, Politiken og Weekendavisen — analyseret med DREAM/MAKRO-inspirerede parametre. Klik på et nyhedskort for at se den fulde analyse.</p>
  <div class="rygte-toolbar">
    <div class="rygte-filters" id="rygte-filters">${filterBtns}</div>
    <div class="rygte-sort-wrap">
      <span class="rygte-sort-label">Sorter:</span>
      <button class="rygte-btn${sortNewActive}" data-sort="nyeste">Nyeste</button>
      <button class="rygte-btn${sortFiscActive}" data-sort="fiscal">Størst impact</button>
    </div>
  </div>
  <div class="rygte-list" id="rygte-list">${cards}</div>
  <p class="rygte-global-disclaimer">DREAM/MAKRO-estimater er automatisk genererede og ikke officielle analyser. Kilder: DR, TV2, Jyllands-Posten, Berlingske, Politiken, Weekendavisen (RSS).</p>
</div>`;

  VG.rygter._bindEvents(panel);
};

VG.rygter._renderScenarios = function(scenarios) {
  const cards = scenarios.map(s => {
    const c = s.combined;

    // Fiscal balance: positive = budget improves, negative = more deficit
    const fiscalPos  = c.fiscalBn >= 0;
    const fiscalColor = fiscalPos ? 'var(--neg)' : 'var(--pos)';
    const fiscalLabel = fiscalPos
      ? `+${c.fiscalBn.toFixed(1).replace('.', ',')} mia. kr./år bedre balance`
      : `${c.fiscalBn.toFixed(1).replace('.', ',')} mia. kr./år mere underskud`;

    const gdpSign  = c.gdpPct  >= 0 ? '+' : '';
    const gdpColor = c.gdpPct  >= 0 ? 'var(--neg)' : 'var(--pos)';
    const empSign  = c.employmentK >= 0 ? '+' : '';
    const empColor = c.employmentK >= 0 ? 'var(--neg)' : 'var(--pos)';

    const giniLabel = c.giniDelta < -0.05 ? 'Mere lighed' : c.giniDelta > 0.05 ? 'Mere ulighed' : 'Neutral';
    const giniColor = c.giniDelta < -0.05 ? 'var(--neg)' : c.giniDelta > 0.05 ? 'var(--pos)' : 'var(--text-3)';
    const giniSign  = c.giniDelta >= 0 ? '+' : '';

    const policiesList = s.policies.map(p => `<li>${p.name}</li>`).join('');
    const assumptionsList = s.assumptions.map(a => `<li>${a}</li>`).join('');

    const relatedHtml = s.relatedNews && s.relatedNews.length > 0
      ? `<div class="sc-related">
          <div class="sc-related-label">Aktuelle nyheder</div>
          ${s.relatedNews.map(n => `<a href="${n.link || '#'}" target="_blank" rel="noopener" class="sc-related-item"><span class="sc-related-src">${n.source}</span>${n.title}</a>`).join('')}
        </div>`
      : '';

    return `<div class="rygter-sc-card">
  <div class="rygter-sc-head">
    <span class="rygter-sc-emoji">${s.emoji}</span>
    <div>
      <div class="rygter-sc-name">${s.name}</div>
      <div class="rygter-sc-sub">${s.subtitle}</div>
    </div>
  </div>
  <p class="rygter-sc-desc">${s.description}</p>
  <div class="rygter-sc-impacts">
    <div class="rygter-sc-row">
      <span class="rygter-sc-rlabel">Finanspolitik</span>
      <span class="rygter-sc-rval" style="color:${fiscalColor}">${fiscalLabel}</span>
    </div>
    <div class="rygter-sc-row">
      <span class="rygter-sc-rlabel">BNP-effekt (5 år)</span>
      <span class="rygter-sc-rval" style="color:${gdpColor}">${gdpSign}${c.gdpPct.toFixed(2).replace('.', ',')}% BNP</span>
    </div>
    <div class="rygter-sc-row">
      <span class="rygter-sc-rlabel">Beskæftigelse</span>
      <span class="rygter-sc-rval" style="color:${empColor}">${empSign}${c.employmentK}k fuldtidsjob</span>
    </div>
    <div class="rygter-sc-row">
      <span class="rygter-sc-rlabel">Fordeling</span>
      <span class="rygter-sc-rval" style="color:${giniColor}">${giniLabel} (Δgini ${giniSign}${c.giniDelta.toFixed(1)})</span>
    </div>
  </div>
  <details class="rygter-sc-details">
    <summary>Politikker &amp; modelantagelser</summary>
    <div class="rygter-sc-details-body">
      <div class="rygter-sc-details-head">Inkluderede politikker</div>
      <ul class="rygter-sc-list">${policiesList}</ul>
      <div class="rygter-sc-details-head">Modelantagelser</div>
      <ul class="rygter-sc-list">${assumptionsList}</ul>
    </div>
  </details>
  ${relatedHtml}
</div>`;
  }).join('');

  return `<div class="rygter-scenarios">
  <h2>🔭 Scenarieanalyse</h2>
  <p class="rygter-sc-intro">Tre mulige politiske forlig — estimeret via kumulative DREAM/MAKRO-parametre. Effekterne er summen af alle inkluderede politikker og vises over en 5-årig modelhorisont.</p>
  <div class="rygter-sc-grid">${cards}</div>
  <p class="rygter-sc-disclaimer">Illustrative scenarier — ikke officielle analyser. Politikpakker konstrueret ud fra typiske danske koalitionsprofiler 2024–2026.</p>
</div>`;
};

VG.rygter._renderCard = function(item) {
  const impact   = item.impact || {};
  const catColor = VG.rygter.CAT_COLORS[impact.category] || 'var(--text-3)';
  const conf     = VG.rygter.CONFIDENCE_LABELS[impact.confidence] || VG.rygter.CONFIDENCE_LABELS.rygte;

  const dateStr = item.pubDate
    ? new Date(item.pubDate).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  const SOURCE_CLS = { DR: 'source-dr', TV2: 'source-tv2', JP: 'source-jp', Berlingske: 'source-berlingske', Politiken: 'source-politiken', Weekendavisen: 'source-weekendavisen' };
  const sourceCls = SOURCE_CLS[item.source] || 'source-tv2';

  const fiscalHtml = impact.fiscalBn != null
    ? VG.rygter._renderFiscalBar(impact.fiscalBn)
    : '<span class="dream-na">Ikke estimeret</span>';

  const gdpHtml = impact.gdpPct != null
    ? `<span class="dream-gdp ${impact.gdpPct >= 0 ? 'pos' : 'neg'}">${impact.gdpPct >= 0 ? '▲' : '▼'} ${Math.abs(impact.gdpPct).toFixed(2).replace('.', ',')}% BNP</span>`
    : '<span class="dream-na">—</span>';

  const empHtml = impact.employmentK != null && Math.abs(impact.employmentK) >= 0.5
    ? `<span class="dream-emp ${impact.employmentK >= 0 ? 'pos' : 'neg'}">${impact.employmentK >= 0 ? '+' : ''}${impact.employmentK.toFixed(0)}k job</span>`
    : '<span class="dream-na">—</span>';

  const giniHtml = impact.giniDelta != null && Math.abs(impact.giniDelta) >= 0.05
    ? `<span class="dream-gini ${impact.giniDelta < 0 ? 'eq' : 'uneq'}">${impact.giniDelta < 0 ? '↓ Mere lighed' : '↑ Mere ulighed'} (Δ${impact.giniDelta >= 0 ? '+' : ''}${impact.giniDelta.toFixed(1)})</span>`
    : '<span class="dream-na">Neutral</span>';

  const compassHtml = VG.rygter._renderCompass(impact.politicalScore || 0);

  return `<div class="rygte-card" style="border-left-color:${catColor}">
  <div class="rygte-header">
    <span class="rygte-source-badge ${sourceCls}">${item.source}</span>
    <a href="${item.link || '#'}" target="_blank" rel="noopener" class="rygte-title">${item.title}</a>
    <span class="rygte-date">${dateStr}</span>
  </div>
  <p class="rygte-desc">${item.description || ''}</p>
  <div class="rygte-badges">
    <span class="rygte-cat-badge" style="background:${catColor}22;color:${catColor};border:1px solid ${catColor}55">${impact.category || 'Øvrig'}</span>
    <span class="rygte-confidence ${conf.cls}">${conf.label}</span>
  </div>
  <div class="dream-box">
    <div class="dream-box-header">📊 DREAM/MAKRO analyse</div>
    <div class="dream-stats">
      <div class="dream-stat">
        <div class="dream-stat-label">Finanspolitisk effekt</div>
        <div class="dream-stat-val">${fiscalHtml}</div>
      </div>
      <div class="dream-stat">
        <div class="dream-stat-label">BNP-effekt</div>
        <div class="dream-stat-val">${gdpHtml}</div>
      </div>
      <div class="dream-stat">
        <div class="dream-stat-label">Beskæftigelse</div>
        <div class="dream-stat-val">${empHtml}</div>
      </div>
      <div class="dream-stat">
        <div class="dream-stat-label">Indkomstfordeling</div>
        <div class="dream-stat-val">${giniHtml}</div>
      </div>
    </div>
    <div class="dream-compass-row">
      <span class="dream-compass-label-txt">Politisk placering</span>
      <div class="dream-compass-wrap">${compassHtml}</div>
    </div>
    <p class="dream-explanation">${impact.explanation || ''}</p>
    <p class="dream-disclaimer">Estimat baseret på DREAM/MAKRO-modelparametre. Ikke officiel analyse.</p>
  </div>
</div>`;
};

VG.rygter._renderFiscalBar = function(fiscalBn) {
  const maxBn  = 15;
  const pct    = Math.min(100, Math.abs(fiscalBn) / maxBn * 100).toFixed(1);
  const isPos  = fiscalBn > 0;
  const color  = isPos ? 'var(--neg)' : 'var(--pos)';
  const label  = isPos
    ? `+${fiscalBn.toFixed(1).replace('.', ',')} mia. kr./år (bedre balance)`
    : `${fiscalBn.toFixed(1).replace('.', ',')} mia. kr./år (mere underskud)`;
  return `<div class="dream-bar-wrap">
    <div class="dream-bar-track">
      <div class="dream-bar-fill" style="width:${pct}%;background:${color}"></div>
    </div>
    <span class="dream-bar-label" style="color:${color}">${label}</span>
  </div>`;
};

VG.rygter._renderCompass = function(score) {
  const pct        = ((score + 100) / 200 * 100).toFixed(1);
  const markerLeft = Math.max(2, Math.min(98, parseFloat(pct)));
  return `<div class="dream-compass">
    <div class="dream-compass-labels"><span>Venstre</span><span>Højre</span></div>
    <div class="dream-compass-track">
      <div class="dream-compass-marker" style="left:${markerLeft}%"></div>
    </div>
  </div>`;
};

VG.rygter._bindEvents = function(panel) {
  if (panel._vgBound) return;
  panel._vgBound = true;

  panel.addEventListener('click', e => {
    const filterBtn = e.target.closest('[data-filter]');
    if (filterBtn) {
      VG.rygter._filter = filterBtn.dataset.filter;
      VG.rygter._renderContent(panel);
      return;
    }

    const sortBtn = e.target.closest('[data-sort]');
    if (sortBtn) {
      VG.rygter._sort = sortBtn.dataset.sort;
      VG.rygter._renderContent(panel);
    }
  });
};
