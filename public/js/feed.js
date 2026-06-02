// News feed with optional DREAM/MAKRO impact annotations.

VG.feed = {};

VG.feed.state = {
  items: [],
  filter: 'all',
  loading: false,
  fetchedAt: null
};

VG.feed.load = async function() {
  const panel = document.getElementById('panel-feed');
  if (!panel) return;

  if (!VG.feed.state.items.length && !VG.feed.state.loading) {
    VG.feed.state.loading = true;
    panel.innerHTML = '<div class="panel-loading">Henter nyheder...</div>';
    try {
      const data = await VG.api.fetchJSON('/api/news?limit=28');
      VG.feed.state.items = data.items || [];
      VG.feed.state.fetchedAt = data.fetchedAt || null;
    } catch (e) {
      panel.innerHTML = `<div class="panel-error">Kunne ikke hente nyheder: ${e.message}</div>`;
      VG.feed.state.loading = false;
      return;
    }
    VG.feed.state.loading = false;
  }

  VG.feed.renderPanel(panel);
};

VG.feed.renderPanel = function(panel) {
  if (!panel) return;
  const items = VG.feed.state.items || [];
  const active = VG.feed.state.filter || 'all';
  const topics = ['all', ...new Set(items.map(i => i.topicLabel).filter(Boolean))];
  const filtered = active === 'all' ? items : items.filter(i => i.topicLabel === active);

  const filters = topics.map(t =>
    `<button class="feed-filter-btn${t === active ? ' active' : ''}" data-news-filter="${t}">${t === 'all' ? 'Alle' : t}</button>`
  ).join('');

  const cards = filtered.map(item => VG.feed.renderNewsCard(item)).join('') ||
    '<div class="feed-empty">Ingen nyheder i denne kategori lige nu.</div>';

  panel.innerHTML = `
    <div class="feed-page-header">
      <div>
        <h2 class="feed-page-title">Nyheder</h2>
        <p class="feed-page-sub">Seneste relevante danske nyheder. DREAM/MAKRO vises kun, hvor artiklen matcher en konkret politisk eller finanspolitisk modelregel.</p>
      </div>
      <button class="btn btn-sm" id="feed-refresh">Opdater</button>
    </div>
    <div class="feed-filters">${filters}</div>
    <div class="feed-list">${cards}</div>`;

  panel.querySelectorAll('[data-news-filter]').forEach(btn => {
    btn.onclick = () => {
      VG.feed.state.filter = btn.dataset.newsFilter;
      VG.feed.renderPanel(panel);
    };
  });

  panel.querySelectorAll('[data-goto]').forEach(btn => {
    btn.onclick = () => window.__mkClick && window.__mkClick(btn.dataset.goto);
  });

  panel.querySelectorAll('[data-open-news]').forEach(btn => {
    btn.onclick = () => window.open(btn.dataset.openNews, '_blank', 'noopener');
  });

  document.getElementById('feed-refresh')?.addEventListener('click', async () => {
    VG.feed.state.items = [];
    VG.feed.state.filter = 'all';
    await VG.feed.load();
  });
};

VG.feed.renderNewsCard = function(item) {
  const impact = item.dream || item.impact || null;
  const hasImpact = !!impact;
  const source = [item.source, item.age].filter(Boolean).join(' · ');
  const topic = item.topicLabel || impact?.category || 'Nyhed';
  const linkButton = item.link
    ? `<button class="feed-explore" data-open-news="${item.link}">Læs hos ${item.source || 'kilden'} ↗</button>`
    : '';

  return `<article class="feed-card">
    <div class="feed-card-meta">
      <span class="feed-cat-label"><i class="ph ph-newspaper"></i> ${VG.feed.escape(topic)}</span>
      ${source ? `<span class="feed-time">${VG.feed.escape(source)}</span>` : ''}
      ${hasImpact ? '<span class="feed-tag ft-info">DREAM relevant</span>' : ''}
    </div>
    <h3 class="feed-card-headline">${VG.feed.escape(item.headline || item.title || '')}</h3>
    ${item.description ? `<p class="feed-card-body">${VG.feed.escape(item.description)}</p>` : ''}
    ${hasImpact ? VG.feed.renderImpact(impact) : ''}
    <div class="feed-card-footer">
      <button class="feed-explore" data-goto="${item.panel || 'feed'}">Se data</button>
      ${linkButton}
    </div>
  </article>`;
};

VG.feed.renderImpact = function(impact) {
  const fiscal = impact.fiscalBn == null ? null : VG.feed.fmtBn(impact.fiscalBn);
  const gdp = impact.gdpPct == null ? null : `${impact.gdpPct >= 0 ? '+' : ''}${impact.gdpPct.toFixed(2).replace('.', ',')}% BNP`;
  const emp = impact.employmentK == null ? null : `${impact.employmentK >= 0 ? '+' : ''}${impact.employmentK.toFixed(0)}k job`;
  const gini = impact.giniDelta == null ? null : `${impact.giniDelta >= 0 ? '+' : ''}${impact.giniDelta.toFixed(1).replace('.', ',')} Gini`;
  const metrics = [
    fiscal && ['Finans', fiscal],
    gdp && ['BNP', gdp],
    emp && ['Beskæftigelse', emp],
    gini && ['Fordeling', gini]
  ].filter(Boolean);

  return `<div class="news-impact">
    <div class="news-impact-head">
      <span>DREAM/MAKRO estimat</span>
      <strong>${VG.feed.escape(impact.category || 'Politik')}</strong>
    </div>
    <div class="news-impact-grid">
      ${metrics.map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('')}
    </div>
    <p>${VG.feed.escape(impact.explanation || 'Modelregel matchede artiklens politiske indhold. Estimatet er vejledende og ikke en officiel DREAM-beregning.')}</p>
  </div>`;
};

VG.feed.fmtBn = function(n) {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1).replace('.', ',')} mia. kr.`;
};

VG.feed.escape = function(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
