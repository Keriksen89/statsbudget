/* ── VG.regering ─────────────────────────────────────────────────────────── */
VG.regering = {};
VG.regering.data = null;

VG.regering.load = async function() {
  try {
    const data = await VG.api.fetchJSON('/api/government/data');
    VG.regering.data = data;
    return data;
  } catch (e) {
    console.warn('[regering] load failed:', e.message);
    return null;
  }
};

VG.regering.renderPanel = function() {
  const panel = document.getElementById('panel-regering');
  if (!panel) return;
  panel.innerHTML = VG.regering.buildHTML();
  VG.regering.bindInteractive();
  // Draw hemicycle after DOM is ready
  requestAnimationFrame(() => VG.regering.drawHemicycle('hemicycle-canvas'));
};

VG.regering.buildHTML = function() {
  if (!VG.regering.data) {
    return '<div class="card"><p style="color:var(--text-2)">Indlæser regeringsdata…</p></div>';
  }

  const { folketing, government, formation, partyProfiles } = VG.regering.data;
  const { pm, type, formed, ministers, coalitionAgreement } = government;

  // Government formation banner (shown when status === 'active')
  let formationHTML = '';
  if (formation && formation.status === 'active') {
    const chips = (formation.partiesInTalks || []).map(abbr => {
      const p = folketing.parties.find(x => x.abbr === abbr);
      return `<span class="formation-party-chip" style="border-left:3px solid ${p ? p.color : '#888'}">${p ? p.name : abbr}</span>`;
    }).join('');

    const steps = formation.timeline.map(s => `
<div class="formation-step step-${s.status}">
  <div class="formation-step-dot"></div>
  <div class="formation-step-text">
    <div class="formation-step-label">${s.label}</div>
    <div class="formation-step-date">${s.date}</div>
  </div>
</div>`).join('');

    formationHTML = `<div class="formation-banner" style="margin-bottom:16px">
  <h3>Aktuel status</h3>
  <div class="formation-title">${formation.headline}</div>
  <div class="formation-sub">${formation.description}</div>
  <div class="formation-timeline" style="margin-top:14px">${steps}</div>
  <div style="margin-top:12px;font-size:11px;color:var(--text-3);font-weight:600;text-transform:uppercase;letter-spacing:0.4px">Parter i forhandling</div>
  <div class="formation-parties">${chips}</div>
  <div style="margin-top:10px;font-size:10px;color:var(--text-3)">Sidst opdateret: ${formation.lastUpdated} · ${formation.note}</div>
</div>`;
  }

  // Coalition bar segments
  const groupOrder = ['coalition', 'opposition-right', 'opposition-left', 'other'];
  const groupColors = {
    'coalition': null, // use party colors
    'opposition-right': null,
    'opposition-left': null,
    'other': '#888888'
  };

  // Build coalition bar HTML
  const coalitionSeats = folketing.parties.filter(p => p.group === 'coalition').reduce((s, p) => s + p.seats, 0);
  const totalSeats = folketing.totalSeats;

  let coalBarHTML = '<div class="coalition-bar">';
  const allGrouped = [];
  groupOrder.forEach(g => {
    folketing.parties.filter(p => p.group === g).forEach(p => allGrouped.push(p));
  });
  allGrouped.forEach(p => {
    const pct = (p.seats / totalSeats * 100).toFixed(2);
    coalBarHTML += `<div class="coalition-seg" title="${p.name}: ${p.seats} mandater" style="width:${pct}%;background:${p.color}"></div>`;
  });
  coalBarHTML += '</div>';

  // Legend for hemicycle
  const leftParties  = folketing.parties.filter(p => p.group === 'opposition-left');
  const coalParties  = folketing.parties.filter(p => p.group === 'coalition');
  const rightParties = folketing.parties.filter(p => p.group === 'opposition-right');
  const otherParties = folketing.parties.filter(p => p.group === 'other');
  const legendParties = [...leftParties, ...coalParties, ...rightParties, ...otherParties];

  let legendHTML = '<div class="hemicycle-legend">';
  legendParties.forEach(p => {
    legendHTML += `<div class="hemicycle-leg-item">
      <span class="hemicycle-leg-dot" style="background:${p.color}"></span>
      <span>${p.abbr} ${p.seats}</span>
    </div>`;
  });
  legendHTML += '</div>';

  // Ministers grid
  // Build party color lookup
  const partyColorMap = {};
  folketing.parties.forEach(p => { partyColorMap[p.abbr] = p.color; });

  let ministerHTML = '<div class="minister-grid">';
  ministers.forEach(m => {
    const color = partyColorMap[m.party] || '#888';
    ministerHTML += `<div class="minister-card" style="border-left-color:${color}">
      <div class="minister-name">${m.name}</div>
      <div class="minister-title">${m.title}</div>
      <div class="minister-ministry">${m.ministry}</div>
    </div>`;
  });
  ministerHTML += '</div>';

  // Coalition agreement key points
  let agreementHTML = '<div class="agreement-points">';
  coalitionAgreement.keyPoints.forEach(pt => {
    agreementHTML += `<div class="agreement-point">
      <div class="agreement-icon">${pt.icon}</div>
      <div class="agreement-text">
        <strong>${pt.area}</strong>
        <p>${pt.text}</p>
      </div>
    </div>`;
  });
  agreementHTML += '</div>';

  // Majority indicator
  const majority = Math.ceil(totalSeats / 2);
  const hasMajority = coalitionSeats >= majority;
  const majorityLabel = hasMajority
    ? `<span style="color:var(--neg)">&#10003; Flertal (${coalitionSeats}/${totalSeats})</span>`
    : `<span style="color:var(--pos)">&#10007; Mindretalsr. (${coalitionSeats}/${totalSeats} — mangler ${majority - coalitionSeats})</span>`;

  return `
${formationHTML}
${VG.regering.buildCompareHTML()}
<div class="card">
  <h2>🏛 Regering & Folketing</h2>
  <p style="font-size:13px;color:var(--text-2);margin-top:4px">${type} · Dannet ${formed}</p>

  <div style="margin-top:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <div style="display:flex;align-items:center;gap:8px">
      <div style="width:36px;height:36px;border-radius:50%;background:${partyColorMap[pm.party]};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">${pm.party}</div>
      <div>
        <div style="font-weight:600;font-size:15px">${pm.name}</div>
        <div style="font-size:12px;color:var(--text-2)">Statsminister siden ${pm.since}</div>
      </div>
    </div>
    <div style="margin-left:auto;font-size:13px">${majorityLabel}</div>
  </div>

  ${coalBarHTML}
  <p style="font-size:11px;color:var(--text-3);margin-top:4px">${folketing.note}</p>

  <h3 style="margin-top:20px;margin-bottom:8px;font-size:15px">Parlamentets sammensætning</h3>
  <div class="hemicycle-wrap">
    <canvas id="hemicycle-canvas" width="520" height="280" style="max-width:100%"></canvas>
    ${legendHTML}
  </div>

  <h3 style="margin-top:20px;margin-bottom:4px;font-size:15px">Koalitionsaftale — ${coalitionAgreement.title}</h3>
  ${agreementHTML}

  <h3 style="margin-top:20px;margin-bottom:4px;font-size:15px">Ministre (${ministers.length})</h3>
  ${ministerHTML}
</div>`;
};

