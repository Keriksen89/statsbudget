VG.toast = function(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(VG.toast._t);
  VG.toast._t = setTimeout(() => el.classList.remove('show'), duration);
};

VG.showModal = function(title, html) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-backdrop').classList.add('show');
};

VG.closeModal = function() {
  document.getElementById('modal-backdrop').classList.remove('show');
};

VG.actions = {};

VG.actions.showChanges = function() {
  const changes = VG.getChanges();
  const bal = VG.sumRev() - VG.sumExp();
  let html = '';
  if (!changes.length) {
    html = '<p>Du har ikke ændret noget endnu. Gå til "Politiske valg" eller "Udgifter/Indtægter" for at justere på budgettet.</p>';
  } else {
    html = `<p><strong>Resultat:</strong> Saldo ${VG.fmtSigned(bal)} kr/år (${VG.ppct(bal/VG.state.baseline.gdp*100)} af BNP).</p><div style="background:var(--surface-2);padding:12px 14px;border-radius:var(--radius);font-size:12px;margin-top:12px;max-height:280px;overflow-y:auto">`;
    changes.forEach(c => {
      html += `<div style="padding:4px 0">• <strong>${c.name}:</strong> ${c.from} → ${c.to}</div>`;
    });
    html += '</div>';
  }
  VG.showModal('Dine ændringer', html);
};

VG.actions.share = function() {
  const url  = VG.share.getURL ? VG.share.getURL() : window.location.href;
  const urlE = encodeURIComponent(url);
  const text = encodeURIComponent('Se mit statsbudget for Danmark 2026 — lavet på statsbudget.dk:');
  const html = `
    <p style="font-size:13px;color:var(--text-2);margin-bottom:10px">Del dit budget — linket indeholder kun dine ændringer, ikke personlige data.</p>
    <input class="share-input" value="${url}" readonly id="share-url">
    <div class="share-buttons">
      <button class="share-btn linkedin" onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url=${urlE}','_blank')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn
      </button>
      <button class="share-btn facebook" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${urlE}','_blank')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        Facebook
      </button>
      <button class="share-btn" onclick="window.open('https://twitter.com/intent/tweet?text=${text}&url=${urlE}','_blank')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        X / Twitter
      </button>
      <button class="share-btn copy" id="btn-copy-url"><i class="ph ph-copy"></i> Kopier link</button>
    </div>`;
  VG.showModal('Del dit budget', html);
  setTimeout(() => {
    document.getElementById('btn-copy-url')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(url); VG.toast('Link kopieret!'); }
      catch { VG.toast('Marker og kopier linket manuelt'); }
    });
  }, 50);
};

