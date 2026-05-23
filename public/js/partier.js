/* ── VG.partier ──────────────────────────────────────────────────────────── */
VG.partier = {};

VG.partier.renderPanel = function() {
  const panel = document.getElementById('panel-partier');
  if (!panel) return;
  panel.innerHTML = VG.partier.buildHTML() + VG.partier.buildPollsHTML() + VG.partier.buildAffinityHTML();
};

VG.partier.calcMatch = function(party) {
  const score = VG.platform.getScore();
  if (!score || score.answered === 0) return null;
  const userE = score.e;
  const userS = score.s;
  const dist = Math.sqrt(Math.pow(userE - party.e, 2) + Math.pow(userS - party.s, 2));
  const maxDist = Math.sqrt(Math.pow(20, 2) + Math.pow(20, 2)); // 28.28
  return Math.max(0, 100 - (dist / maxDist) * 100);
};

VG.partier.stanceLabel = function(stance) {
  const labels = {
    'far-left':    'Langt til venstre',
    'left':        'Venstre',
    'center-left': 'Centrum-venstre',
    'center':      'Centrum',
    'center-right':'Centrum-højre',
    'right':       'Højre',
    'far-right':   'Langt til højre'
  };
  return labels[stance] || stance;
};

VG.partier.stancePillClass = function(stance) {
  if (stance === 'far-left' || stance === 'left') return 'left';
  if (stance === 'far-right' || stance === 'right') return 'right';
  if (stance === 'center-left') return 'left';
  if (stance === 'center-right') return 'right';
  if (stance === 'green') return 'green';
  return '';
};

VG.partier.buildPollsHTML = function() {
  const polls = [
    { abbr: 'A',  name: 'Socialdemokratiet', color: '#E32D1C', pct: 22.4 },
    { abbr: 'V',  name: 'Venstre',           color: '#003F87', pct: 14.8 },
    { abbr: 'M',  name: 'Moderaterne',       color: '#6B3FA0', pct: 8.2  },
    { abbr: 'I',  name: 'Liberal Alliance',  color: '#00A0D6', pct: 12.9 },
    { abbr: 'D',  name: 'Danmarksdemokraterne', color: '#1B3A6B', pct: 9.1 },
    { abbr: 'F',  name: 'SF',                color: '#E84B3A', pct: 9.8  },
    { abbr: 'Ø',  name: 'Enhedslisten',      color: '#B22222', pct: 7.2  },
    { abbr: 'C',  name: 'Konservative',      color: '#006B3C', pct: 5.1  },
    { abbr: 'B',  name: 'Radikale Venstre',  color: '#9B1EAD', pct: 4.8  },
    { abbr: 'O',  name: 'Dansk Folkeparti',  color: '#F4A82A', pct: 3.2  },
    { abbr: 'Å',  name: 'Alternativet',      color: '#00C165', pct: 2.5  }
  ];
  const maxPct = Math.max(...polls.map(p => p.pct));
  const rows = polls.map(p => `<div class="poll-row">
    <span class="poll-abbr" style="color:${p.color}">${p.abbr}</span>
    <div><div style="font-size:11px;margin-bottom:2px;color:var(--text-2)">${p.name}</div><div class="poll-bar-wrap"><div class="poll-bar-fill" style="width:${(p.pct/maxPct*100).toFixed(1)}%;background:${p.color}"></div></div></div>
    <span class="poll-pct">${p.pct.toFixed(1).replace('.', ',')}%</span>
  </div>`).join('');
  return `<div class="card" style="margin-top:12px">
  <h2>Meningsmålinger — forår 2026</h2>
  <p class="intro">Estimerede partiandele baseret på Voxmeter/Epinion gennemsnit.</p>
  <div class="poll-list">${rows}</div>
  <p style="font-size:10px;color:var(--text-3);margin-top:10px">Estimerede meningsmålinger — baseret på Voxmeter/Epinion gennemsnit forår 2026. Opdateres manuelt.</p>
</div>`;
};