VG.regering.buildCompareHTML = function() {
  const data = VG.regering.data;
  if (!data || !data.historicalGovernments) return '';

  const govs = data.historicalGovernments;
  const selectedA = govs[govs.length - 2]?.id || govs[0].id;
  const selectedB = govs[govs.length - 1]?.id || govs[0].id;
  const options = govs.map(g => `<option value="${g.id}">${g.label} (${g.years})</option>`).join('');

  return `<div class="gov-lab">
    <div class="gov-lab-head">
      <div>
        <div class="gov-eyebrow">Aabne kilder + MAKRO-kalibrering</div>
        <h2>Regeringstjek</h2>
        <p>Sammenlign tidligere regeringer med officielle kilder. DREAM/MAKRO-effekter vises i nyhedsfeedet, naar en konkret nyhed matcher en politisk modelregel.</p>
      </div>
      <div class="gov-source-pill">Kilder: STM, Regeringen.dk, Folketinget, DST, DREAM</div>
    </div>

    <div class="gov-lab-grid">
      <section class="gov-tool">
        <div class="gov-tool-title">Sammenlign regeringer</div>
        <div class="gov-select-row">
          <label>Venstre kort<select id="gov-compare-a">${options}</select></label>
          <label>Hoejre kort<select id="gov-compare-b">${options}</select></label>
        </div>
        <div id="gov-compare-output" class="gov-compare-output" data-a="${selectedA}" data-b="${selectedB}"></div>
      </section>
    </div>

    <div class="source-grid">
      ${(data.sources || []).map(s => `<a href="${s.url}" target="_blank" rel="noopener" class="source-card">
        <strong>${s.name}</strong><span>${s.note}</span>
      </a>`).join('')}
    </div>
  </div>`;
};

