VG.platform = {};

// ── Position definitions ──────────────────────────────────────────────────────
// e: economic axis  (-3 = strong left,  +3 = strong right)
// s: social axis    (-3 = libertarian,  +3 = authoritarian/traditional)
VG.platform.POSITIONS = [
  // ── Retspolitik ──────────────────────────────────────────────────────────────
  { id:'hash-decrim',  area:'Retspolitik',  icon:'⚖️',
    title:'Afkriminaliser besiddelse af hash',
    desc:'Erstat fængsling med bøde eller behandling for personlig besiddelse. Svarende til modellen i Portugal og Holland.',
    e: 0, s:-2 },
  { id:'min-straffe',  area:'Retspolitik',  icon:'⚖️',
    title:'Obligatoriske minimumsstraffe for vold',
    desc:'Lovfæst minimumsfængselsstraffe for grov vold og personfarlig kriminalitet — fjerner dommerskøn.',
    e: 0, s:+2 },
  { id:'politi-overvåg', area:'Retspolitik', icon:'⚖️',
    title:'Udvid politiets ret til masseovervågning',
    desc:'Tillade CCTV-netværk i byer og automatisk ansigtsgenkendelse i det offentlige rum af hensyn til sikkerhed.',
    e: 0, s:+2 },
  { id:'faengsel-rehab', area:'Retspolitik', icon:'⚖️',
    title:'Rehabilitering frem for straf i fængsler',
    desc:'Flytte fokus fra straf til uddannelse, behandling og resocialisering. Fængslet som kursted, ikke lager.',
    e:-1, s:-2 },
  { id:'krim-lavalder', area:'Retspolitik', icon:'⚖️',
    title:'Sænk den kriminelle lavalder til 12 år',
    desc:'Børn fra 12 år skal kunne straffes som kriminelle (gælder i dag fra 15 år). Fokus på konsekvens.',
    e: 0, s:+2 },

  // ── Udenrigspolitik ──────────────────────────────────────────────────────────
  { id:'eu-forbliv', area:'Udenrigspolitik', icon:'🌍',
    title:'Danmark bør forblive i EU',
    desc:'EU-medlemskab er afgørende for Danmarks handel, sikkerhed og indflydelse. Alternativet er isolation.',
    e:-1, s: 0 },
  { id:'mere-eu',    area:'Udenrigspolitik', icon:'🌍',
    title:'Arbejd for dybere EU-integration',
    desc:'Et stærkere EU med fælles forsvar, udenrigspolitik og evt. fælles skatteregler. Suverænitet deles for indflydelse.',
    e:-1.5, s:-0.5 },
  { id:'nato-aktiv', area:'Udenrigspolitik', icon:'🌍',
    title:'Danmark skal spille en mere aktiv NATO-rolle',
    desc:'Ud over det. 3,5%-mål: Danmark skal lede operationer, øge kapaciteter og være en kernepartner.',
    e:+1, s:+1 },
  { id:'palæstina',  area:'Udenrigspolitik', icon:'🌍',
    title:'Anerkend Palæstina som selvstændig stat',
    desc:'Danmark bør følge Sverige, Irland og Spanien og give fuld statsanerkendelse til Palæstina.',
    e:-1, s: 0 },
  { id:'ukraine-fordobl', area:'Udenrigspolitik', icon:'🌍',
    title:'Fordobl dansk militærstøtte til Ukraine',
    desc:'Øge den samlede support til Ukraines forsvar markant — både materiel, træning og humanitær bistand.',
    e: 0, s:+0.5 },

  // ── Klima & Miljø ────────────────────────────────────────────────────────────
  { id:'klima-2045',    area:'Klima & Miljø', icon:'🌱',
    title:'Klimaneutralitet i 2045, ikke 2050',
    desc:'Fremrykke Dannmarks klimamål med 5 år kræver hurtigere udfasning af fossile brændsler og masseinvestering.',
    e:-1, s:-0.5 },
  { id:'olie-stop',     area:'Klima & Miljø', icon:'🌱',
    title:'Stop ny olie- og gasudvinding i Nordsøen',
    desc:'Forbyd alle nye udvindingstilladelser fra 2027. Eksisterende kan køre til udløb. DK har allerede vedtaget stop for 2050.',
    e:-2, s:-0.5 },
  { id:'atomkraft',     area:'Klima & Miljø', icon:'🌱',
    title:'Tillad atomkraft som del af den grønne mix',
    desc:'Ophæv det danske forbud mod atomkraft. Nye SMR-reaktorer (Small Modular Reactors) kan levere stabil grøn strøm.',
    e:+1, s: 0 },
  { id:'kødafgift',     area:'Klima & Miljø', icon:'🌱',
    title:'Indfør kødafgift på konventionelt kød',
    desc:'Afgift på kød fra konventionel produktion (ca. 7 kr/kg okse) for at afspejle de reelle klimaomkostninger.',
    e:-1, s:+1 },
  { id:'kommuneklima',  area:'Klima & Miljø', icon:'🌱',
    title:'Bindende kommunale klimamål med bøder',
    desc:'Kommuner der ikke opfylder CO2-reduktionsmål straffes med reducerede statsoverførsler.',
    e:-1, s:+1.5 },

  // ── Velfærd & Familie ────────────────────────────────────────────────────────
  { id:'orlov-5050',    area:'Velfærd & Familie', icon:'👨‍👩‍👧',
    title:'Ligestil forældreorlov — 50/50 obligatorisk',
    desc:'Del de 52 ugers orlov ligeligt med kvoter. Ubrugt orlov bortfalder. Svarer til den islandske model.',
    e:-1, s:+1 },
  { id:'doedshjaelp',   area:'Velfærd & Familie', icon:'👨‍👩‍👧',
    title:'Tillad aktiv dødshjælp for terminalt syge',
    desc:'Legaliser assisteret selvmord for voksne med terminal sygdom og fuld samtykkeerklæring.',
    e: 0, s:-2.5 },
  { id:'abort-udvidet', area:'Velfærd & Familie', icon:'👨‍👩‍👧',
    title:'Udvid selvbestemmelsesret for abort til 18 uger',
    desc:'Hæv grænsen fra 12 til 18 uger uden krav om abortsamtale. Giver kvinder mere tid til beslutning.',
    e: 0, s:-2 },
  { id:'borgerlon',     area:'Velfærd & Familie', icon:'👨‍👩‍👧',
    title:'Start borgerløn-forsøg i en dansk kommune',
    desc:'Et 3-årigt forsøg med ubetinget borgerindkomst på ca. 15.000 kr/md. i én frivillig kommune.',
    e:-2, s:-1 },
  { id:'kontanthjælp',  area:'Velfærd & Familie', icon:'👨‍👩‍👧',
    title:'Hæv kontanthjælpen 20% over fattigdomsgrænsen',
    desc:'Sikre at ingen der modtager kontanthjælp lever under den officielle fattigdomsgrænse.',
    e:-2, s: 0 },

  // ── Bolig ────────────────────────────────────────────────────────────────────
  { id:'huslejeloft',   area:'Bolig', icon:'🏠',
    title:'Indfør huslejeloft i de fem største byer',
    desc:'Sæt loft over den årlige huslejestigning til max 3% i kommuner med bolignød.',
    e:-1.5, s:+1 },
  { id:'airbnb',        area:'Bolig', icon:'🏠',
    title:'Begræns AirBnb-udlejning til 30 dage/år',
    desc:'Helårsboliger må kun korttidsudlejes 30 dage per år for at beskytte boligmarkedet.',
    e:-0.5, s:+1 },
  { id:'almene-byg',    area:'Bolig', icon:'🏠',
    title:'Statsgaranti til 10.000 almene boliger/år',
    desc:'Staten stiller byggegaranti for mindst 10.000 nye almene boliger om året de næste 10 år.',
    e:-2, s: 0 },
  { id:'rentefradrag',  area:'Bolig', icon:'🏠',
    title:'Afskaf rentefradraget for boliglån',
    desc:'Rentefradraget giver primært fordele til dem med store lån. Afskaffelse giver 15 mia i provenu.',
    e:-1, s: 0 },

  // ── Uddannelse ───────────────────────────────────────────────────────────────
  { id:'norm-dagtilbud', area:'Uddannelse', icon:'📚',
    title:'Lovfæst minimumsnormeringer i vuggestuer og børnehaver',
    desc:'Max 3 børn pr. voksen i vuggestue, max 6 i børnehave. Sikret ved lov, ikke vejledning.',
    e:-1.5, s:+0.5 },
  { id:'privatskole',   area:'Uddannelse', icon:'📚',
    title:'Halvér statsstøtten til private grundskoler',
    desc:'Private grundskoler modtager 75% i statsstøtte. En halvering øger incitament til fællesskolen.',
    e:-1.5, s:+0.5 },
  { id:'erhvervsskole', area:'Uddannelse', icon:'📚',
    title:'Ligestil erhvervsskoler og gymnasier i ressourcer',
    desc:'EUD-skoler modtager markant færre ressourcer pr. elev end gymnasier. Udlign forskellen.',
    e:-1, s: 0 },
  { id:'karakterfri',   area:'Uddannelse', icon:'📚',
    title:'Indfør karakterfrit første år i gymnasiet',
    desc:'Fokus på læring frem for præstation det første år. Reducerer stress og frafald.',
    e:-0.5, s:-1 },
  { id:'lektiehjælp',   area:'Uddannelse', icon:'📚',
    title:'Gratis lektiehjælp til alle elever i folkeskolen',
    desc:'Statsfinansieret lektiecafé for alle elever kan reducere ulighed i uddannelsesresultater.',
    e:-1, s: 0 },

  // ── Arbejdsmarked ─────────────────────────────────────────────────────────────
  { id:'mindstelon',    area:'Arbejdsmarked', icon:'💼',
    title:'Indfør lovfæstet mindsteløn på 150 kr/t',
    desc:'Danmark er et af få EU-lande uden lovfæstet mindsteløn. 150 kr/t svarer til ca. 26.000 kr/md.',
    e:-2, s:+0.5 },
  { id:'35-timer',      area:'Arbejdsmarked', icon:'💼',
    title:'Reducér arbejdsugen fra 37 til 35 timer',
    desc:'To timer kortere arbejdsuge — som i Frankrig. Kræver 5-6% flere ansatte for samme produktion.',
    e:-2, s: 0 },
  { id:'nul-timer',     area:'Arbejdsmarked', icon:'💼',
    title:'Forbyd 0-timers kontrakter',
    desc:'Kontrakter uden garanterede timer skaber usikkerhed. Minimum 10 timer/uge skal garanteres.',
    e:-1.5, s:+0.5 },
  { id:'fag-fradrag',   area:'Arbejdsmarked', icon:'💼',
    title:'Gør fagforeningskontingent fuldt skattefradragsberettiget',
    desc:'I dag er kun en del fradragsberettiget. Et fuld fradrag styrker den kollektive forhandlingsstyrke.',
    e:-1, s: 0 },
  { id:'bonus-skat',    area:'Arbejdsmarked', icon:'💼',
    title:'Aktieoptioner til ledere beskattes som løn',
    desc:'Aktieaflønning til topchefer beskattes i dag som kapitalindkomst (lav sats). Sæt til lønskat.',
    e:-1.5, s: 0 },

  // ── Demokrati ─────────────────────────────────────────────────────────────────
  { id:'valgalder-16',  area:'Demokrati', icon:'🗳️',
    title:'Sænk valgalderen til 16 år',
    desc:'Unge på 16 kan kørekort, betale skat og giftes. Giv dem stemmeret til kommunal- og Folketing-valg.',
    e: 0, s:-2 },
  { id:'bindende-forslag', area:'Demokrati', icon:'🗳️',
    title:'Bindende folkemøde ved 100.000 underskrifter',
    desc:'Borgerforslagsafstemning via bindende folkeafstemning hvis 100.000 underskrifter indsamles.',
    e: 0, s:-2 },
  { id:'lobbyregister', area:'Demokrati', icon:'🗳️',
    title:'Obligatorisk åbent lobbyistregister',
    desc:'Alle der forsøger at påvirke Folketing-beslutninger skal registreres i et offentligt tilgængeligt register.',
    e:-0.5, s:-1 },
  { id:'partistøtte',   area:'Demokrati', icon:'🗳️',
    title:'Forbyd direkte partistøtte fra virksomheder',
    desc:'Virksomheder og organisationer bør ikke direkte finansiere politiske partier. Kun private borgere.',
    e:-1, s:-0.5 },
  { id:'kvote-kandidater', area:'Demokrati', icon:'🗳️',
    title:'Indfør kvoter for kvinder på partilister',
    desc:'Kræv min. 40% kvinder på partier der opstiller til Folketing-valg for at bevare offentlig partistøtte.',
    e:-1, s:+1 }
];

