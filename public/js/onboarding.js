VG.onboarding = {};

VG.onboarding._navigate = function(group, tab) {
  const el = document.getElementById('onboarding-overlay');
  if (el) el.classList.remove('show');
  try { localStorage.setItem('vg-seen', '1'); } catch {}
  if (window.__switchGroup) window.__switchGroup(group || 'samfund');
  if (tab) setTimeout(() => {
    const btn = document.querySelector(`.sub-tab[data-tab="${tab}"]`);
    if (btn) btn.click();
  }, 30);
};

// Kept for backwards compat (called from index.html spring-over button)
VG.onboarding.hide = function(destGroup) {
  VG.onboarding._navigate(destGroup || 'samfund');
};

VG.onboarding._render = function(newsItems) {
  const card = document.querySelector('.onboarding-card');
  if (!card) return;

  const hasNews = newsItems && newsItems.length > 0;

  const newsHtml = hasNews ? `
    <div class="ob-section-lbl">📡 Hvad snakker Danmark om lige nu?</div>
    <div class="ob-news-list" id="ob-news-list">
      ${newsItems.map(n => `
        <button class="ob-news-item" data-group="${n.group}" data-tab="${n.panel}">
          <div class="ob-news-meta">
            <span class="ob-news-src ob-src-${n.source.toLowerCase()}">${n.source}</span>
            <span class="ob-news-age">${n.age}</span>
          </div>
          <div class="ob-news-headline">"${n.headline}"</div>
          <div class="ob-news-cta">Se data: ${n.topicLabel} →</div>
        </button>`).join('')}
    </div>
    <div class="ob-divider"><span>eller vælg et tema</span></div>` : '';

  card.innerHTML = `
    <button class="onboarding-skip" id="ob-skip">Spring over ×</button>
    <div class="onboarding-logo">🇩🇰</div>
    <h2>Oculus Omnividens</h2>
    <p class="onboarding-sub">Danmarks politiske datapanel — live statistik, finanslov, meningsmålinger og samfundsdata.</p>
    ${newsHtml}
    <div class="ob-section-lbl"${hasNews ? '' : ' style="margin-top:0"'}>Vælg et tema at starte med</div>
    <div class="onboarding-choices">
      <button class="ob-choice" data-group="personligt">
        <div class="ob-choice-icon">👤</div>
        <div class="ob-choice-text">
          <strong>Personligt</strong>
          <span>Skatteberegner, bolig, pension og el-priser</span>
        </div>
      </button>
      <button class="ob-choice" data-group="samfund">
        <div class="ob-choice-icon">🌍</div>
        <div class="ob-choice-text">
          <strong>Samfund</strong>
          <span>Oversigt, demografi, sundhed, ledighed og energi</span>
        </div>
      </button>
      <button class="ob-choice" data-group="politik">
        <div class="ob-choice-icon">🏛</div>
        <div class="ob-choice-text">
          <strong>Politik</strong>
          <span>Partier, meningsmålinger, Folketing og mandater</span>
        </div>
      </button>
      <button class="ob-choice" data-group="oekonomi">
        <div class="ob-choice-icon">💰</div>
        <div class="ob-choice-text">
          <strong>Økonomi</strong>
          <span>Statsbudget, udgifter, indtægter og fremskrivninger</span>
        </div>
      </button>
    </div>`;

  // Single delegated listener — replaces on each render so no duplicates
  card.onclick = function(ev) {
    const skip = ev.target.closest('#ob-skip');
    if (skip) { VG.onboarding._navigate('samfund'); return; }
    const news = ev.target.closest('.ob-news-item');
    if (news) { VG.onboarding._navigate(news.dataset.group, news.dataset.tab); return; }
    const choice = ev.target.closest('.ob-choice');
    if (choice) { VG.onboarding._navigate(choice.dataset.group); return; }
  };
};

VG.onboarding.show = function() {
  const el = document.getElementById('onboarding-overlay');
  if (!el) return;
  el.classList.add('show');

  // Show skeleton news slots while fetching
  const list = document.getElementById('ob-news-list');
  if (list) {
    list.innerHTML = `
      <div class="ob-news-skeleton"></div>
      <div class="ob-news-skeleton"></div>
      <div class="ob-news-skeleton"></div>`;
  }

  fetch('/api/news')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => {
      if (el.classList.contains('show') && d.items && d.items.length) {
        VG.onboarding._render(d.items);
      }
    })
    .catch(() => {
      // News failed — card already shows static choices, nothing to do
    });
};

VG.onboarding.init = function() {
  // Build the static card immediately (no news yet)
  VG.onboarding._render([]);

  const overlay = document.getElementById('onboarding-overlay');
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) VG.onboarding._navigate('samfund');
    });
  }

  let seen = false;
  try { seen = !!localStorage.getItem('vg-seen'); } catch {}
  if (!seen) setTimeout(() => VG.onboarding.show(), 500);
};
