// ── Reddit r/Denmark hot topics feed ─────────────────────────────────────────
VG.reddit = {};

VG.reddit.load = function() {
  const panel = document.getElementById('panel-reddit');
  if (!panel) return;
  if (panel._loaded) { VG.reddit.renderPanel(panel, panel._posts || []); return; }
  panel.innerHTML = '<div class="feed-page-header"><div><h2 class="feed-page-title">Reddit Danmark</h2><p class="feed-page-sub">Henter hot topics fra r/Denmark…</p></div></div>';

  fetch('https://www.reddit.com/r/denmark/hot.json?limit=25&raw_json=1')
    .then(r => r.json())
    .then(data => {
      const posts = (data.data.children || []).map(c => c.data).filter(p => !p.stickied);
      panel._posts = posts;
      panel._loaded = true;
      VG.reddit.renderPanel(panel, posts);
    })
    .catch(() => {
      panel.innerHTML = '<div class="feed-page-header"><div><h2 class="feed-page-title">Reddit Danmark</h2><p class="feed-page-sub" style="color:var(--pos)">Kunne ikke hente data fra Reddit. Prøv igen senere.</p></div></div>';
    });
};

VG.reddit.renderPanel = function(panel, posts) {
  const itemsHtml = posts.slice(0, 20).map(p => {
    const id = 'reddit-' + p.id;
    const score = p.score || 0;
    const comments = p.num_comments || 0;
    const domain = p.domain || '';
    const flair = p.link_flair_text ? `<span class="feed-tag ft-info">${p.link_flair_text}</span>` : '';
    const voteHtml = VG.votes ? VG.votes.renderBar(id, Math.round(score / 10), Math.max(1, Math.round(score / 40))) : '';
    const url = p.url || '#';
    const isText = p.is_self;
    return `
      <article class="feed-card" data-rid="${p.id}">
        <div class="feed-card-meta">
          <span class="feed-cat-label"><i class="ph ph-reddit-logo"></i> r/Denmark</span>
          ${flair}
          <span class="feed-time">${score.toLocaleString('da-DK')} point · ${comments} kommentarer</span>
        </div>
        <h3 class="feed-card-headline">${p.title}</h3>
        ${p.selftext && p.selftext.length > 10 ? `<p class="feed-card-body">${p.selftext.slice(0, 280).replace(/</g,'&lt;')}${p.selftext.length > 280 ? '…' : ''}</p>` : domain && !isText ? `<p class="feed-card-body" style="color:var(--text-3);font-size:12px">${domain}</p>` : ''}
        <div class="feed-card-footer">
          ${voteHtml}
          <a class="feed-explore" href="https://reddit.com${p.permalink}" target="_blank" rel="noopener">Åbn på Reddit →</a>
        </div>
      </article>`;
  }).join('') || '<p class="feed-empty">Ingen posts fundet.</p>';

  panel.innerHTML = `
    <div class="feed-page-header">
      <div>
        <h2 class="feed-page-title"><i class="ph ph-reddit-logo"></i> Reddit Danmark</h2>
        <p class="feed-page-sub">Hot topics fra r/Denmark — realtime fra Reddit API.</p>
      </div>
      <button class="feed-filter-btn" id="reddit-refresh" style="flex-shrink:0">↺ Opdater</button>
    </div>
    <div class="feed-list">${itemsHtml}</div>`;

  panel.querySelector('#reddit-refresh')?.addEventListener('click', () => {
    panel._loaded = false;
    panel._posts = null;
    VG.reddit.load();
  });
};
