// ── AI Insights & News Feed ───────────────────────────────────────────────────
// Rule-based insights derived from live DST / Nationalbank / climate data.
// Each insight has a unique `id` so vote bars persist across visits.

VG.feed = {};

VG.feed._generateInsights = function() {
  const insights = [];
  const eco  = VG.livedata  && VG.livedata.economic;
  const cli  = VG.livedata  && VG.livedata.climate;
  const live = VG.state     && VG.state.live;

  // ── Inflation ──────────────────────────────────────────────────────────────
  if (eco && eco.inflation) {
    const v   = eco.inflation.yoy != null ? eco.inflation.yoy : eco.inflation.value;
    const bad = v > 4, warn = v > 2;
    insights.push({
      id: 'inf-' + (eco.inflation.period || 'now').replace(/\s/g, '-'),
      category: 'Økonomi', icon: '<i class="ph ph-trend-up"></i>',
      tag: bad ? 'Høj inflation' : warn ? 'Over 2%-mål' : v < 1 ? 'Under mål' : 'Stabil',
      tagType: bad ? 'alert' : warn ? 'warn' : 'ok',
      headline: `Inflation ${v.toFixed(1).replace('.', ',')}% — ${bad ? 'pres på ECB-mål' : warn ? 'over ECB\'s 2%-målsætning' : 'tæt på det optimale niveau'}`,
      body: `Den aktuelle inflation på ${v.toFixed(1).replace('.', ',')}% (${eco.inflation.period || 'seneste'}). ECB's mål er 2%. ${bad ? 'Et vedvarende niveau over 4% vil typisk udløse rentestigninger, som rammer boliglån og erhvervsfinansiering.' : warn ? 'Nationalbanken følger udviklingen tæt — renteforhøjelser kan komme på tale.' : 'Inflationen er på et sundt niveau og understøtter stabil vækst.'}`,
      panel: 'inflation', time: eco.inflation.period || 'Aktuel',
      basePos: 14, baseNeg: 4,
    });
  }

  // ── Budget ─────────────────────────────────────────────────────────────────
  if (VG.state && VG.state.current && VG.state.baseline) {
    try {
      const bal  = VG.sumRev() - VG.sumExp();
      const bnp  = VG.state.baseline.gdp;
      const pct  = bal / bnp * 100;
      const sign = pct >= 0 ? '+' : '';
      insights.push({
        id: 'budget-fl2026',
        category: 'Økonomi', icon: '<i class="ph ph-scales"></i>',
        tag: pct < -3 ? 'EU-grænse' : pct < -0.5 ? 'Underskud' : 'Overskud',
        tagType: pct < -3 ? 'alert' : pct < -0.5 ? 'warn' : 'ok',
        headline: `Finanslov 2026: ${sign}${pct.toFixed(1).replace('.', ',')}% af BNP`,
        body: pct < -3
          ? `Underskuddet på ${Math.abs(pct).toFixed(1).replace('.', ',')}% af BNP overskrider EU's Stabilitets- og Vækstpagts grænse på 3%. Det kan udløse en procedure mod Danmark og tvinge budgetstramninger.`
          : pct < 0
          ? `Budgettet viser et underskud på ${Math.abs(pct).toFixed(1).replace('.', ',')}% af BNP. Inden for EU's 3%-grænse, men der er begrænset råderum til nye udgifter.`
          : `Et overskud på ${pct.toFixed(1).replace('.', ',')}% af BNP styrker den finansielle stødpude og giver mulighed for at investere i fremtiden eller sænke gælden.`,
        panel: 'laboratorium', time: 'FL 2026',
        basePos: 19, baseNeg: 8,
      });
    } catch(e) {}
  }

  // ── CO₂ ───────────────────────────────────────────────────────────────────
  if (cli && cli.co2 && cli.co2.value && cli.co2.target2030) {
    const v   = cli.co2.value;
    const g   = cli.co2.target2030;
    const red = Math.round((1 - v / g) * 100);
    const rem = 70 - red;
    insights.push({
      id: 'co2-' + (cli.co2.year || 2024),
      category: 'Klima', icon: '<i class="ph ph-leaf"></i>',
      tag: red >= 70 ? 'Mål nået!' : red >= 60 ? 'Tæt på' : 'Bagud',
      tagType: red >= 70 ? 'ok' : red >= 55 ? 'warn' : 'alert',
      headline: `CO₂ reduceret ${red}% siden 1990${rem > 0 ? ` — ${rem}pp mangler til 2030-målet` : ' — klimamål nået!'}`,
      body: `Danmarks 2030-klimamål er 70% CO₂-reduktion fra 1990-niveauet. Vi er nået ${red}%. ${rem > 0 ? `Der mangler ${rem} procentpoint på ${2030 - (cli.co2.year || 2024)} år. Det kræver markante tiltag inden for energi, transport og landbrug.` : 'En historisk bedrift — Danmark er et af få lande i verden der har nået et sådant mål.'}`,
      panel: 'co2', time: String(cli.co2.year || 2024),
      basePos: 28, baseNeg: 5,
    });
  }

  // ── Boligpriser ───────────────────────────────────────────────────────────
  if (eco && eco.housing) {
    const v = eco.housing.qoq;
    insights.push({
      id: 'housing-' + (eco.housing.period || 'q').replace(/\s/g, '-'),
      category: 'Bolig', icon: '<i class="ph ph-house"></i>',
      tag: v > 3 ? 'Kraftig stigning' : v > 1 ? 'Stigning' : v < -2 ? 'Prisfald' : 'Stabilt',
      tagType: v > 3 ? 'alert' : v > 1 ? 'warn' : v < -2 ? 'alert' : 'ok',
      headline: `Boligpriser ${v >= 0 ? 'steg' : 'faldt'} ${Math.abs(v).toFixed(1).replace('.', ',')}% (${eco.housing.period || 'kvartal'})`,
      body: `${v > 2 ? 'Den kraftige prisstigning øger presset på førstegangskøbere og kan kræve politisk indgreb mod spekulation.' : v < -2 ? 'Prisfaldene skaber usikkerhed hos boligejere med høj belåning og kan ramme bankernes sikkerhedsstillelse.' : 'Boligpriserne er relativt stabile. Renteudviklingen er den vigtigste faktor fremadrettet.'}`,
      panel: 'boligmarked', time: eco.housing.period || 'Kvartal',
      basePos: 11, baseNeg: 13,
    });
  }

  // ── Nationalbankrente ─────────────────────────────────────────────────────
  if (eco && eco.nbRate) {
    const v = eco.nbRate.value;
    insights.push({
      id: 'nbrate-' + v.toFixed(2),
      category: 'Økonomi', icon: '<i class="ph ph-bank"></i>',
      tag: v > 4 ? 'Høj rente' : v > 2 ? 'Forhøjet' : v < 0.5 ? 'Historisk lav' : 'Normal',
      tagType: v > 4 ? 'alert' : v > 2.5 ? 'warn' : 'ok',
      headline: `Nationalbanken: pengepolitisk rente på ${v.toFixed(2).replace('.', ',')}%`,
      body: `${v > 3 ? 'Den høje rente dæmper inflationen, men øger udgifterne til boliglån og erhvervsfinansiering. Boligmarkedet mærker presset direkte.' : v < 1 ? 'Den historisk lave rente stimulerer forbrug og investeringer, men kan blæse bobler op på aktie- og boligmarkedet.' : 'Renten er på et niveau der søger balance mellem at bekæmpe inflation og understøtte vækst.'}`,
      panel: 'statsgaeld', time: 'Aktuel',
      basePos: 9, baseNeg: 6,
    });
  }

  // ── Ledighed ──────────────────────────────────────────────────────────────
  if (live && live.unemployment && live.unemployment.value) {
    const val  = live.unemployment.value;
    const rate = (val / 2_850_000 * 100);
    insights.push({
      id: 'unemp-' + (live.unemployment.period || 'now').replace(/\s/g, '-'),
      category: 'Arbejdsmarked', icon: '<i class="ph ph-hard-hat"></i>',
      tag: rate > 6 ? 'Høj ledighed' : rate < 3 ? 'Historisk lav' : 'Normal',
      tagType: rate > 6 ? 'alert' : rate > 5 ? 'warn' : 'ok',
      headline: `${val.toLocaleString('da-DK')} ledige (${rate.toFixed(1).replace('.', ',')}%) — ${rate < 4 ? 'rekordlav ledighed' : 'stabil arbejdsmarked'}`,
      body: `${val.toLocaleString('da-DK')} ledige per ${live.unemployment.period || 'seneste opgørelse'}. ${rate < 4 ? 'Lav ledighed er godt for statsfinanserne, men kan skabe lønpres og inflatonsrisiko — og gøre det svært at finde arbejdskraft.' : 'Ledigheden er på niveau med den strukturelle ledighed i Danmark.'}`,
      panel: 'ledighed', time: live.unemployment.period || 'Aktuel',
      basePos: 17, baseNeg: 3,
    });
  }

  // ── Meningsmålinger ───────────────────────────────────────────────────────
  insights.push({
    id: 'polls-maj-2026',
    category: 'Politik', icon: '<i class="ph ph-chart-bar"></i>',
    tag: 'Ny måling',
    tagType: 'info',
    headline: 'S fører med 20% — LA og V i tæt kamp om andenpladsen',
    body: 'Socialdemokraterne fører meningsmålingerne med 20,1%. Liberal Alliance (13,2%) og Venstre (12,8%) kæmper om andenpladsen. Danmarksdemokraterne er i fremgang (+0,6pp). Alternativet er over 3,5%-spærregrænsen. Blå blok har ikke opnåeligt flertal alene.',
    panel: 'meningsmaalinger', time: 'Maj 2026',
    basePos: 22, baseNeg: 10,
  });

  // ── Forsvar & NATO ────────────────────────────────────────────────────────
  insights.push({
    id: 'forsvar-nato-2026',
    category: 'Forsvar', icon: '<i class="ph ph-shield-checkered"></i>',
    tag: 'NATO-krav',
    tagType: 'alert',
    headline: 'Danmark øger forsvar til 3% af BNP — historisk udgiftsniveau',
    body: 'Regeringen har forpligtet sig til 3% af BNP i forsvarsudgifter inden 2030, svarende til ~75 mia. kr. pr. år — mere end en fordobling fra det nuværende niveau på ~33 mia. Det vil kræve enten markante nedskæringer andetsteds, ny gæld eller skatteforhøjelser. DREAM vurderer multiplikatoren til ~0,7 mod ~1,2 for civil investering.',
    panel: 'forsvar', time: 'Maj 2026',
    basePos: 14, baseNeg: 18,
  });

  // ── Boligkrise ────────────────────────────────────────────────────────────
  insights.push({
    id: 'boligkrise-2026',
    category: 'Bolig', icon: '<i class="ph ph-house"></i>',
    tag: 'Krise',
    tagType: 'alert',
    headline: 'Boligbyggeri på laveste niveau i 10 år — mens priserne stiger',
    body: 'Antallet af nye boliger i byggetilladelse faldt til 31.000 i 2025 — det laveste siden 2015. Samtidig stiger priserne i Storkøbenhavn med 3,2% kvartalsvis. Gab mellem udbud og efterspørgsel vokser. Realkreditinstitutterne advarer om, at den kombinerede effekt af høje renter, materialeprisstigning og faldende byggeaktivitet kan skabe strukturel boligmangel i 2027-2030.',
    panel: 'boligmarked', time: 'Maj 2026',
    basePos: 8, baseNeg: 20,
  });

  // ── Statsgæld ─────────────────────────────────────────────────────────────
  insights.push({
    id: 'gaeld-forsvar-2026',
    category: 'Økonomi', icon: '<i class="ph ph-bank"></i>',
    tag: 'Advarsel',
    tagType: 'warn',
    headline: 'Forsvarsopbygning kan bringe statsgæld over 40% af BNP i 2030',
    body: 'Den nuværende statsgæld på ~29% af BNP er solid. Men forsvarsforligets +40 mia./år kombineret med demografisk pres (flere ældre, færre i arbejde) kan drive gælden til 40-45% BNP inden 2030 uden finansieringsplan. Det er fortsat under Maastricht-grænsen på 60%, men råderummet til nye velfærdsinvesteringer indsnævres markant.',
    panel: 'statsgaeld', time: 'Maj 2026',
    basePos: 9, baseNeg: 12,
  });

  // ── Pesticider i drikkevand ───────────────────────────────────────────────
  insights.push({
    id: 'pesticider-2026',
    category: 'Samfund', icon: '<i class="ph ph-drop"></i>',
    tag: 'Miljø',
    tagType: 'alert',
    headline: '30% af danske vandboringer har pesticidfund — PFAS-krise accelererer',
    body: '30% af alle overvågede vandboringer viser pesticidfund over grænseværdien. PFAS ("evighedskemikalier") er nu fundet i 45% af boringer. Miljøstyrelsen har lukket 118 vandværker siden 2020. Oprydning estimeres til 12-18 mia. kr. De ansvarlige industrier har i mange tilfælde ikke betalt for oprydningen.',
    panel: 'naturvand', time: 'Maj 2026',
    basePos: 5, baseNeg: 28,
  });

  // ── Folketing ─────────────────────────────────────────────────────────────
  if (live && live.activeBills && live.activeBills.length) {
    insights.push({
      id: 'ft-bills-' + live.activeBills.length,
      category: 'Politik', icon: '<i class="ph ph-buildings"></i>',
      tag: 'Aktiv lovgivning',
      tagType: 'info',
      headline: `${live.activeBills.length} lovforslag til afstemning i Folketing`,
      body: `Folketinget behandler pt. ${live.activeBills.length} aktive lovforslag. Følg afstemningerne i realtid via Folketing-panelet, der henter data direkte fra Folketingets åbne API.`,
      panel: 'folketing', time: 'Live',
      basePos: 8, baseNeg: 2,
    });
  }

  return insights;
};