// Reference positions for real Danish parties (illustrative, not official)
VG.platform.PARTIES = [
  { abbr:'Ø',  name:'Enhedslisten',       e:-7.5, s:-2.5, color:'#B22222' },
  { abbr:'F',  name:'SF',                 e:-5.5, s:-1.5, color:'#E84B3A' },
  { abbr:'Å',  name:'Alternativet',       e:-4.5, s:-3.0, color:'#00C165' },
  { abbr:'A',  name:'Socialdemokratiet',  e:-3.0, s:+1.5, color:'#E32D1C' },
  { abbr:'B',  name:'Radikale Venstre',   e:-1.5, s:-4.0, color:'#9B1EAD' },
  { abbr:'M',  name:'Moderaterne',        e:+0.5, s:+0.5, color:'#6B3FA0' },
  { abbr:'C',  name:'Konservative',       e:+3.5, s:+2.0, color:'#006B3C' },
  { abbr:'V',  name:'Venstre',            e:+4.5, s:+0.5, color:'#003F87' },
  { abbr:'I',  name:'Liberal Alliance',   e:+7.0, s:-3.0, color:'#00A0D6' },
  { abbr:'O',  name:'Dansk Folkeparti',   e:+2.0, s:+5.0, color:'#F4A82A' },
  { abbr:'D',  name:'Danmarksdemokraterne',e:+1.5,s:+3.5, color:'#1B3A6B' }
];

