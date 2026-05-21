VG.chart = {};

VG.chart.drawDebt = function() {
  const cvs = document.getElementById('debt-chart');
  if (!cvs) return;

  const dpr = window.devicePixelRatio || 1;
  const W = cvs.offsetWidth, H = 280;
  cvs.width = W * dpr;
  cvs.height = H * dpr;
  cvs.style.height = H + 'px';
  const ctx = cvs.getContext('2d');
  ctx.scale(dpr, dpr);

  const bal = VG.sumRev() - VG.sumExp();
  const BNP = VG.state.baseline.gdp;
  let debt = BNP * VG.state.baseline.debtStartRatio, gdpY = BNP;
  const pts = [{ y: 2026, ratio: debt / gdpY * 100 }];
  for (let y = 2027; y <= 2034; y++) {
    debt -= bal;
    gdpY *= 1.02;
    pts.push({ y, ratio: debt / gdpY * 100 });
  }

  const maxR = Math.max(60, ...pts.map(p => p.ratio));
  const minR = Math.min(-20, ...pts.map(p => p.ratio));
  const padL = 50, padR = 20, padT = 20, padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const css = getComputedStyle(document.documentElement);
  const colorBorder = css.getPropertyValue('--border').trim() || '#ccc';
  const colorText = css.getPropertyValue('--text-2').trim() || '#888';
  const colorLine = '#D85A30';

  ctx.strokeStyle = colorBorder;
  ctx.lineWidth = 0.5;
  ctx.fillStyle = colorText;
  ctx.font = '11px -apple-system, system-ui, sans-serif';

  for (let i = 0; i <= 4; i++) {
    const y = padT + (plotH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
    const r = maxR - (maxR - minR) * (i / 4);
    ctx.textAlign = 'right';
    ctx.fillText(r.toFixed(0) + '%', padL - 8, y + 4);
  }

  if (minR < 0 && maxR > 0) {
    const zeroY = padT + plotH * (maxR / (maxR - minR));
    ctx.strokeStyle = colorText;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padL, zeroY);
    ctx.lineTo(padL + plotW, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.textAlign = 'center';
  pts.forEach((p, i) => {
    if (i % 2 === 0) {
      const x = padL + (plotW / (pts.length - 1)) * i;
      ctx.fillText(p.y, x, H - 14);
    }
  });

  ctx.strokeStyle = colorLine;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const x = padL + (plotW / (pts.length - 1)) * i;
    const y = padT + plotH * ((maxR - p.ratio) / (maxR - minR));
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = colorLine;
  pts.forEach((p, i) => {
    const x = padL + (plotW / (pts.length - 1)) * i;
    const y = padT + plotH * ((maxR - p.ratio) / (maxR - minR));
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
};