VG.actions.analyze = function() {
  const changes = VG.getChanges();
  const rev = VG.sumRev(), exp = VG.sumExp(), bal = rev - exp;
  const BNP = VG.state.baseline.gdp;

  let html = '';
  if (!changes.length) {
    html = `<p>Du har ikke ændret budgettet endnu. Her er en kort intro:</p>
      <ul>
        <li><strong>Oversigt:</strong> Se den nuværende fordeling af udgifter og indtægter.</li>
        <li><strong>Politiske valg:</strong> Den mest interessante fane — ændr politiske parametre (pensionsalder, skattesatser, antal asylansøgere) og se hvilken budgeteffekt det har.</li>
        <li><strong>Udgifter/Indtægter:</strong> Direkte slidere for hver post.</li>
        <li><strong>Scenarier:</strong> Indlæs et politisk scenarie og se hvad det betyder.</li>
        <li><strong>Folketinget:</strong> Live data om de seneste afstemninger.</li>
      </ul>`;
  } else {
    html = `<p>Du har lavet <strong>${changes.length}</strong> ændringer i forhold til Finanslov 2026:</p><ul>`;
    changes.slice(0, 10).forEach(c => {
      html += `<li><strong>${c.name}:</strong> ${c.from} → ${c.to}</li>`;
    });
    if (changes.length > 10) html += `<li>... og ${changes.length - 10} flere</li>`;
    html += '</ul>';

    html += `<p style="margin-top:16px"><strong>Budgetresultat:</strong></p><ul>
      <li>Indtægter: ${VG.fmt(rev)} (${VG.fmtSigned(rev - VG.baseRev())} vs basis)</li>
      <li>Udgifter: ${VG.fmt(exp)} (${VG.fmtSigned(exp - VG.baseExp())} vs basis)</li>
      <li>Saldo: ${VG.fmtSigned(bal)} (${VG.ppct(bal/BNP*100)} af BNP)</li>
    </ul>`;

    const balPct = bal / BNP * 100;
    const violations = [];
    if (balPct < -3) violations.push("EU's Stabilitetspagt (saldo under -3%)");
    if (balPct < -1) violations.push("Den danske Budgetlov (strukturel saldo under -1%)");

    html += '<p style="margin-top:16px"><strong>Hvad ville faktisk ske?</strong></p>';
    if (violations.length) {
      html += `<p style="color:var(--pos)">⚠ Dit budget bryder: ${violations.join(", ")}. EU-kommissionen ville sende advarsel, og Finansministeriet skulle fremlægge en plan for genopretning.</p>`;
    }
    if (bal > 50) {
      html += '<p>Du genererer et stort overskud. I praksis ville det blive brugt til at nedbringe statsgælden yderligere, eller blive omsat til skattelettelser eller velfærdsudvidelser.</p>';
    } else if (bal < -50) {
      html += '<p>Du genererer et stort underskud. Det ville kræve øget statsgældssalg, og over tid ville rentebyrden begynde at sluge en stigende del af budgettet.</p>';
    }

    const policyChanges = changes.filter(c => c.type === 'policy');
    if (policyChanges.length) {
      html += '<p style="margin-top:14px"><strong>Realisme-tjek på dine politiske valg:</strong></p><ul>';
      const topTax = VG.state.current.policy.topTax.val;
      const retireAge = VG.state.current.policy.retireAge.val;
      const asylum = VG.state.current.policy.asylumCap.val;
      const vat = VG.state.current.policy.vatRate.val;
      const corp = VG.state.current.policy.corpTax.val;

      if (topTax < 3) html += '<li>Meget lav topskat: Skatteborgerne ville se markante lønstigninger efter skat, men dynamiske effekter (lønudvikling, fastholdelse af højtuddannede) er ikke modelleret. Finansministeriets selvfinansieringsgrad er ca. 25-30%.</li>';
      if (topTax > 15) html += '<li>Høj topskat: Risiko for at højtlønnede flytter (Sverige tog deres "værneskat" væk i 2007 efter kapital-udflytning). Reelt provenu kan være lavere end modellens lineære fremskrivning.</li>';
      if (retireAge < 65) html += '<li>Lav pensionsalder: Stort velfærdshul. Vedtaget pensionsalder er 70 år fra 2040 — at sænke den vil kræve omfattende reformer.</li>';
      if (retireAge > 69) html += '<li>Høj pensionsalder: Politisk kontroversielt, men budgetmæssigt holdbart. Allerede vedtaget for 2040.</li>';
      if (asylum < 1000) html += '<li>Meget få asylansøgere: Forudsætter strenge grænsekontroller eller udvandring fra EU-konventioner. Politisk og folkeretligt komplekst.</li>';
      if (asylum > 10000) html += '<li>Mange asylansøgere: Højere integrationsomkostninger på kort sigt, men positiv effekt på arbejdsstyrken på længere sigt (ikke i modellen).</li>';
      if (vat < 20) html += '<li>Lav moms: Direkte effekt på forbrugerpriser. Stort provenutab. Grænsehandel fra Tyskland/Sverige vender.</li>';
      if (corp < 18) html += '<li>Lav selskabsskat: Risiko for at minde om "race to the bottom". EU\'s 15% minimumssats lægger en bund.</li>';
      html += '</ul>';
    }

    html += '<p style="margin-top:16px;font-size:12px;color:var(--text-2)"><em>Bemærk: Modellen er statisk og lineær. I virkeligheden påvirker dine valg arbejdsudbud, vækst, inflation og adfærd — effekter som kræver makroøkonomisk model (DREAM, MAKRO) for at fange.</em></p>';
  }

  const adopted = VG.party.state.proposals.filter(p => {
    const v = p.votes || { ja: 0, nej: 0 };
    return v.ja + v.nej > 0 && v.ja > v.nej;
  });
  if (adopted.length > 0) {
    const partyImpact = adopted.reduce((s, p) => s + p.budgetImpact.value, 0);
    html += `<p style="margin-top:16px"><strong>VirtuelPartiet's nuværende platform:</strong></p>
      <p style="font-size:13px;color:var(--text-2)">Borgerne har vedtaget ${adopted.length} forslag med en samlet budgeteffekt på ${partyImpact > 0 ? '+' : ''}${partyImpact} mia kr/år.
      Vedtagne: ${adopted.slice(0, 5).map(p => p.title).join(', ')}${adopted.length > 5 ? ' m.fl.' : ''}.</p>`;
  }

  VG.showModal('Analyse af dit budget', html);
};