// ── State ─────────────────────────────────────────────────────────────────────
VG.platform.state = {
  stances: {},      // id → 'ja' | 'nej' | null
  partyName: 'Mit Parti',
  partyColor: '#185fa5'
};

VG.platform.init = function() {
  try {
    const raw = localStorage.getItem('vg-platform');
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.stances)    VG.platform.state.stances    = saved.stances;
      if (saved.partyName)  VG.platform.state.partyName  = saved.partyName;
      if (saved.partyColor) VG.platform.state.partyColor = saved.partyColor;
    }
  } catch {}
};

VG.platform.save = function() {
  try { localStorage.setItem('vg-platform', JSON.stringify(VG.platform.state)); } catch {}
};

VG.platform.setStance = function(id, stance) {
  VG.platform.state.stances[id] = stance;
  VG.platform.save();
  VG.platform.renderPanel();
};

VG.platform.getScore = function() {
  let e = 0, s = 0, answered = 0;
  for (const pos of VG.platform.POSITIONS) {
    const stance = VG.platform.state.stances[pos.id];
    if (stance === 'ja')  { e += pos.e; s += pos.s; answered++; }
    if (stance === 'nej') { e -= pos.e; s -= pos.s; answered++; }
  }
  // Scale to ±10 range (max raw score ≈ ±45, use ±25 as practical max)
  const scale = 25;
  return {
    e: Math.max(-10, Math.min(10, (e / scale) * 10)),
    s: Math.max(-10, Math.min(10, (s / scale) * 10)),
    answered
  };
};