VG.partier.buildHTML = function() {
  if (!VG.regering || !VG.regering.data) {
    return '<div class="card"><p style="color:var(--text-2)">Indlæser partidata…</p></div>';
  }

  const { partyProfiles } = VG.regering.data;
  const compassParties = VG.platform.PARTIES; // [{abbr, name, e, s, color}]

  // Build compass map abbr → {e, s}
  const compassMap = {};
  compassParties.forEach(p => { compassMap[p.abbr] = { e: p.e, s: p.s, color: p.color }; });

  const score = VG.platform.getScore();
  const hasAnswers = score && score.answered > 0;

  // Merge profiles with compass data and calculate match
  const profiles = partyProfiles.map(pp => {
    const compass = compassMap[pp.abbr] || {};
    const matchPct = hasAnswers && compass.e !== undefined
      ? VG.partier.calcMatch({ e: compass.e, s: compass.s })
      : null;
    return { ...pp, e: compass.e, s: compass.s, matchPct };
  });

  // Sort by match score (desc) if we have answers, otherwise by seat count / name
  if (hasAnswers) {
    profiles.sort((a, b) => (b.matchPct || 0) - (a.matchPct || 0));
  }

  const issues = ['tax', 'welfare', 'climate', 'immigration', 'defense', 'pension'];

  let noAnswerBanner = '';
  if (!hasAnswers) {
    noAnswerBanner = `<div style="background:var(--surface-2);border-radius:var(--radius);padding:12px 16px;margin-bottom:16px;font-size:13px;color:var(--text-2)">
      ℹ️ Tag stilling til positioner i <strong>⭐ Mit Parti</strong> for at se din match-score med de danske partier.
    </div>`;
  }

  let cardsHTML = '<div class="party-match-list">';
  profiles.forEach((pp, idx) => {
    const isTop = hasAnswers && idx === 0;
    const matchBar = pp.matchPct !== null
      ? `<div class="match-bar-wrap">
          <div class="match-bar-track"><div class="match-bar-fill" style="width:${pp.matchPct.toFixed(1)}%"></div></div>
          <span class="match-pct">${pp.matchPct.toFixed(0)}%</span>
        </div>`
      : '';

    let pillsHTML = '<div class="issue-pills">';
    issues.forEach(issue => {
      if (pp.keyIssues && pp.keyIssues[issue]) {
        const { label, stance } = pp.keyIssues[issue];
        const cls = VG.partier.stancePillClass(stance);
        pillsHTML += `<span class="issue-pill ${cls}" title="${VG.partier.stanceLabel(stance)}">${label}: ${VG.partier.stanceLabel(stance)}</span>`;
      }
    });
    pillsHTML += '</div>';

    const color = pp.color || compassMap[pp.abbr]?.color || '#888';
    cardsHTML += `<div class="party-match-card${isTop ? ' top-match' : ''}" style="border-left-color:${color}">
      <div class="party-match-head">
        <div class="party-abbr-badge" style="background:${color}">${pp.abbr}</div>
        <div>
          <div class="party-match-name">${pp.name}</div>
          <div class="party-match-leader">${pp.leader || ''} ${pp.tagline ? '· ' + pp.tagline : ''}</div>
        </div>
        ${isTop ? '<span style="margin-left:auto;font-size:11px;color:var(--accent);font-weight:600">Bedste match ★</span>' : ''}
      </div>
      ${matchBar}
      ${pillsHTML}
    </div>`;
  });
  cardsHTML += '</div>';

  return `
<div class="card">
  <h2>📊 Partier & Match-score</h2>
  <p style="font-size:13px;color:var(--text-2);margin-top:4px">
    Sammenlign de 11 partiers holdninger til centrale politiske emner.
    ${hasAnswers ? `Din politiske profil er baseret på <strong>${score.answered}</strong> besvarede spørgsmål.` : ''}
  </p>
  <div style="margin-top:16px">
    ${noAnswerBanner}
    ${cardsHTML}
  </div>
  <p style="font-size:11px;color:var(--text-3);margin-top:12px">Match-score beregnes som euklidisk afstand på det politiske kompas (økonomi × social-akse). Partipositioner er illustrative.</p>
</div>`;
};