VG.theme = {};

VG.theme.apply = function(mode) {
  if (mode === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', mode);
  }
  try { localStorage.setItem('vg-theme', mode); } catch {}
};

VG.theme._isDark = function() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark')  return true;
  if (attr === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

VG.theme.toggle = function() {
  const next = VG.theme._isDark() ? 'light' : 'dark';
  VG.theme.apply(next);
  document.getElementById('theme-icon').textContent = next === 'dark' ? '☾' : '☀';
};

VG.theme.init = function() {
  let saved = null;
  try { saved = localStorage.getItem('vg-theme'); } catch {}
  const mode = saved || 'dark';
  VG.theme.apply(mode);
  document.getElementById('theme-icon').textContent = VG.theme._isDark() ? '☾' : '☀';
};

VG.bootstrap = async function() {
  try {
    const baseline = await VG.api.loadBaseline();
    VG.state.baseline = baseline;
    VG.state.current = VG.deepClone(baseline);

    VG.share.applyFromURL();

    VG.render.all();

    document.getElementById('data-status').textContent = `Finanslov ${baseline.fiscalYear} · v${baseline.version}`;
    document.getElementById('version-info').textContent = `Kalibreret ${baseline.lastCalibrated}`;

    VG.api.loadKeyFigures().then(data => {
      if (data) {
        VG.state.live.population = data.population;
        VG.state.live.gdp = data.gdp;
        VG.state.live.unemployment = data.unemployment;
        VG.render.liveIndicators();
      }
    });

    VG.api.loadRecentVotes().then(data => {
      VG.state.live.votesLoaded = true;
      if (data && data.votes) {
        VG.state.live.votes = data.votes;
      }
      if (VG.state.activeTab === 'folketing') {
        document.getElementById('panel-folketing').innerHTML = VG.render.folketing();
      }
    });

    VG.party.init();
    VG.party.load().then(() => {
      VG.party.startPolling();

      VG.livedata.load().then(() => {
        VG.render.liveIndicators();
        if (VG.state.activeTab === 'overview') {
          VG.render.safePanel('panel-overview', () => VG.render.overview());
          VG.render.loadToday();
        }
      });
      // Auto-refresh live ticker every 5 minutes
      setInterval(() => {
        VG.livedata.load().then(() => VG.render.liveIndicators()).catch(() => {});
      }, 5 * 60 * 1000);

      VG.api.fetchJSON('/api/oda/active-bills').then(data => {
        if (data && data.bills) {
          VG.state.live.activeBills = data.bills;
          if (VG.state.activeTab === 'folketing') {
            VG.render.safePanel('panel-folketing', () => VG.render.folketing());
          }
        }
      }).catch(() => {});
    });

    VG.demo.load();
    VG.platform.init();

    VG.api.loadGovernment().then(data => {
      if (data) {
        VG.regering.data = data;
        if (VG.state.activeTab === 'regering') VG.regering.renderPanel();
        if (VG.state.activeTab === 'partier')  VG.partier.renderPanel();
      }
    });
    VG.borger.init();
    VG.api.fetchJSON('/api/borgerforslag/active').then(data => {
      if (data && data.proposals) {
        VG.state.live.borgerforslag = data.proposals;
        if (VG.state.activeTab === 'borger') {
          VG.borger.renderPanel();
        }
      }
    }).catch(() => {});
  } catch (err) {
    console.error('Bootstrap error:', err);
    document.getElementById('data-status').textContent = 'Fejl ved indlæsning';
    document.getElementById('panel-overview').innerHTML = `<div class="card"><h2>Kunne ikke indlæse</h2><p>Der opstod en fejl ved indlæsning af data: ${err.message}. Prøv at genindlæse siden.</p></div>`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  VG.theme.init();
  VG.bootstrap();

  const GROUPS = {
    loefter: { label: 'Løfter & Politisk analyse', tabs: [
      { id: 'promises',            label: 'Regeringsløfter 2026' },
      { id: 'rygter',              label: 'Nyheder & DREAM-analyse' },
      { id: 'laboratorium',        label: 'Politisk Lab' },
      { id: 'partier',             label: 'Partier' },
      { id: 'regering',            label: 'Regering & koalition' },
      { id: 'folketing',           label: 'Folketing — afstemninger' },
      { id: 'mandater',            label: 'Mandater' },
      { id: 'meningsmaalinger',    label: 'Meningsmålinger' },
      { id: 'borger',              label: 'Borgerforslag' },
      { id: 'platform',            label: 'Mit Parti' },
      { id: 'party',               label: 'Borgerstemmer' },
      { id: 'valgkort',            label: 'Valgkort' },
    ]},
    oekonomi: { label: 'Økonomi & Budget', tabs: [
      { id: 'policy',              label: 'Politiske parametre (MAKRO)' },
      { id: 'spending',            label: 'Udgifter' },
      { id: 'revenue',             label: 'Indtægter' },
      { id: 'projection',          label: 'Fremskrivning & Holdbarhed' },
      { id: 'statsgaeld',          label: 'Statsgæld' },
      { id: 'historik',            label: 'Historik' },
      { id: 'scenarios',           label: 'Scenarier' },
      { id: 'statsgaeld',          label: 'Statsgæld' },
      { id: 'erhverv',             label: 'Erhverv & Vækst' },
      { id: 'innovation',          label: 'Innovation' },
      { id: 'inflation',           label: 'Inflation' },
      { id: 'udenrigshandel',      label: 'Udenrigshandel' },
    ]},
  };

  // Pinned sub-tabs shown in the secondary bar (others go in "Alle ▾" dropdown)
  const PINNED_TABS = {
    personligt: ['borger', 'bolig', 'pension', 'elpris'],
    samfund:    ['demographics', 'sundhed', 'ledighed', 'co2', 'boligmarked', 'uddannelse'],
    politik:    ['platform', 'party', 'partier', 'regering', 'folketing', 'meningsmaalinger', 'laboratorium'],
    oekonomi:   ['policy', 'spending', 'revenue', 'projection', 'rygter', 'statsgaeld'],
  };

  let activeGroup = null;

  // ── Sidebar navigation ──────────────────────────────────────────────────────

  function buildSidebar() {
    const nav = document.getElementById('sb-nav');
    if (!nav) return;

    const GROUP_ICONS = {
      personligt: '<i class="ph ph-user-circle"></i>',
      samfund:    '<i class="ph ph-globe-hemisphere-west"></i>',
      politik:    '<i class="ph ph-buildings"></i>',
      oekonomi:   '<i class="ph ph-chart-line-up"></i>',
    };
    const TAB_ICONS = {
      dashboard:'<i class="ph ph-squares-four"></i>',  feed:'<i class="ph ph-newspaper"></i>',
      borger:'<i class="ph ph-calculator"></i>',        bolig:'<i class="ph ph-house"></i>',
      pension:'<i class="ph ph-suitcase"></i>',         elpris:'<i class="ph ph-lightning"></i>',
      overview:'<i class="ph ph-map-trifold"></i>',     demographics:'<i class="ph ph-users"></i>',
      danmarkskort:'<i class="ph ph-globe-hemisphere-west"></i>',
      kommuner:'<i class="ph ph-map-pin"></i>',         sundhed:'<i class="ph ph-first-aid"></i>',
      forbrug:'<i class="ph ph-shopping-bag"></i>',     energi:'<i class="ph ph-lightning"></i>',
      ledighed:'<i class="ph ph-trend-down"></i>',      ventetider:'<i class="ph ph-clock"></i>',
      dsb:'<i class="ph ph-train"></i>',                aeldrepleje:'<i class="ph ph-heart"></i>',
      boligmarked:'<i class="ph ph-buildings"></i>',    indkomst:'<i class="ph ph-coin"></i>',
      co2:'<i class="ph ph-leaf"></i>',                 kriminalitet:'<i class="ph ph-siren"></i>',
      uddannelse:'<i class="ph ph-graduation-cap"></i>',inflation:'<i class="ph ph-trend-up"></i>',
      udenrigshandel:'<i class="ph ph-globe"></i>',     landbrug:'<i class="ph ph-plant"></i>',
      folkesundhed:'<i class="ph ph-first-aid"></i>',   ligestilling:'<i class="ph ph-scales"></i>',
      velfaerdsstat:'<i class="ph ph-globe"></i>',      generationsregnskab:'<i class="ph ph-baby"></i>',
      arbejdsmiljoe:'<i class="ph ph-hard-hat"></i>',   medietillid:'<i class="ph ph-newspaper"></i>',
      groenomstilling:'<i class="ph ph-leaf"></i>',     boligkrise:'<i class="ph ph-house-line"></i>',
      psykiatri:'<i class="ph ph-brain"></i>',          folkeskolen:'<i class="ph ph-student"></i>',
      naturvand:'<i class="ph ph-waves"></i>',          integration:'<i class="ph ph-globe"></i>',
      forsvar:'<i class="ph ph-shield"></i>',           platform:'<i class="ph ph-star"></i>',
      party:'<i class="ph ph-check-square"></i>',       partier:'<i class="ph ph-chart-bar"></i>',
      regering:'<i class="ph ph-bank"></i>',            folketing:'<i class="ph ph-notepad"></i>',
      mandater:'<i class="ph ph-calculator"></i>',      valgkort:'<i class="ph ph-map-trifold"></i>',
      meningsmaalinger:'<i class="ph ph-chart-bar"></i>',laboratorium:'<i class="ph ph-flask"></i>',
      rygter:'<i class="ph ph-newspaper"></i>',         policy:'<i class="ph ph-scales"></i>',
      spending:'<i class="ph ph-arrow-up-right"></i>',  revenue:'<i class="ph ph-arrow-down-left"></i>',
      projection:'<i class="ph ph-chart-line-up"></i>', historik:'<i class="ph ph-clock-counter-clockwise"></i>',
      scenarios:'<i class="ph ph-funnel"></i>',         statsgaeld:'<i class="ph ph-bank"></i>',
      erhverv:'<i class="ph ph-briefcase"></i>',        innovation:'<i class="ph ph-flask"></i>',
      reddit:'<i class="ph ph-reddit-logo"></i>',
    };
    const stripLabel = s => s.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}🏛🌍]+\s*/gu, '').trim();

    let html = `
      <a class="sb-item" data-sb="promises">
        <span class="sb-item-icon"><i class="ph ph-flag-banner"></i></span>
        <span class="sb-item-label">Regeringsløfter 2026</span>
        <span class="sb-item-live"></span>
      </a>
      <a class="sb-item" data-sb="overview">
        <span class="sb-item-icon">${TAB_ICONS.overview || '<i class="ph ph-map-trifold"></i>'}</span>
        <span class="sb-item-label">Danmark i dag — overblik</span>
      </a>
      <a class="sb-item" data-sb="feed">
        <span class="sb-item-icon">${TAB_ICONS.feed}</span>
        <span class="sb-item-label">Nyheder</span>
        <span class="sb-item-live"></span>
      </a>
      <a class="sb-item" data-sb="profile">
        <span class="sb-item-icon"><i class="ph ph-user-circle"></i></span>
        <span class="sb-item-label">Min løsning</span>
      </a>
      <div class="sb-section-label">Udforsk data</div>`;

    for (const [gk, group] of Object.entries(GROUPS)) {
      const gIcon = GROUP_ICONS[gk] || '<i class="ph ph-circle"></i>';
      const gName = stripLabel(group.label) || group.label;
      html += `
        <div class="sb-group" data-sb-group="${gk}">
          <button class="sb-group-btn">
            <span class="sb-group-icon">${gIcon}</span>
            <span class="sb-group-name">${gName}</span>
            <span class="sb-group-chevron">▾</span>
          </button>
          <div class="sb-group-items">
            ${group.tabs.map(t => {
              const ico = TAB_ICONS[t.id] || '';
              const lbl = stripLabel(t.label) || t.label;
              return `<a class="sb-sub-item" data-sb="${t.id}">${ico ? `<span class="sb-sub-icon">${ico}</span>` : ''}${lbl}</a>`;
            }).join('')}
          </div>
        </div>`;
    }

    nav.innerHTML = html;

    nav.querySelectorAll('[data-sb]').forEach(el => {
      el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.sb); });
    });

    nav.querySelectorAll('.sb-group-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const grp    = btn.closest('.sb-group');
        const isOpen = grp.classList.toggle('open');
        if (isOpen) {
          nav.querySelectorAll('.sb-group.open').forEach(g => { if (g !== grp) g.classList.remove('open'); });
          const firstId = GROUPS[grp.dataset.sbGroup]?.tabs[0]?.id;
          if (firstId) navigateTo(firstId);
        }
      });
    });
  }

  function navigateTo(panelId) {
    // Redirect removed panel IDs to their canonical equivalents
    const REDIRECTS = { dashboard: 'overview', danmarkskort: 'overview', folkesundhed: 'sundhed', groenomstilling: 'co2', boligkrise: 'boligmarked', folkeskolen: 'uddannelse' };
    if (REDIRECTS[panelId]) panelId = REDIRECTS[panelId];

    // Lazy-load panel-specific modules
    if (panelId === 'party')    VG.party    && VG.party.load();
    if (panelId === 'feed')     VG.feed     && VG.feed.load();
    if (panelId === 'promises') VG.promises && VG.promises.load();
    if (panelId === 'profile')  VG.auth     && VG.auth.init();

    // Determine owning group
    let owningGroup = null;
    for (const [gk, g] of Object.entries(GROUPS)) {
      if (g.tabs.some(t => t.id === panelId)) { owningGroup = gk; break; }
    }
    activeGroup = owningGroup;

    // Budget KPI bar only in Økonomi
    const summaryEl = document.getElementById('summary');
    if (summaryEl) summaryEl.classList.toggle('summary-visible', owningGroup === 'oekonomi');

    document.body.classList.remove('dk-immersive', 'dk-peek');

    switchTab(panelId);
    _updateSidebarActive(panelId, owningGroup);
    _updateBreadcrumb(panelId, owningGroup);
    _updateMobileNav(panelId, owningGroup);
    _closeMobileSidebar();
  }

  function switchTab(tabId) {
    VG.state.activeTab = tabId;
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + tabId));
    VG.render.fast();
  }

  // Keep switchGroup callable by external code (e.g. old hub links)
  function switchGroup(groupKey) {
    const g = GROUPS[groupKey];
    if (!g) return;
    navigateTo(g.tabs[0].id);
  }

  function _updateSidebarActive(panelId, owningGroup) {
    const nav = document.getElementById('sb-nav');
    if (!nav) return;
    nav.querySelectorAll('.sb-item, .sb-sub-item').forEach(el => {
      el.classList.toggle('active', el.dataset.sb === panelId);
    });
    // Open parent group, close others
    nav.querySelectorAll('.sb-group').forEach(grp => {
      const isOwner = grp.dataset.sbGroup === owningGroup;
      grp.classList.toggle('open', !!isOwner);
    });
  }

  function _updateBreadcrumb(panelId, owningGroup) {
    let section = '', page = panelId;
    if (panelId === 'danmarkskort') { page = 'Danmarksmaskinen'; }
    else if (panelId === 'dashboard') { page = 'Mit Dashboard'; }
    else if (panelId === 'feed') { page = 'Nyheder & Indsigter'; }
    else if (owningGroup && GROUPS[owningGroup]) {
      const g   = GROUPS[owningGroup];
      const tab = g.tabs.find(t => t.id === panelId);
      section = g.label.replace(/^\S+\s*/, '');
      page    = tab ? tab.label.replace(/^\S+\s*/, '') : panelId;
    }
    const secEl  = document.getElementById('topbar-bc-section');
    const sepEl  = document.getElementById('topbar-bc-sep');
    const pageEl = document.getElementById('topbar-bc-page');
    if (secEl)  secEl.textContent  = section;
    if (sepEl)  sepEl.textContent  = section ? '›' : '';
    if (pageEl) pageEl.textContent = page;
    const kortBtn = document.getElementById('topbar-bc-kort');
    if (kortBtn) kortBtn.style.display = panelId === 'danmarkskort' ? 'none' : '';
  }

  function _updateMobileNav(panelId, owningGroup) {
    const nav = document.getElementById('mobile-nav');
    if (!nav) return;
    const GROUP_MAP = { personligt: null, samfund: 'demographics', politik: 'meningsmaalinger', oekonomi: 'laboratorium' };
    nav.querySelectorAll('.mnav-item').forEach(btn => {
      const target = btn.dataset.mnav;
      const isActive = target === panelId ||
        (owningGroup && GROUP_MAP[owningGroup] === target) ||
        (panelId === 'reddit' && target === 'feed');
      btn.classList.toggle('active', isActive);
    });
  }

  function _closeMobileSidebar() {
    document.getElementById('sidebar')?.classList.remove('mobile-open');
    document.getElementById('sb-overlay')?.classList.remove('active');
  }

  // Logo click → go to dashboard
  document.querySelector('.sb-brand')?.addEventListener('click', () => navigateTo('dashboard'));

  // Sidebar collapse (desktop)
  document.getElementById('sb-collapse')?.addEventListener('click', () => {
    const sb  = document.getElementById('sidebar');
    const btn = document.getElementById('sb-collapse');
    if (!sb) return;
    const collapsed = sb.classList.toggle('collapsed');
    if (btn) btn.textContent = collapsed ? '›' : '‹';
  });

  // Sidebar expand toggle
  const sbExpandBtn = document.getElementById('sb-expand-btn');
  if (sbExpandBtn) {
    sbExpandBtn.addEventListener('click', () => {
      const sb = document.getElementById('sidebar');
      if (!sb) return;
      const expanded = sb.classList.toggle('sb-expanded');
      sbExpandBtn.textContent = expanded ? '‹' : '›';
    });
  }
  document.getElementById('sb-collapse')?.addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    if (sb) sb.classList.remove('sb-expanded');
    const btn = document.getElementById('sb-expand-btn');
    if (btn) btn.textContent = '›';
  });

  // Mobile hamburger
  document.getElementById('topbar-hamburger')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.add('mobile-open');
    document.getElementById('sb-overlay')?.classList.add('active');
  });
  document.getElementById('sb-overlay')?.addEventListener('click', _closeMobileSidebar);

  // Sidebar search filter
  document.getElementById('sb-search')?.addEventListener('input', e => {
    const q   = e.target.value.toLowerCase().trim();
    const nav = document.getElementById('sb-nav');
    if (!nav) return;
    if (!q) {
      nav.querySelectorAll('.sb-group, .sb-sub-item, .sb-item').forEach(el => el.style.display = '');
      return;
    }
    nav.querySelectorAll('.sb-group').forEach(grp => {
      let any = false;
      grp.querySelectorAll('.sb-sub-item').forEach(item => {
        const match = item.textContent.toLowerCase().includes(q);
        item.style.display = match ? '' : 'none';
        if (match) any = true;
      });
      grp.style.display = any ? '' : 'none';
      if (any) grp.classList.add('open');
    });
    nav.querySelectorAll('.sb-item').forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // ── Init ────────────────────────────────────────────────────────────────────

  // Auto-collapse sidebar on medium screens (769–1100px) to maximize content area
  if (window.innerWidth >= 769 && window.innerWidth <= 1100) {
    document.getElementById('sidebar')?.classList.add('collapsed');
    const colBtn = document.getElementById('sb-collapse');
    if (colBtn) colBtn.textContent = '›';
  }

  // Wire up mobile bottom navigation
  document.getElementById('mobile-nav')?.querySelectorAll('.mnav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.mnav));
  });

  buildSidebar();

  // Override overview to show hub grid only — news belongs in Nyheder
  VG.render.overview = function() { return VG.render.hubGrid(); };

  // Start on overview (original landing), pre-load promises panel too
  navigateTo('overview');
  VG.promises && VG.promises.load();

  window.__switchGroup = switchGroup;
  window.__switchTab   = switchTab;
  window.__goHome      = () => navigateTo('overview');
  window.__mkClick     = navigateTo;

  // Brand logo → overview
  document.querySelector('.sb-brand')?.addEventListener('click', () => navigateTo('overview'));

  document.getElementById('btn-reset')?.addEventListener('click', () => {
    VG.reset();
    history.replaceState(null, '', window.location.pathname);
    VG.render.all();
    VG.toast('Nulstillet til FL2026');
  });
  document.getElementById('btn-changes')?.addEventListener('click', VG.actions.showChanges);
  document.getElementById('btn-share')?.addEventListener('click', VG.actions.share);
  document.getElementById('btn-analyze')?.addEventListener('click', VG.actions.analyze);
  document.getElementById('theme-toggle')?.addEventListener('click', VG.theme.toggle);
  document.getElementById('btn-auth')?.addEventListener('click', () => VG.auth && VG.auth.showAuthModal());
  document.getElementById('btn-save')?.addEventListener('click', () => VG.auth && VG.auth.showSaveModal());

  document.getElementById('live-indicators')?.addEventListener('click', e => {
    const ind = e.target.closest('[data-nav]');
    if (ind) navigateTo(ind.dataset.nav);
  });

  document.getElementById('modal-close')?.addEventListener('click', VG.closeModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') VG.closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') VG.closeModal();
  });

  window.addEventListener('resize', () => {
    if (VG.state.activeTab === 'projection') VG.chart.drawDebt();
  });

  // Init auth silently
  VG.auth && VG.auth.init();
});