VG.platform.renderPanel = function() {
  const el = document.getElementById('panel-platform');
  if (!el) return;
  el.innerHTML = VG.platform.buildHTML();
  setTimeout(() => VG.platform.drawCompass('compass-canvas'), 0);
  VG.platform.bindButtons();
};

VG.platform.buildHTML = function() {
  const score = VG.platform.getScore();
  const total = VG.platform.POSITIONS.length;
  const pName = VG.platform.state.partyName;
  const pColor = VG.platform.state.partyColor;

  const eLabel = score.e < -5 ? 'Langt til venstre' : score.e < -2 ? 'Venstreorienteret' : score.e < 2 ? 'Centrum' : score.e < 5 ? 'Højreorienteret' : 'Langt til højre';
  const sLabel = score.s < -5 ? 'Stærkt frihedsorienteret' : score.s < -2 ? 'Frihedsorienteret' : score.s < 2 ? 'Moderat' : score.s < 5 ? 'Traditionelt orienteret' : 'Autoritært orienteret';

  const areas = [...new Set(VG.platform.POSITIONS.map(p => p.area))];

  const positionSections = areas.map(area => {
    const positions = VG.platform.POSITIONS.filter(p => p.area === area);
    const answered  = positions.filter(p => VG.platform.state.stances[p.id]).length;
    const icon = positions[0].icon;

    const rows = positions.map(pos => {
      const stance = VG.platform.state.stances[pos.id] || null;
      return `<div class="platform-pos ${stance ? 'platform-pos--' + stance : ''}">
        <div class="platform-pos-text">
          <div class="platform-pos-title">${pos.title}</div>
          <div class="platform-pos-desc">${pos.desc}</div>
        </div>
        <div class="platform-pos-btns">
          <button class="stance-btn stance-ja ${stance === 'ja' ? 'active' : ''}"
            data-pos="${pos.id}" data-stance="ja">Ja</button>
          <button class="stance-btn stance-nej ${stance === 'nej' ? 'active' : ''}"
            data-pos="${pos.id}" data-stance="nej">Nej</button>
          ${stance ? `<button class="stance-clear" data-pos="${pos.id}" title="Fjern svar">✕</button>` : ''}
        </div>
      </div>`;
    }).join('');

    return `<div class="platform-area">
      <div class="platform-area-header">
        <span class="platform-area-icon">${icon}</span>
        <span class="platform-area-title">${area}</span>
        <span class="platform-area-progress">${answered}/${positions.length}</span>
      </div>
      <div class="platform-positions">${rows}</div>
    </div>`;
  }).join('');

  return `
  <div class="platform-header-card">
    <div class="platform-header-left">
      <div class="platform-party-identity">
        <input class="platform-party-name" id="party-name-input"
          value="${pName}" maxlength="40" placeholder="Dit partis navn"
          style="border-left-color:${pColor}">
        <div class="platform-party-colorpicker">
          <input type="color" id="party-color-input" value="${pColor}" title="Partifarve">
        </div>
      </div>
      <p class="platform-header-sub">Tag stilling til alle positioner og se, hvor dit parti placerer sig på det politiske kompas — sammenlignet med de rigtige partier.</p>
      <div class="platform-progress-row">
        <div class="platform-progress-bar-wrap">
          <div class="platform-progress-bar" style="width:${Math.round(score.answered/total*100)}%"></div>
        </div>
        <span class="platform-progress-label">${score.answered} / ${total} besvaret</span>
      </div>
    </div>
    <div class="platform-header-right">
      <div class="platform-compass-mini">
        <canvas id="compass-canvas" style="width:100%;height:100%"></canvas>
      </div>
      <div class="platform-score-labels">
        <div class="platform-score-label ${score.e < 0 ? 'label-left' : score.e > 0 ? 'label-right' : 'label-center'}">${eLabel}</div>
        <div class="platform-score-label ${score.s < 0 ? 'label-free' : score.s > 0 ? 'label-auth' : 'label-center'}">${sLabel}</div>
      </div>
    </div>
  </div>

  <div class="platform-areas">
    ${positionSections}
  </div>

  <p style="font-size:11px;color:var(--text-3);text-align:center;margin-top:16px;padding-top:12px;border-top:0.5px solid var(--border)">
    Partipositioner er vejledende og illustrative — baseret på publicerede politiske programmer og partikompas-analyser.
    Din profil gemmes lokalt i browseren.
  </p>`;
};

