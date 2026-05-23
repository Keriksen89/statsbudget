VG.onboarding = {};

VG.onboarding.show = function() {
  const el = document.getElementById('onboarding-overlay');
  if (el) el.classList.add('show');
};

VG.onboarding.hide = function(destGroup) {
  const el = document.getElementById('onboarding-overlay');
  if (el) el.classList.remove('show');
  try { localStorage.setItem('vg-seen', '1'); } catch {}
  if (destGroup && window.__switchGroup) window.__switchGroup(destGroup);
};

VG.onboarding.init = function() {
  let seen = false;
  try { seen = !!localStorage.getItem('vg-seen'); } catch {}
  if (!seen) {
    setTimeout(() => VG.onboarding.show(), 400);
  }
  document.getElementById('onboarding-overlay').addEventListener('click', e => {
    if (e.target.id === 'onboarding-overlay') VG.onboarding.hide();
  });
};
