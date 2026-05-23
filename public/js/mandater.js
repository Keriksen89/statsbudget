/* ── VG.mandater — Mandatberegner med d'Hondt ──────────── */
VG.mandater = {};

VG.mandater.PARTIES = [
  { abbr: 'A',  name: 'Socialdemokratiet',   color: '#E32D1C', poll: 27.5 },
  { abbr: 'V',  name: 'Venstre',             color: '#003F87', poll: 18.0 },
  { abbr: 'M',  name: 'Moderaterne',         color: '#6B3FA0', poll:  9.5 },
  { abbr: 'I',  name: 'Liberal Alliance',    color: '#00A0D6', poll: 14.5 },
  { abbr: 'D',  name: 'Danmarksdemokraterne',color: '#1B3A6B', poll:  6.5 },
  { abbr: 'F',  name: 'SF',                  color: '#E84B3A', poll:  8.5 },
  { abbr: 'Ø',  name: 'Enhedslisten',        color: '#B22222', poll:  7.5 },
  { abbr: 'C',  name: 'Konservative',        color: '#006B3C', poll:  5.5 },
  { abbr: 'B',  name: 'Radikale Venstre',    color: '#9B1EAD', poll:  4.5 },
  { abbr: 'O',  name: 'Dansk Folkeparti',    color: '#F4A82A', poll:  4.0 },
  { abbr: 'Å',  name: 'Alternativet',        color: '#00C165', poll:  4.5 }
];

VG.mandater.state = {
  polls: {},   // abbr → pct (user-editable)
  coalition: new Set()
};

// Initialise polls from PARTIES defaults
VG.mandater.PARTIES.forEach(p => { VG.mandater.state.polls[p.abbr] = p.poll; });

VG.mandater.dhondt = function(pollMap, totalSeats, threshold) {
  const eligible = VG.mandater.PARTIES.filter(p => (pollMap[p.abbr] || 0) >= threshold);
  const seats = {};
  eligible.forEach(p => { seats[p.abbr] = 0; });
  for (let i = 0; i < totalSeats; i++) {
    let winner = null, maxQ = -1;
    eligible.forEach(p => {
      const q = (pollMap[p.abbr] || 0) / (seats[p.abbr] + 1);
      if (q > maxQ) { maxQ = q; winner = p.abbr; }
    });
    if (winner) seats[winner]++;
  }
  return seats;
};

VG.mandater.renderPanel = function() {
  const el = document.getElementById('panel-mandater');
  if (!el) return;
  el.innerHTML = VG.mandater.buildHTML();
  requestAnimationFrame(() => VG.mandater.drawHemicycle('mandater-canvas'));
  VG.mandater.bindEvents();
};

VG.mandater.buildHTML = function() {
  const seats = VG.mandater.dhondt(VG.mandater.state.polls, 175, 2.0);
  // Add Greenland/Faroe (always 4 seats, not in d'Hondt)
  const allSeats = { ...seats, GL: 4 };
  const total = Object.values(allSeats).reduce((a, b) => a + b, 0);
  const majority = 90;

  // Coalition total
  const coalSeats = [...VG.mandater.state.coalition].reduce((s, abbr) => s + (allSeats[abbr] || 0), 0);
  const hasMaj = coalSeats >= majority;

  // Sliders
  let sliderHTML = '';
  VG.mandater.PARTIES.forEach(p => {
    const pct = VG.mandater.state.polls[p.abbr] || 0;
    const s = allSeats[p.abbr] || 0;
    sliderHTML += `<div class="mandater-row">
      <div class="mandater-party-dot" style="background:${p.color}"></div>
      <div class="mandater-party-abbr">${p.abbr}</div>
      <input type="range" min="0" max="35" step="0.5" value="${pct}" data-mandater="${p.abbr}" style="flex:1">
      <div class="mandater-pct" id="m-pct-${p.abbr}">${pct.toFixed(1)}%</div>
      <div class="mandater-seats" id="m-seat-${p.abbr}" style="color:${p.color};font-weight:700">${s}</div>
    </div>`;
  });

  // Coalition builder chips
  let chipHTML = VG.mandater.PARTIES.map(p => {
    const s = allSeats[p.abbr] || 0;
    const inCoal = VG.mandater.state.coalition.has(p.abbr);
    return `<button class="coal-chip${inCoal ? ' active' : ''}" data-coal="${p.abbr}" style="${inCoal ? `background:${p.color};color:#fff;border-color:${p.color}` : `border-color:${p.color}`}">${p.abbr} <span>${s}</span></button>`;
  }).join('');

  const majLabel = hasMaj
    ? `<span style="color:var(--neg)">✓ Flertal (${coalSeats}/${total})</span>`
    : coalSeats > 0
      ? `<span style="color:var(--pos)">✗ Mindretalsr. (${coalSeats}/${total} — mangler ${majority - coalSeats})</span>`
      : `<span style="color:var(--text-3)">Vælg partier nedenfor</span>`;

  return `<div class="card">
  <h2>🧮 Mandatberegner</h2>
  <p style="font-size:13px;color:var(--text-2);margin-top:4px">Justér meningsmålinger — mandater beregnes med d'Hondt-metoden (2% spærregrænse, 175 kredsmandater + 4 tillægsmandater fra Grønland/Færøerne).</p>

  <div style="margin-top:18px">
    <div class="hemicycle-wrap" style="margin-bottom:16px">
      <canvas id="mandater-canvas" width="520" height="260" style="max-width:100%"></canvas>
    </div>
    <div class="mandater-sliders">${sliderHTML}</div>
  </div>

  <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--border)">
    <h3 style="font-size:15px;margin-bottom:6px">🤝 Koalitionsbygger</h3>
    <p style="font-size:12px;color:var(--text-2);margin-bottom:12px">Klik på partierne for at bygge en koalition. Grænse: 90 mandater.</p>
    <div class="coal-chips">${chipHTML}</div>
    <div class="coal-result" style="margin-top:12px;font-size:14px;font-weight:600">${majLabel}</div>
    ${hasMaj && coalSeats > 0 ? `<div class="coal-bar" style="margin-top:10px">${[...VG.mandater.state.coalition].map(abbr => {
      const p = VG.mandater.PARTIES.find(x => x.abbr === abbr);
      const s = allSeats[abbr] || 0;
      return p ? `<div class="coal-bar-seg" title="${p.name}: ${s}" style="width:${(s/total*100).toFixed(1)}%;background:${p.color}"></div>` : '';
    }).join('')}</div>` : ''}
  </div>
</div>`;
};