VG.feed.load = function() {
  const panel = document.getElementById('panel-feed');
  if (!panel) return;
  VG.feed.renderPanel(panel);
};

VG.feed.renderPanel = function(panel) {
  if (!panel) return;

  const insights     = VG.feed._generateInsights();
  const activeFilter = panel._feedFilter || 'all';

  const cats     = ['all', ...new Set(insights.map(i => i.category))];
  const filtered = activeFilter === 'all'
    ? insights
    : insights.filter(i => i.category === activeFilter);

  const tagCls = { alert: 'ft-alert', warn: 'ft-warn', ok: 'ft-ok', info: 'ft-info' };

  const filtersHtml = cats.map(c => {
    const active = (c === 'all' && activeFilter === 'all') || c === activeFilter;
    return `<button class="feed-filter-btn${active ? ' active' : ''}" data-fcat="${c}">${c === 'all' ? 'Alle' : c}</button>`;
  }).join('');

  const itemsHtml = filtered.map(item => {
    const tc       = tagCls[item.tagType] || 'ft-info';
    const voteHtml = VG.votes ? VG.votes.renderBar(item.id, item.basePos, item.baseNeg) : '';
    return `
      <article class="feed-card" data-fid="${item.id}">
        <div class="feed-card-meta">
          <span class="feed-cat-label">${item.icon} ${item.category}</span>
          <span class="feed-tag ${tc}">${item.tag}</span>
          <span class="feed-time">${item.time}</span>
          <span class="feed-ai-pill">✦ AI Indsigt</span>
        </div>
        <h3 class="feed-card-headline">${item.headline}</h3>
        <p class="feed-card-body">${item.body}</p>
        <div class="feed-card-footer">
          ${voteHtml}
          <button class="feed-explore" data-goto="${item.panel}">Se data →</button>
        </div>
      </article>`;
  }).join('') || '<p class="feed-empty">Ingen indsigter i denne kategori endnu.</p>';

  const sentiment = VG.votes ? VG.votes.renderSentimentBadge() : '';

  panel.innerHTML = `
    <div class="feed-page-header">
      <div>
        <h2 class="feed-page-title">Nyheder & Indsigter</h2>
        <p class="feed-page-sub">AI-genererede indsigter fra live DST-, Nationalbank- og klimadata — tilføj din stemme til debatten.</p>
      </div>
      ${sentiment ? `<div class="feed-sentiment-wrap">Platform-stemning ${sentiment}</div>` : ''}
    </div>
    <div class="feed-filters">${filtersHtml}</div>
    <div class="feed-list">${itemsHtml}</div>`;

  // Filter buttons
  panel.querySelectorAll('[data-fcat]').forEach(btn => {
    btn.onclick = () => { panel._feedFilter = btn.dataset.fcat; VG.feed.renderPanel(panel); };
  });
  // Explore buttons
  panel.querySelectorAll('[data-goto]').forEach(btn => {
    btn.onclick = () => window.__mkClick && window.__mkClick(btn.dataset.goto);
  });
};