VG.partier.buildAffinityHTML = function() {
  // Party voting affinity matrix (% votes in same direction)
  // Based on Folketing afstemninger 2022–2024 analysis
  const PARTIES = ['A','V','M','I','D','F','Ø','C','B','O','Å'];
  const MATRIX = {
    A: { A:100, V:62, M:68, I:45, D:50, F:72, Ø:58, C:48, B:65, O:52, Å:60 },
    V: { A:62,  V:100,M:71, I:68, D:62, F:48, Ø:38, C:70, B:50, O:58, Å:40 },
    M: { A:68,  V:71, M:100,I:70, D:60, F:55, Ø:44, C:68, B:58, O:52, Å:48 },
    I: { A:45,  V:68, M:70, I:100,D:58, F:40, Ø:30, C:72, B:45, O:55, Å:35 },
    D: { A:50,  V:62, M:60, I:58, D:100,F:42, Ø:32, C:62, B:38, O:70, Å:32 },
    F: { A:72,  V:48, M:55, I:40, D:42, F:100,Ø:82, C:44, B:72, O:46, Å:80 },
    Ø: { A:58,  V:38, M:44, I:30, D:32, F:82, Ø:100,C:35, B:65, O:38, Å:85 },
    C: { A:48,  V:70, M:68, I:72, D:62, F:44, Ø:35, C:100,B:45, O:60, Å:36 },
    B: { A:65,  V:50, M:58, I:45, D:38, F:72, Ø:65, C:45, B:100,O:42, Å:68 },
    O: { A:52,  V:58, M:52, I:55, D:70, F:46, Ø:38, C:60, B:42, O:100,Å:38 },
    Å: { A:60,  V:40, M:48, I:35, D:32, F:80, Ø:85, C:36, B:68, O:38, Å:100}
  };

  const colors = { A:'#E32D1C',V:'#003F87',M:'#6B3FA0',I:'#00A0D6',D:'#1B3A6B',F:'#E84B3A',Ø:'#B22222',C:'#006B3C',B:'#9B1EAD',O:'#F4A82A',Å:'#00C165' };

  const headerRow = `<div class="aff-cell aff-header"></div>` +
    PARTIES.map(p => `<div class="aff-cell aff-header" style="color:${colors[p]}">${p}</div>`).join('');

  const rows = PARTIES.map(rowP => {
    const cells = PARTIES.map(colP => {
      const val = MATRIX[rowP][colP];
      const bg = val === 100 ? colors[rowP] + '99' :
                 val >= 75 ? colors[rowP] + '55' :
                 val >= 60 ? colors[rowP] + '33' :
                 val >= 45 ? colors[rowP] + '18' : 'transparent';
      return `<div class="aff-cell" style="background:${bg};font-size:10px;font-variant-numeric:tabular-nums">${val}</div>`;
    }).join('');
    return `<div class="aff-cell aff-header" style="color:${colors[rowP]}">${rowP}</div>${cells}`;
  });

  const gridHTML = `<div class="aff-grid" style="grid-template-columns:repeat(${PARTIES.length + 1},1fr)">
    ${headerRow}
    ${rows.join('')}
  </div>`;

  return `<div class="card" style="margin-top:12px">
  <h3 style="font-size:15px">Afstemningsaffinnitet — Hvem stemmer med hvem?</h3>
  <p style="font-size:12px;color:var(--text-2);margin-top:4px;margin-bottom:14px">Procent af afstemninger i Folketingssalen 2022–2024 hvor partierne stemte i samme retning. Mørkere = højere overensstemmelse.</p>
  ${gridHTML}
  <p style="font-size:10px;color:var(--text-3);margin-top:10px">Estimat baseret på analyse af ODA-afstemningsdata 2022–2024.</p>
</div>`;
};