VG.mandater.drawHemicycle = function(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const seats = VG.mandater.dhondt(VG.mandater.state.polls, 175, 2.0);
  seats.GL = 4;

  // Sort by left-right (use VG.platform.PARTIES e-axis if available)
  const compassMap = {};
  if (VG.platform && VG.platform.PARTIES) VG.platform.PARTIES.forEach(p => { compassMap[p.abbr] = p.e; });
  const parties = VG.mandater.PARTIES.slice().sort((a, b) => ((compassMap[a.abbr]||0) - (compassMap[b.abbr]||0)));
  parties.push({ abbr: 'GL', name: 'Grønland & Færøerne', color: '#888888' });

  const totalSeats = Object.values(seats).reduce((a, b) => a + b, 0);
  const cx = W / 2, cy = H - 10;
  const dotR = 5, rows = 5, innerR = 55, rowGap = 18;

  const rowSpots = [];
  let totalSpots = 0;
  for (let r = 0; r < rows; r++) {
    const radius = innerR + r * rowGap;
    const spots = Math.floor(Math.PI * radius / (dotR * 2 + 3));
    rowSpots.push(spots);
    totalSpots += spots;
  }
  const rowCounts = rowSpots.map(s => Math.round(s / totalSpots * totalSeats));
  const diff = totalSeats - rowCounts.reduce((a, b) => a + b, 0);
  rowCounts[rows - 1] += diff;

  const positions = [];
  for (let r = 0; r < rows; r++) {
    const radius = innerR + r * rowGap;
    const count = rowCounts[r];
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (i / (count - 1 || 1)) * Math.PI;
      positions.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
    }
  }

  const seatColors = [];
  parties.forEach(p => {
    const n = seats[p.abbr] || 0;
    for (let i = 0; i < n; i++) seatColors.push({ color: p.color, inCoal: VG.mandater.state.coalition.has(p.abbr) });
  });

  positions.forEach((pos, i) => {
    const info = seatColors[i] || { color: '#ccc', inCoal: false };
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, dotR, 0, Math.PI * 2);
    ctx.fillStyle = info.inCoal ? info.color : info.color + '99';
    ctx.fill();
    if (info.inCoal) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, dotR + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = info.color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });

  // Majority line
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - (innerR + rows * rowGap + 10));
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.restore();
};

VG.mandater.bindEvents = function() {
  document.querySelectorAll('input[data-mandater]').forEach(inp => {
    if (inp._vgBound) return;
    inp._vgBound = true;
    inp.addEventListener('input', e => {
      const abbr = e.target.dataset.mandater;
      const val = parseFloat(e.target.value);
      VG.mandater.state.polls[abbr] = val;
      // Update displays without full rebuild
      const seats = VG.mandater.dhondt(VG.mandater.state.polls, 175, 2.0);
      seats.GL = 4;
      const pctEl = document.getElementById('m-pct-' + abbr);
      const seatEl = document.getElementById('m-seat-' + abbr);
      if (pctEl) pctEl.textContent = val.toFixed(1) + '%';
      if (seatEl) seatEl.textContent = seats[abbr] || 0;
      // Update coalition result
      const coalSeats = [...VG.mandater.state.coalition].reduce((s, a) => s + (seats[a] || 0), 0);
      const total = Object.values(seats).reduce((a, b) => a + b, 0);
      const hasMaj = coalSeats >= 90;
      const resEl = document.querySelector('.coal-result');
      if (resEl) resEl.innerHTML = hasMaj
        ? `<span style="color:var(--neg)">✓ Flertal (${coalSeats}/${total})</span>`
        : coalSeats > 0
          ? `<span style="color:var(--pos)">✗ Mindretalsr. (${coalSeats}/${total} — mangler ${90 - coalSeats})</span>`
          : `<span style="color:var(--text-3)">Vælg partier nedenfor</span>`;
      requestAnimationFrame(() => VG.mandater.drawHemicycle('mandater-canvas'));
    });
  });

  document.querySelectorAll('button[data-coal]').forEach(btn => {
    if (btn._vgBound) return;
    btn._vgBound = true;
    btn.addEventListener('click', () => {
      const abbr = btn.dataset.coal;
      if (VG.mandater.state.coalition.has(abbr)) {
        VG.mandater.state.coalition.delete(abbr);
      } else {
        VG.mandater.state.coalition.add(abbr);
      }
      VG.mandater.renderPanel();
    });
  });
};