VG.regering.bindInteractive = function() {
  const data = VG.regering.data;
  if (!data) return;

  const compareA = document.getElementById('gov-compare-a');
  const compareB = document.getElementById('gov-compare-b');
  const compareOut = document.getElementById('gov-compare-output');

  const renderCompare = () => {
    if (!compareOut) return;
    const govs = data.historicalGovernments || [];
    const a = govs.find(g => g.id === (compareA?.value || compareOut.dataset.a)) || govs[0];
    const b = govs.find(g => g.id === (compareB?.value || compareOut.dataset.b)) || govs[govs.length - 1];
    if (!a || !b) return;
    compareOut.innerHTML = `
      ${VG.regering.renderGovCard(a)}
      <div class="gov-profile-bars">${VG.regering.renderProfileBars(a, b)}</div>
      ${VG.regering.renderGovCard(b)}
    `;
  };

  if (compareA) compareA.value = compareOut?.dataset.a || compareA.value;
  if (compareB) compareB.value = compareOut?.dataset.b || compareB.value;
  compareA?.addEventListener('change', renderCompare);
  compareB?.addEventListener('change', renderCompare);
  renderCompare();
};

VG.regering.renderGovCard = function(g) {
  return `<article class="gov-card">
    <div class="gov-card-top">
      <strong>${g.label}</strong>
      <span>${g.years}</span>
    </div>
    <div class="gov-card-pm">${g.pm}</div>
    <div class="gov-card-type">${g.type}</div>
    <div class="gov-party-row">${(g.parties || []).map(p => `<span>${p}</span>`).join('')}</div>
    <div class="gov-agreement">${g.agreement}</div>
    <p>${g.promiseStyle}</p>
    <div class="gov-priority-list">${(g.priorities || []).map(p => `<span>${p}</span>`).join('')}</div>
  </article>`;
};

VG.regering.renderProfileBars = function(a, b) {
  const labels = [
    ['tax', 'Skat'],
    ['welfare', 'Velfaerd'],
    ['defence', 'Forsvar'],
    ['climate', 'Klima'],
    ['laborSupply', 'Arbejdsudbud']
  ];
  return labels.map(([key, label]) => {
    const av = a.fiscalProfile?.[key] || 0;
    const bv = b.fiscalProfile?.[key] || 0;
    return `<div class="profile-row">
      <div class="profile-label">${label}</div>
      <div class="profile-track">
        <span class="profile-bar a" style="width:${av}%"></span>
        <span class="profile-bar b" style="width:${bv}%"></span>
      </div>
      <div class="profile-values"><span>${av}</span><span>${bv}</span></div>
    </div>`;
  }).join('');
};

VG.regering.drawHemicycle = function(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !VG.regering.data) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const { folketing } = VG.regering.data;

  // Order parties left-to-right using platform compass positions (e-axis)
  // Map abbr → e value from VG.platform.PARTIES
  const compassMap = {};
  if (VG.platform && VG.platform.PARTIES) {
    VG.platform.PARTIES.forEach(p => { compassMap[p.abbr] = p.e; });
  }
  // Fallback ordering for parties not in compass (GL etc.)
  const defaultE = { 'GL': 99 };

  const parties = folketing.parties.slice().sort((a, b) => {
    const ea = compassMap[a.abbr] !== undefined ? compassMap[a.abbr] : (defaultE[a.abbr] || 0);
    const eb = compassMap[b.abbr] !== undefined ? compassMap[b.abbr] : (defaultE[b.abbr] || 0);
    return ea - eb;
  });

  const totalSeats = folketing.totalSeats;

  // Hemicycle layout: semicircle
  // We draw multiple concentric rows of dots
  const cx = W / 2;
  const cy = H - 20;
  const dotR = 5;
  const rows = 5;
  const innerR = 60;
  const rowGap = 18;

  // Distribute seats into rows (inner rows have fewer spots)
  // Total spots per row ≈ π * r / (2*dotR + 2) seats per unit arc
  const rowSpots = [];
  let totalSpots = 0;
  for (let r = 0; r < rows; r++) {
    const radius = innerR + r * rowGap;
    const circumHalf = Math.PI * radius; // half circle circumference
    const spots = Math.floor(circumHalf / (dotR * 2 + 3));
    rowSpots.push(spots);
    totalSpots += spots;
  }

  // Scale so totalSpots ≈ totalSeats
  // Assign seats to rows proportionally
  const rowCounts = rowSpots.map(s => Math.round(s / totalSpots * totalSeats));
  // Adjust for rounding
  const diff = totalSeats - rowCounts.reduce((a, b) => a + b, 0);
  rowCounts[rows - 1] += diff;

  // Flatten all seat positions row by row
  const positions = [];
  for (let r = 0; r < rows; r++) {
    const radius = innerR + r * rowGap;
    const count = rowCounts[r];
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (i / (count - 1 || 1)) * Math.PI; // π to 2π (left to right)
      positions.push({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      });
    }
  }

  // Assign party colors to positions in order
  const seatColors = [];
  parties.forEach(p => {
    for (let i = 0; i < p.seats; i++) seatColors.push(p.color);
  });

  // Draw dots
  positions.forEach((pos, i) => {
    const color = seatColors[i] || '#ccc';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, dotR, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });

  // Draw majority line
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - (innerR + rows * rowGap + 10));
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.restore();
};