// ── Political compass canvas ──────────────────────────────────────────────────
VG.platform.drawCompass = function(id) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || 280, h = rect.height || 280;
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const pad = 28;
  const cw = w - pad * 2, ch = h - pad * 2;
  const cx = pad + cw / 2, cy = pad + ch / 2;

  // Helper: data coords to canvas
  const toX = v => cx + (v / 10) * (cw / 2);
  const toY = v => cy + (v / 10) * (ch / 2); // s: positive = auth = DOWN

  // Quadrant backgrounds
  const quads = [
    { x: pad,    y: pad,    w: cw/2, h: ch/2, color: isDark ? 'rgba(200,80,80,0.08)' : 'rgba(220,100,100,0.07)' },  // top-left: auth-left
    { x: cx,     y: pad,    w: cw/2, h: ch/2, color: isDark ? 'rgba(80,100,200,0.08)' : 'rgba(100,120,220,0.07)' }, // top-right: auth-right
    { x: pad,    y: cy,     w: cw/2, h: ch/2, color: isDark ? 'rgba(80,180,100,0.08)' : 'rgba(80,180,100,0.07)' },  // bot-left: lib-left
    { x: cx,     y: cy,     w: cw/2, h: ch/2, color: isDark ? 'rgba(230,200,50,0.08)' : 'rgba(230,200,50,0.07)' }   // bot-right: lib-right
  ];
  quads.forEach(q => { ctx.fillStyle = q.color; ctx.fillRect(q.x, q.y, q.w, q.h); });

  // Grid lines
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  ctx.lineWidth = 0.5;
  [-5, 5].forEach(v => {
    ctx.beginPath(); ctx.moveTo(toX(v), pad); ctx.lineTo(toX(v), h - pad); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, toY(v)); ctx.lineTo(w - pad, toY(v)); ctx.stroke();
  });

  // Axes
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, cy); ctx.lineTo(w - pad, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, pad); ctx.lineTo(cx, h - pad); ctx.stroke();

  // Axis labels
  ctx.font = `10px -apple-system, system-ui, sans-serif`;
  ctx.fillStyle = isDark ? 'rgba(180,178,169,0.7)' : 'rgba(95,94,90,0.7)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('Venstre', pad + cw * 0.15, cy + 4);
  ctx.fillText('Højre',   w - pad - cw * 0.15, cy + 4);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('Autoritær', cx + 4, pad + ch * 0.08);
  ctx.fillText('Frihed', cx + 4, h - pad - ch * 0.08);

  // Party dots
  for (const party of VG.platform.PARTIES) {
    const px = toX(party.e), py = toY(party.s);
    ctx.fillStyle = party.color;
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold 8px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(party.abbr, px, py);
  }

  // User party dot
  const score = VG.platform.getScore();
  if (score.answered > 0) {
    const ux = toX(score.e), uy = toY(score.s);
    const pColor = VG.platform.state.partyColor;
    ctx.shadowBlur = 10; ctx.shadowColor = pColor;
    ctx.fillStyle = pColor;
    ctx.beginPath(); ctx.arc(ux, uy, 11, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = `bold 9px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('★', ux, uy);

    // Party name label
    ctx.fillStyle = isDark ? '#f1efe8' : '#2c2c2a';
    ctx.font = `10px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = ux > w / 2 ? 'right' : 'left';
    ctx.fillText(VG.platform.state.partyName, ux + (ux > w/2 ? -14 : 14), uy - 14);
  } else {
    // Placeholder
    ctx.fillStyle = isDark ? 'rgba(180,178,169,0.3)' : 'rgba(95,94,90,0.2)';
    ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = isDark ? 'rgba(180,178,169,0.6)' : 'rgba(95,94,90,0.5)';
    ctx.font = `10px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', cx, cy);
  }
};

VG.platform.bindButtons = function() {
  document.querySelectorAll('.stance-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.pos, stance = btn.dataset.stance;
      const current = VG.platform.state.stances[id];
      VG.platform.setStance(id, current === stance ? null : stance);
    });
  });
  document.querySelectorAll('.stance-clear').forEach(btn => {
    btn.addEventListener('click', () => VG.platform.setStance(btn.dataset.pos, null));
  });
  const nameInput = document.getElementById('party-name-input');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      VG.platform.state.partyName = nameInput.value || 'Mit Parti';
      VG.platform.save();
      VG.platform.drawCompass('compass-canvas');
    });
  }
  const colorInput = document.getElementById('party-color-input');
  if (colorInput) {
    colorInput.addEventListener('input', () => {
      VG.platform.state.partyColor = colorInput.value;
      const nameEl = document.getElementById('party-name-input');
      if (nameEl) nameEl.style.borderLeftColor = colorInput.value;
      VG.platform.save();
      VG.platform.drawCompass('compass-canvas');
    });
  }
};
