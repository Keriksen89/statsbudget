/* Promises tracker — Regeringsløfter 2026 */
VG.promises = (function () {

  const CAT_LABELS = {
    forsvar: 'Forsvar', skat: 'Skat', indvandring: 'Indvandring',
    velfaerd: 'Velfærd', pension: 'Pension', sundhed: 'Sundhed',
    uddannelse: 'Uddannelse', klima: 'Klima', bolig: 'Bolig',
    transport: 'Transport', erhverv: 'Erhverv',
  };
  const STATUS_LABELS = {
    annonceret: 'Annonceret', lovforslag: 'Lovforslag',
    vedtaget: 'Vedtaget', droppet: 'Droppet',
  };
  const CAT_COLORS = {
    forsvar: '#60a5fa', skat: '#34d399', indvandring: '#f87171',
    velfaerd: '#a78bfa', pension: '#fbbf24', sundhed: '#f472b6',
    uddannelse: '#38bdf8', klima: '#4ade80', bolig: '#fb923c',
    transport: '#94a3b8', erhverv: '#f0a520',
  };

  let state = {
    data: null, activeCategory: 'alle', activeStatus: 'alle',
    sortBy: 'cost-desc', expandedId: null,
    signalsByPromise: {},  // id → { total, scope }
    scopeAlerts: [],       // recent scope-change signals across all promises
  };

  async function load() {
    const panel = document.getElementById('panel-promises');
    if (!panel) return;

    panel.innerHTML = `<div style="padding:40px 0;text-align:center;color:var(--text-3)"><div class="loading"></div></div>`;

    try {
      const [data, fiscal, signalsData] = await Promise.all([
        VG.api.fetchJSON('/api/promises'),
        VG.api.fetchJSON('/api/promises/fiscal').catch(() => null),
        VG.api.fetchJSON('/api/promises/signals?type=scope_change&limit=8').catch(() => ({ signals: [] })),
      ]);
      state.data = data;
      state.fiscal = fiscal;
      state.scopeAlerts = signalsData.signals || [];
      state.signalsByPromise = {};
      (data.promises || []).forEach(p => {
        if (p._signals) state.signalsByPromise[p.id] = p._signals;
      });
      render();
    } catch (e) {
      const panel2 = document.getElementById('panel-promises');
      if (panel2) panel2.innerHTML = `<div class="empty-state"><i class="ph ph-warning"></i><p>Kunne ikke hente løftedata: ${e.message}</p></div>`;
    }
  }

  async function loadPromiseSignals(id) {
    try {
      const data = await VG.api.fetchJSON(`/api/promises/${id}/signals`);
      return data.signals || [];
    } catch { return []; }
  }

  function relTime(s) {
    try {
      const h = Math.round((Date.now() - new Date(s)) / 3600000);
      if (h < 1) return 'for nylig';
      if (h < 24) return `${h}t siden`;
      return `${Math.round(h / 24)}d siden`;
    } catch { return ''; }
  }

  function renderFiscalComparison() {
    const f = state.fiscal;
    if (!f) return '';

    const { baseline, impact, projected, by_category } = f;

    const statusColor = projected.status === 'ok' ? 'var(--neg)' : projected.status === 'advarsel' ? '#f59e0b' : 'var(--pos)';
    const statusLabel = projected.status === 'ok' ? 'Holdbar saldo' : projected.status === 'advarsel' ? 'Advarsel' : 'Kritisk';

    // Balance bar: 100% = GDP, show baseline vs projected
    const baseW = Math.max(0, (baseline.bal_bn / baseline.gdp_bn) * 100 * 8).toFixed(1); // ×8 to make visible
    const projW = Math.max(0, (projected.bal_bn / baseline.gdp_bn) * 100 * 8).toFixed(1);

    // Top 4 categories by cost
    const topCats = by_category.slice(0, 4);

    return `
    <div style="background:var(--surface-1);border:1px solid var(--border-strong);border-radius:var(--radius-lg);padding:20px 24px;margin-bottom:20px">

      <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-3);margin-bottom:14px">
        Finansielt overblik — FL2026 status quo vs. løfternes konsekvenser
      </div>

      <!-- Before / After comparison -->
      <div style="display:grid;grid-template-columns:1fr 48px 1fr;gap:0;align-items:stretch;margin-bottom:18px">

        <!-- FL2026 BASELINE -->
        <div style="background:var(--surface-2);border-radius:var(--radius) 0 0 var(--radius);padding:16px 18px;border:1px solid var(--border)">
          <div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);margin-bottom:10px">FL2026 · Status quo</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
            <div>
              <div style="font-size:10px;color:var(--text-3);margin-bottom:2px">Indtægter</div>
              <div style="font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:var(--neg)">${baseline.rev_bn} mia.</div>
            </div>
            <div>
              <div style="font-size:10px;color:var(--text-3);margin-bottom:2px">Udgifter</div>
              <div style="font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:var(--pos)">${baseline.exp_bn} mia.</div>
            </div>
          </div>
          <div style="height:1px;background:var(--border);margin-bottom:10px"></div>
          <div style="font-size:10px;color:var(--text-3);margin-bottom:3px">Budgetsaldo</div>
          <div style="font-family:'Courier New',monospace;font-size:24px;font-weight:700;color:var(--neg)">+${baseline.bal_bn} mia.</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:2px">+${baseline.bal_pct}% af BNP · Statsgæld ${baseline.debt_pct}% af BNP</div>
        </div>

        <!-- ARROW -->
        <div style="display:flex;align-items:center;justify-content:center;background:var(--surface-2);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">
          <div style="font-size:22px;color:var(--text-3)">→</div>
        </div>

        <!-- PROJECTED AFTER PROMISES -->
        <div style="background:var(--surface-2);border-radius:0 var(--radius) var(--radius) 0;padding:16px 18px;border:1px solid var(--border)">
          <div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-3);margin-bottom:10px">Efter løfter · DREAM-dynamisk</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
            <div>
              <div style="font-size:10px;color:var(--text-3);margin-bottom:2px">Nye udgifter</div>
              <div style="font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:var(--pos)">−${impact.cost_dynamic.toFixed(1)} mia.</div>
            </div>
            <div>
              <div style="font-size:10px;color:var(--text-3);margin-bottom:2px">Besparelser</div>
              <div style="font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:var(--neg)">+${impact.savings.toFixed(1)} mia.</div>
            </div>
          </div>
          <div style="height:1px;background:var(--border);margin-bottom:10px"></div>
          <div style="font-size:10px;color:var(--text-3);margin-bottom:3px">Projekteret saldo</div>
          <div style="font-family:'Courier New',monospace;font-size:24px;font-weight:700;color:${projected.bal_bn >= 0 ? 'var(--neg)' : 'var(--pos)'}">
            ${projected.bal_bn >= 0 ? '+' : ''}${projected.bal_bn} mia.
          </div>
          <div style="font-size:12px;color:var(--text-3);margin-top:2px">${projected.bal_pct >= 0 ? '+' : ''}${projected.bal_pct}% af BNP · Gæld ~${projected.debt_pct}% af BNP</div>
        </div>
      </div>

      <!-- STATUS ROW -->
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px">
        <span style="background:rgba(255,255,255,.05);border:1px solid ${statusColor};border-radius:20px;padding:4px 12px;font-size:12px;font-weight:600;color:${statusColor}">
          ${statusLabel} · ${projected.bal_pct >= 0 ? '+' : ''}${projected.bal_pct}% af BNP
        </span>
        <span style="font-size:12px;color:${projected.budgetlov ? 'var(--neg)' : 'var(--pos)'}">
          ${projected.budgetlov ? '✓' : '✗'} Budgetlov (> −1%)
        </span>
        <span style="font-size:12px;color:${projected.eu_ok ? 'var(--neg)' : 'var(--pos)'}">
          ${projected.eu_ok ? '✓' : '✗'} EU Stabilitetspagt (> −3%)
        </span>
        <span style="font-size:12px;color:var(--text-3);margin-left:auto">
          Nettobyrde: <strong style="color:var(--pos)">−${impact.net_cost_dynamic.toFixed(1)} mia./år</strong> (${((impact.net_cost_dynamic/baseline.gdp_bn)*100).toFixed(1)}% af BNP)
        </span>
      </div>

      <!-- BY-CATEGORY BREAKDOWN -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${topCats.map(c => `
          <div style="background:var(--surface-2);border-radius:var(--radius);padding:8px 10px">
            <div style="font-size:10px;color:var(--text-3);text-transform:capitalize;margin-bottom:3px">${CAT_LABELS[c.category] || c.category}</div>
            <div style="font-family:'Courier New',monospace;font-size:13px;font-weight:700;color:${c.net > 0 ? 'var(--pos)' : 'var(--neg)'}">
              ${c.net > 0 ? '−' : '+'}${Math.abs(c.net).toFixed(1)} mia.
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  }

  function renderScopeAlerts() {
    if (!state.scopeAlerts.length) return '';
    const items = state.scopeAlerts.slice(0, 5).map(s => `
      <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
        <i class="ph ph-warning" style="color:var(--warn);font-size:16px;flex-shrink:0;margin-top:2px"></i>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--text);line-height:1.4">${s.title}</div>
          <div style="font-size:11px;color:var(--text-3);margin-top:3px">${s.source} · ${relTime(s.detected_at)} · Løfte: ${s.promise_id}</div>
          ${s.summary ? `<div style="font-size:12px;color:var(--text-2);margin-top:4px;line-height:1.5">${s.summary.slice(0, 180)}…</div>` : ''}
        </div>
        <span style="background:var(--warn-bg);color:var(--warn);border:1px solid rgba(251,191,36,.3);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:600;flex-shrink:0">Mulig ændring</span>
      </div>`).join('');

    return `
      <div style="background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.2);border-radius:var(--r-lg);padding:16px 20px;margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <i class="ph ph-warning-circle" style="color:var(--warn);font-size:18px"></i>
          <span style="font-size:13px;font-weight:700;color:var(--warn)">${state.scopeAlerts.length} mulig${state.scopeAlerts.length !== 1 ? 'e' : ''} løfteændring${state.scopeAlerts.length !== 1 ? 'er' : ''} opdaget i nyhederne</span>
          <span style="font-size:11px;color:var(--text-3);margin-left:auto">Opdateret automatisk fra DR, TV2 og Altinget</span>
        </div>
        <div style="font-size:12px;color:var(--text-3);margin-bottom:12px">Disse nyheder indeholder ord der tyder på ændringer i et eller flere regeringsløfter. Gennemgå dem og opdatér løftedata om nødvendigt.</div>
        ${items}
      </div>`;
  }

  function renderSignalsBadge(id) {
    const sig = state.signalsByPromise[id];
    if (!sig || sig.total === 0) return '';
    if (sig.scope > 0) {
      return `<span style="background:var(--warn-bg);color:var(--warn);border:1px solid rgba(251,191,36,.3);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:700">⚠ ${sig.scope} ændrings-signal${sig.scope !== 1 ? 'er' : ''}</span>`;
    }
    return `<span style="background:var(--info-bg);color:var(--info);border:1px solid rgba(96,165,250,.25);border-radius:20px;padding:2px 8px;font-size:10px;font-weight:600">${sig.total} nyhed${sig.total !== 1 ? 'er' : ''}</span>`;
  }

  function fmt(bn) {
    if (bn === null || bn === undefined) return '—';
    const abs = Math.abs(bn);
    const sign = bn < 0 ? '+' : '−';
    if (abs >= 10) return sign + abs.toFixed(0) + ' mia.';
    return sign + abs.toFixed(1) + ' mia.';
  }

  function fmtCost(bn, perYear) {
    const s = Math.abs(bn);
    const suffix = perYear ? '/år' : ' ét.';
    if (s >= 10) return (bn > 0 ? '−' : '+') + s.toFixed(0) + ' mia.' + suffix;
    return (bn > 0 ? '−' : '+') + s.toFixed(1) + ' mia.' + suffix;
  }

  function render() {
    const panel = document.getElementById('panel-promises');
    if (!panel || !state.data) return;

    const { government, promises, totals } = state.data;

    // Apply filters
    let filtered = promises.filter(p => {
      if (state.activeCategory !== 'alle' && p.category !== state.activeCategory) return false;
      if (state.activeStatus   !== 'alle' && p.status   !== state.activeStatus)   return false;
      return true;
    });

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (state.sortBy === 'cost-desc') return Math.abs(b.cost.static_bn_dkk) - Math.abs(a.cost.static_bn_dkk);
      if (state.sortBy === 'cost-asc')  return Math.abs(a.cost.static_bn_dkk) - Math.abs(b.cost.static_bn_dkk);
      if (state.sortBy === 'date-desc') return new Date(b.announced) - new Date(a.announced);
      if (state.sortBy === 'category')  return a.category.localeCompare(b.category);
      return 0;
    });

    // Get unique categories present in data
    const cats = [...new Set(promises.map(p => p.category))];

    panel.innerHTML = `
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;gap:12px;flex-wrap:wrap">
        <div>
          <h1 style="font-size:22px;font-weight:700;letter-spacing:-.01em;margin-bottom:3px">Regeringsløfter 2026</h1>
          <div style="font-size:13px;color:var(--text-3)">${government.type} · Præsenteret ${government.formed} · ${promises.length} løfter analyseret</div>
        </div>
        <button class="btn btn-sm" id="btn-promises-share" style="flex-shrink:0">↗ Del</button>
      </div>

      ${renderFiscalComparison()}
      ${renderScopeAlerts()}

      <!-- FILTER + SORT in one clean bar -->
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:14px;padding:10px 14px;background:var(--surface-1);border:1px solid var(--border);border-radius:var(--radius)">
        <span style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;flex-shrink:0">Filtrer:</span>
        <button class="filter-chip ${state.activeCategory === 'alle' ? 'active' : ''}" data-cat="alle">Alle</button>
        ${cats.map(cat => `<button class="filter-chip ${state.activeCategory === cat ? 'active' : ''}" data-cat="${cat}">${CAT_LABELS[cat] || cat}</button>`).join('')}
        <span class="filter-sep"></span>
        <button class="filter-chip ${state.activeStatus === 'alle' ? 'active' : ''}" data-status="alle">Alle status</button>
        <button class="filter-chip ${state.activeStatus === 'annonceret' ? 'active' : ''}" data-status="annonceret">Annonceret</button>
        <button class="filter-chip ${state.activeStatus === 'vedtaget' ? 'active' : ''}" data-status="vedtaget">Vedtaget</button>
        <span class="filter-sep"></span>
        <select class="sort-select" id="promises-sort" style="margin-left:auto">
          <option value="cost-desc" ${state.sortBy === 'cost-desc' ? 'selected' : ''}>↓ Størst kostnad</option>
          <option value="cost-asc"  ${state.sortBy === 'cost-asc'  ? 'selected' : ''}>↑ Mindst kostnad</option>
          <option value="category"  ${state.sortBy === 'category'  ? 'selected' : ''}>Kategori</option>
        </select>
        <span style="font-size:11px;color:var(--text-3);flex-shrink:0">${filtered.length}/${promises.length}</span>
      </div>

      <!-- PROMISE CARDS -->
      <div class="promises-grid" id="promises-grid">
        ${filtered.map(p => renderCard(p)).join('')}
      </div>

      <p style="font-size:11px;color:var(--text-3);margin-top:20px;line-height:1.6">
        Estimater er baseret på DREAM/MAKRO-parametre for dansk økonomi. Dynamiske estimater inkluderer adfærdseffekter. Éngangsbeløb amortiseret over 5 år. Kilde: Koalitionsaftalen "${government.agreement_title}", 2. juni 2026.
      </p>
    `;

    // Bind filters
    panel.querySelectorAll('[data-cat]').forEach(el => {
      el.addEventListener('click', () => { state.activeCategory = el.dataset.cat; render(); });
    });
    panel.querySelectorAll('[data-status]').forEach(el => {
      el.addEventListener('click', () => { state.activeStatus = el.dataset.status; render(); });
    });
    const sortSel = panel.querySelector('#promises-sort');
    if (sortSel) sortSel.addEventListener('change', () => { state.sortBy = sortSel.value; render(); });

    // Bind expand — lazy-load signals when card opens
    panel.querySelectorAll('.promise-head').forEach(head => {
      head.addEventListener('click', () => {
        const card = head.closest('.promise-card');
        const id   = card.dataset.id;
        if (state.expandedId === id) {
          state.expandedId = null;
          card.classList.remove('expanded');
        } else {
          panel.querySelectorAll('.promise-card.expanded').forEach(c => c.classList.remove('expanded'));
          state.expandedId = id;
          card.classList.add('expanded');
          // Lazy-load news signals for this promise
          const sigEl = document.getElementById(`signals-${id}`);
          if (sigEl && !sigEl.dataset.loaded) {
            sigEl.dataset.loaded = '1';
            sigEl.innerHTML = `<div style="font-size:12px;color:var(--text-3)"><span class="loading-spin"></span> Henter nyheder…</div>`;
            loadPromiseSignals(id).then(signals => {
              sigEl.innerHTML = renderSignalsSection(id, signals);
            });
          }
        }
      });
    });

    // Share button
    const shareBtn = panel.querySelector('#btn-promises-share');
    if (shareBtn) shareBtn.addEventListener('click', () => {
      VG.actions && VG.actions.share ? VG.actions.share() : VG.toast('Del-funktion ikke klar endnu');
    });

    // Re-expand if needed
    if (state.expandedId) {
      const card = panel.querySelector(`[data-id="${state.expandedId}"]`);
      if (card) card.classList.add('expanded');
    }
  }

  function renderCard(p) {
    const catColor  = CAT_COLORS[p.category] || '#888';
    const catLabel  = CAT_LABELS[p.category] || p.category;
    const stLabel   = STATUS_LABELS[p.status] || p.status;
    const isCost    = p.cost.static_bn_dkk > 0;
    const costClass = isCost ? 'cost' : 'save';
    const selfPct   = p.dream?.self_financing_pct ?? 0;
    const distLabel = { progressiv: 'Progressiv', regressiv: 'Regressiv', neutral: 'Neutral', 'let progressiv': 'Let progressiv', 'let regressiv': 'Let regressiv' }[p.dream?.distribution] || p.dream?.distribution || '—';
    const distClass = p.dream?.distribution?.includes('progressiv') ? 'dist-progressiv' : p.dream?.distribution?.includes('regressiv') ? 'dist-regressiv' : 'dist-neutral';

    const gdpSign   = (p.dream?.gdp_pct ?? 0) >= 0 ? '+' : '';
    const empSign   = (p.dream?.employment_k ?? 0) >= 0 ? '+' : '';

    return `
    <div class="promise-card" data-id="${p.id}">
      <div class="promise-head">
        <div class="promise-cat-dot" style="background:${catColor}"></div>
        <div class="promise-main">
          <div class="promise-title">${p.title}</div>
          <div class="promise-meta">
            <span class="cat-${p.category}">${catLabel}</span>
            <span class="status-${p.status}">${stLabel}</span>
            <span class="${distClass}">${distLabel}</span>
            ${renderSignalsBadge(p.id)}
            ${p.parties?.map(pa => `<span style="background:var(--surface-3);color:var(--text-3);border-radius:4px;padding:1px 6px;font-size:10px;font-weight:600">${pa}</span>`).join('') || ''}
          </div>
        </div>
        <i class="ph ph-caret-down promise-expand-icon"></i>
      </div>

      <!-- Cost summary row -->
      <div class="promise-cost-row">
        <div>
          <div class="promise-cost-label">Statisk effekt</div>
          <div class="promise-cost-val ${costClass}">${fmtCost(p.cost.static_bn_dkk, p.cost.per_year)}</div>
        </div>
        <div>
          <div class="promise-cost-label">DREAM dynamisk</div>
          <div class="promise-cost-val dynamic">${fmtCost(p.cost.dynamic_bn_dkk, p.cost.per_year)}</div>
        </div>
        <div>
          <div class="promise-cost-label">Selvfinansieringsgrad</div>
          <div class="promise-cost-val self">${selfPct}%</div>
        </div>
        <div>
          <div class="promise-cost-label">Finansiering</div>
          <div class="promise-cost-val" style="color:var(--text-2);font-size:12px;line-height:1.3">${p.cost.horizon}</div>
        </div>
      </div>

      <!-- Self-financing progress bar -->
      <div class="promise-bar-wrap">
        <div class="promise-bar-track">
          <div class="promise-bar-fill" style="width:${Math.min(selfPct, 100)}%;background:${selfPct > 50 ? 'var(--pos)' : selfPct > 20 ? 'var(--warn)' : 'var(--neg)'}"></div>
        </div>
        <div class="promise-bar-label">${selfPct}% selvfinansieret via dynamiske effekter — ${selfPct >= 100 ? 'fuldt selvfinansierende' : selfPct >= 50 ? 'delvist selvfinansierende' : 'kræver ekstern finansiering'}</div>
      </div>

      <!-- Expandable body -->
      <div class="promise-body">
        <div class="promise-body-description">${p.description}</div>
        <div class="dream-section-title">DREAM/MAKRO vurdering</div>
        <div class="dream-assessment">${p.dream?.assessment || '—'}</div>
        <div class="dream-metrics">
          <div class="dream-metric">
            <div class="dream-metric-label">BNP-effekt (5 år)</div>
            <div class="dream-metric-val" style="color:${(p.dream?.gdp_pct ?? 0) >= 0 ? 'var(--pos)' : 'var(--neg)'}">${gdpSign}${((p.dream?.gdp_pct ?? 0) * 100).toFixed(0)} bps</div>
          </div>
          <div class="dream-metric">
            <div class="dream-metric-label">Beskæftigelse</div>
            <div class="dream-metric-val" style="color:${(p.dream?.employment_k ?? 0) >= 0 ? 'var(--pos)' : 'var(--neg)'}">${empSign}${p.dream?.employment_k ?? 0}k pers.</div>
          </div>
          <div class="dream-metric">
            <div class="dream-metric-label">Gini-ændring</div>
            <div class="dream-metric-val" style="color:${(p.dream?.gini_delta ?? 0) <= 0 ? 'var(--pos)' : 'var(--neg)'}">${(p.dream?.gini_delta ?? 0) > 0 ? '+' : ''}${(p.dream?.gini_delta ?? 0).toFixed(1)} point</div>
          </div>
        </div>
        <div class="financing-note">
          <strong>Finansiering:</strong> ${p.cost.financing}
        </div>
        <div id="signals-${p.id}" style="margin-top:16px"></div>
      </div>
    </div>`;
  }

  function renderSignalsSection(id, signals) {
    if (!signals.length) {
      return `<div style="font-size:12px;color:var(--text-3);padding:8px 0">Ingen nyhedssignaler fundet endnu — monitoren scanner feeds hvert 30. minut.</div>`;
    }

    const scopeChanges = signals.filter(s => s.signal_type === 'scope_change');
    const mentions     = signals.filter(s => s.signal_type === 'mention');

    let html = `<div class="dream-section-title" style="margin-top:0">Nyheder om dette løfte (${signals.length})</div>`;

    if (scopeChanges.length) {
      html += `<div style="margin-bottom:10px">
        <div style="font-size:11px;font-weight:600;color:var(--warn);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">⚠ Mulige ændringer detekteret</div>
        ${scopeChanges.map(s => `
          <div style="background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.2);border-radius:var(--r-sm);padding:10px 12px;margin-bottom:6px">
            <div style="font-size:12.5px;font-weight:600;color:var(--text)">${s.title}</div>
            ${s.summary ? `<div style="font-size:11.5px;color:var(--text-2);margin-top:3px;line-height:1.5">${s.summary}</div>` : ''}
            <div style="font-size:11px;color:var(--text-3);margin-top:5px;display:flex;gap:10px">
              <span>${s.source}</span>
              <span>${relTime(s.detected_at)}</span>
              ${s.url ? `<a href="${s.url}" target="_blank" rel="noopener" style="color:var(--accent)">Læs artiklen ↗</a>` : ''}
            </div>
          </div>`).join('')}
      </div>`;
    }

    if (mentions.length) {
      html += `<div>
        <div style="font-size:11px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Øvrige omtaler</div>
        ${mentions.slice(0, 5).map(s => `
          <div style="display:flex;align-items:flex-start;gap:8px;padding:7px 0;border-bottom:1px solid var(--border)">
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;color:var(--text);line-height:1.4">${s.title}</div>
              <div style="font-size:11px;color:var(--text-3);margin-top:2px;display:flex;gap:8px">
                <span>${s.source}</span><span>${relTime(s.detected_at)}</span>
                ${s.url ? `<a href="${s.url}" target="_blank" rel="noopener" style="color:var(--accent)">↗</a>` : ''}
              </div>
            </div>
          </div>`).join('')}
      </div>`;
    }

    return html;
  }

  return { load, render };
})();
