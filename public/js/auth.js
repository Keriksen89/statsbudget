/* Auth module — login, register, saved solutions, social sharing */
VG.auth = (function () {

  let currentUser = null;

  function getToken() {
    try { return localStorage.getItem('sb-token'); } catch { return null; }
  }
  function setToken(t) {
    try { localStorage.setItem('sb-token', t); } catch {}
  }
  function clearToken() {
    try { localStorage.removeItem('sb-token'); } catch {}
  }

  async function init() {
    const token = getToken();
    if (!token) { updateUI(null); return; }
    try {
      const data = await VG.api.fetchJSON('/api/auth/me', {
        headers: { Authorization: 'Bearer ' + token }
      });
      currentUser = data.user;
      updateUI(currentUser);
    } catch {
      clearToken();
      currentUser = null;
      updateUI(null);
    }
  }

  function updateUI(user) {
    const btn = document.getElementById('btn-auth');
    const saveBtn = document.getElementById('btn-save');
    if (!btn) return;

    if (user) {
      const initial = (user.name || 'U')[0].toUpperCase();
      btn.innerHTML = `<span class="topbar-avatar">${initial}</span>&nbsp;${user.name.split(' ')[0]}`;
      btn.title = 'Min profil';
      if (saveBtn) saveBtn.style.display = '';
    } else {
      btn.innerHTML = `<i class="ph ph-user-circle"></i>&nbsp;Log ind`;
      btn.title = 'Log ind / Opret konto';
      if (saveBtn) saveBtn.style.display = 'none';
    }
    renderProfilePanel();
  }

  function renderProfilePanel() {
    const panel = document.getElementById('panel-profile');
    if (!panel) return;
    if (!currentUser) {
      panel.innerHTML = `
        <div class="panel-header">
          <div class="panel-header-left">
            <div class="panel-title">Min løsning</div>
            <div class="panel-subtitle">Gem og del dine budgetløsninger</div>
          </div>
        </div>
        <div class="auth-wall">
          <i class="ph ph-lock-simple auth-wall-icon"></i>
          <h2>Log ind for at gemme</h2>
          <p>Opret en gratis konto for at gemme dine budgetløsninger og dele dem med andre.</p>
          <button class="btn primary btn-lg" id="btn-profile-auth">Opret konto / Log ind</button>
        </div>`;
      document.getElementById('btn-profile-auth')?.addEventListener('click', showAuthModal);
      return;
    }

    panel.innerHTML = `
      <div class="panel-header">
        <div class="panel-header-left">
          <div class="panel-title">Mine løsninger</div>
          <div class="panel-subtitle">Logget ind som ${currentUser.email}</div>
        </div>
        <div class="panel-actions">
          <button class="btn btn-sm primary" id="btn-save-new">Gem nuværende budget</button>
          <button class="btn btn-sm danger" id="btn-logout">Log ud</button>
        </div>
      </div>
      <div id="solutions-list"><div class="flex-center" style="padding:40px;color:var(--text-3)"><span class="loading-spin"></span></div></div>`;

    document.getElementById('btn-logout')?.addEventListener('click', logout);
    document.getElementById('btn-save-new')?.addEventListener('click', () => showSaveModal());
    loadSolutions();
  }

  async function loadSolutions() {
    const token = getToken();
    if (!token) return;
    try {
      const data = await VG.api.fetchJSON('/api/auth/solutions', { headers: { Authorization: 'Bearer ' + token } });
      renderSolutions(data.solutions);
    } catch {
      const el = document.getElementById('solutions-list');
      if (el) el.innerHTML = '<div class="empty-state"><i class="ph ph-warning"></i><p>Kunne ikke hente løsninger</p></div>';
    }
  }

  function renderSolutions(solutions) {
    const el = document.getElementById('solutions-list');
    if (!el) return;
    if (!solutions.length) {
      el.innerHTML = '<div class="empty-state"><i class="ph ph-folder-open"></i><p>Du har ingen gemte løsninger endnu. Lav ændringer i budgettet og gem dem!</p></div>';
      return;
    }
    el.innerHTML = `<div class="solutions-grid">
      ${solutions.map(s => `
        <div class="solution-card">
          <div class="solution-icon"><i class="ph ph-chart-line-up"></i></div>
          <div class="solution-info">
            <div class="solution-title">${s.title}</div>
            <div class="solution-meta">${s.description || 'Ingen beskrivelse'} · ${new Date(s.created_at).toLocaleDateString('da-DK')}</div>
          </div>
          <div class="solution-actions">
            ${s.is_public && s.share_token ? `<button class="btn btn-sm" onclick="VG.auth.showShareSolution('${s.share_token}','${s.title}')">Del</button>` : ''}
            <button class="btn btn-sm danger" onclick="VG.auth.deleteSolution(${s.id})">Slet</button>
          </div>
        </div>`).join('')}
    </div>`;
  }

  function showSaveModal() {
    const html = `
      <div class="modal-subtitle">Gem dit nuværende statsbudget som en navngivet løsning</div>
      <div class="form-group">
        <label class="form-label">Navn på løsning</label>
        <input type="text" class="form-input" id="save-title" placeholder="Mit budget 2026" maxlength="100">
      </div>
      <div class="form-group">
        <label class="form-label">Beskrivelse (valgfri)</label>
        <input type="text" class="form-input" id="save-desc" placeholder="Fx: Fokus på forsvar og skattelettelse">
      </div>
      <div class="form-group" style="display:flex;align-items:center;gap:8px">
        <input type="checkbox" id="save-public" style="width:16px;height:16px;accent-color:var(--accent)">
        <label for="save-public" style="font-size:13px;color:var(--text-2);cursor:pointer">Gør løsningen offentlig (kan deles med link)</label>
      </div>
      <p id="save-error" style="display:none;color:var(--neg);font-size:12px;margin-top:4px"></p>
      <div class="modal-actions">
        <button class="btn primary" id="btn-do-save">Gem løsning</button>
        <button class="btn" onclick="VG.closeModal()">Annullér</button>
      </div>`;

    VG.showModal('Gem løsning', html);
    document.getElementById('btn-do-save')?.addEventListener('click', async () => {
      const title   = document.getElementById('save-title')?.value.trim();
      const desc    = document.getElementById('save-desc')?.value.trim();
      const pub     = document.getElementById('save-public')?.checked;
      const errEl   = document.getElementById('save-error');
      if (!title) { errEl.textContent = 'Angiv et navn på løsningen'; errEl.style.display = 'block'; return; }

      const state = VG.state?.current || {};
      try {
        const token = getToken();
        const resp = await VG.api.fetchJSON('/api/auth/solutions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ title, description: desc, state, isPublic: pub }),
        });
        VG.closeModal();
        VG.toast('Løsning gemt!');
        if (VG.state?.activeTab === 'profile') loadSolutions();
      } catch (e) {
        errEl.textContent = e.message; errEl.style.display = 'block';
      }
    });
  }

  async function deleteSolution(id) {
    if (!confirm('Er du sikker på at du vil slette denne løsning?')) return;
    try {
      const token = getToken();
      await VG.api.fetchJSON(`/api/auth/solutions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      });
      VG.toast('Løsning slettet');
      loadSolutions();
    } catch (e) { VG.toast('Fejl: ' + e.message); }
  }

  function showShareSolution(token, title) {
    const url = `https://www.statsbudget.dk/?shared=${token}`;
    const text = encodeURIComponent(`Jeg har lavet et statsbudget for Danmark: "${title}"`);
    const urlE = encodeURIComponent(url);
    VG.showModal('Del løsning', `
      <div class="modal-subtitle">Del din løsning via sociale medier eller et direkte link</div>
      <input class="share-input" value="${url}" readonly id="share-sol-url">
      <div class="share-buttons">
        <button class="share-btn linkedin" onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url=${urlE}','_blank')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          LinkedIn
        </button>
        <button class="share-btn facebook" onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${urlE}','_blank')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </button>
        <button class="share-btn" onclick="window.open('https://twitter.com/intent/tweet?text=${text}&url=${urlE}','_blank')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X / Twitter
        </button>
        <button class="share-btn copy" onclick="navigator.clipboard.writeText('${url}').then(()=>VG.toast('Kopieret!'))">
          <i class="ph ph-copy"></i> Kopier link
        </button>
      </div>`);
  }

  function showAuthModal(defaultTab) {
    let activeTab = defaultTab || 'login';

    function renderModal() {
      VG.showModal('Konto', `
        <div class="auth-tabs">
          <button class="auth-tab ${activeTab === 'login' ? 'active' : ''}" data-tab="login">Log ind</button>
          <button class="auth-tab ${activeTab === 'register' ? 'active' : ''}" data-tab="register">Opret konto</button>
        </div>
        ${activeTab === 'login' ? renderLoginForm() : renderRegisterForm()}`);

      document.querySelectorAll('.auth-tab').forEach(t => {
        t.addEventListener('click', () => { activeTab = t.dataset.tab; renderModal(); });
      });
      if (activeTab === 'login')    bindLoginForm();
      else                          bindRegisterForm();
    }

    renderModal();
  }

  function renderLoginForm() {
    return `
      <div class="modal-subtitle">Velkommen tilbage til statsbudget.dk</div>
      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input type="email" class="form-input" id="login-email" placeholder="din@email.dk" autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Adgangskode</label>
        <input type="password" class="form-input" id="login-pass" autocomplete="current-password">
      </div>
      <p id="login-error" style="display:none;color:var(--neg);font-size:12px;margin-bottom:8px"></p>
      <div class="modal-actions">
        <button class="btn primary w-full" id="btn-do-login">Log ind</button>
      </div>`;
  }

  function renderRegisterForm() {
    return `
      <div class="modal-subtitle">Gratis adgang — ingen reklamer, ingen tracking</div>
      <div class="form-group">
        <label class="form-label">Navn</label>
        <input type="text" class="form-input" id="reg-name" placeholder="Dit navn" autocomplete="name">
      </div>
      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input type="email" class="form-input" id="reg-email" placeholder="din@email.dk" autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Adgangskode <span class="form-hint" style="display:inline">(mindst 8 tegn)</span></label>
        <input type="password" class="form-input" id="reg-pass" autocomplete="new-password">
      </div>
      <p id="reg-error" style="display:none;color:var(--neg);font-size:12px;margin-bottom:8px"></p>
      <div class="modal-actions">
        <button class="btn primary w-full" id="btn-do-register">Opret konto</button>
      </div>`;
  }

  function bindLoginForm() {
    document.getElementById('btn-do-login')?.addEventListener('click', async () => {
      const email = document.getElementById('login-email')?.value.trim();
      const pass  = document.getElementById('login-pass')?.value;
      const errEl = document.getElementById('login-error');
      if (!email || !pass) { errEl.textContent = 'Udfyld alle felter'; errEl.style.display = 'block'; return; }
      try {
        const data = await VG.api.fetchJSON('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass }),
        });
        setToken(data.token);
        currentUser = data.user;
        updateUI(currentUser);
        VG.closeModal();
        VG.toast(`Velkommen, ${data.user.name.split(' ')[0]}!`);
      } catch (e) {
        errEl.textContent = e.message.replace(/^API \d+: /, '');
        errEl.style.display = 'block';
      }
    });
    document.getElementById('login-pass')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-do-login')?.click();
    });
  }

  function bindRegisterForm() {
    document.getElementById('btn-do-register')?.addEventListener('click', async () => {
      const name  = document.getElementById('reg-name')?.value.trim();
      const email = document.getElementById('reg-email')?.value.trim();
      const pass  = document.getElementById('reg-pass')?.value;
      const errEl = document.getElementById('reg-error');
      if (!name || !email || !pass) { errEl.textContent = 'Udfyld alle felter'; errEl.style.display = 'block'; return; }
      try {
        const data = await VG.api.fetchJSON('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password: pass }),
        });
        setToken(data.token);
        currentUser = data.user;
        updateUI(currentUser);
        VG.closeModal();
        VG.toast(`Konto oprettet! Velkommen, ${data.user.name.split(' ')[0]}!`);
      } catch (e) {
        errEl.textContent = e.message.replace(/^API \d+: /, '');
        errEl.style.display = 'block';
      }
    });
  }

  function logout() {
    clearToken();
    currentUser = null;
    updateUI(null);
    VG.toast('Du er logget ud');
  }

  return { init, showAuthModal, showSaveModal, showShareSolution, deleteSolution, get user() { return currentUser; } };
})();
