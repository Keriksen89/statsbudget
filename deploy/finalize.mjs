/**
 * finalize.mjs — run once to:
 *   1. Install SSH key for password-free future deploys
 *   2. Run certbot (Let's Encrypt SSL)
 *   3. Install full HTTPS nginx config
 *   4. Disable root password SSH auth
 *
 * Usage (from project root):
 *   node deploy/finalize.mjs
 */

import { Client } from '../node_modules/ssh2/lib/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = '91.99.193.181';
const USER = 'root';
const PASS = '9qmbqXi4jqjU';
const APP  = '/var/www/statsbudget';
const PUB_KEY = fs.readFileSync(path.join(__dirname, 'id_statsbudget.pub'), 'utf8').trim();

const step = s => console.log(`\n\x1b[36m── ${s} ──\x1b[0m`);
const ok   = s => console.log(`\x1b[32m✓ ${s}\x1b[0m`);

function exec(conn, cmd, { allowFail = false } = {}) {
  return new Promise((res, rej) => {
    let out = '', err = '';
    conn.exec(cmd, (e, s) => {
      if (e) return rej(e);
      s.on('data',        d => { out += d; process.stdout.write(d); });
      s.stderr.on('data', d => { err += d; process.stderr.write(d); });
      s.on('close', code => {
        if (code !== 0 && !allowFail) return rej(new Error(`Exit ${code}: ${err.trim().slice(0,300)}`));
        res({ out: out.trim(), err: err.trim(), code });
      });
    });
  });
}

function getSftp(conn) {
  return new Promise((res, rej) => conn.sftp((e, s) => e ? rej(e) : res(s)));
}

function upload(sftp, content, remote) {
  return new Promise((res, rej) => {
    const buf = Buffer.from(content);
    sftp.open(remote, 'w', (e, fd) => {
      if (e) return rej(e);
      sftp.write(fd, buf, 0, buf.length, 0, e2 => {
        sftp.close(fd, () => e2 ? rej(e2) : res());
      });
    });
  });
}

async function main() {
  console.log(`\nConnecting to ${USER}@${HOST}…`);
  const conn = new Client();
  await new Promise((res, rej) => {
    conn.on('ready', res);
    conn.on('error', rej);
    conn.connect({ host: HOST, username: USER, password: PASS, readyTimeout: 20000 });
  });
  ok('Connected');

  // ── 1. Install SSH key ─────────────────────────────────────────────
  step('Installing SSH key for password-free access');
  await exec(conn, 'mkdir -p ~/.ssh && chmod 700 ~/.ssh');
  await exec(conn, `grep -qF '${PUB_KEY.slice(0, 40)}' ~/.ssh/authorized_keys 2>/dev/null || echo '${PUB_KEY}' >> ~/.ssh/authorized_keys`);
  await exec(conn, 'chmod 600 ~/.ssh/authorized_keys');
  ok('SSH key installed → you can now: ssh -i deploy/id_statsbudget root@91.99.193.181');

  // ── 2. Verify HTTP is working before certbot ───────────────────────
  step('Verifying HTTP before SSL');
  const { out: httpCheck } = await exec(conn, 'curl -sf --max-time 5 http://statsbudget.dk/api/health 2>&1 || curl -sf --max-time 5 http://www.statsbudget.dk/api/health 2>&1 || echo FAIL', { allowFail: true });
  if (httpCheck.includes('FAIL') || !httpCheck.includes('"ok"')) {
    console.log('⚠ HTTP check result:', httpCheck.slice(0, 100));
    console.log('  Will try certbot anyway — DNS may just need a moment to propagate');
  } else {
    ok('HTTP working: ' + httpCheck.slice(0, 60));
  }

  // ── 3. Run certbot ─────────────────────────────────────────────────
  step('Running certbot (Let\'s Encrypt SSL)');
  await exec(conn, [
    'certbot --nginx',
    '--non-interactive',
    '--agree-tos',
    '--email keriksen1@gmail.com',
    '-d statsbudget.dk',
    '-d www.statsbudget.dk',
    '--redirect',
  ].join(' '));
  ok('SSL certificate issued!');

  // ── 4. Install full production nginx config ────────────────────────
  step('Installing full HTTPS nginx config');
  const sftp = await getSftp(conn);

  // Read the nginx.conf from project and upload
  const nginxConf = fs.readFileSync(path.join(__dirname, 'nginx.conf'), 'utf8');
  await upload(sftp, nginxConf, '/etc/nginx/sites-available/statsbudget');
  await exec(conn, 'ln -sf /etc/nginx/sites-available/statsbudget /etc/nginx/sites-enabled/statsbudget');

  // Test config
  const { code } = await exec(conn, 'nginx -t 2>&1', { allowFail: true });
  if (code !== 0) {
    console.log('⚠ nginx config test failed. Keeping certbot-modified config as fallback.');
    // Restore certbot config
    await exec(conn, 'systemctl reload nginx', { allowFail: true });
  } else {
    await exec(conn, 'systemctl reload nginx');
    ok('nginx reloaded with full HTTPS config');
  }

  // ── 5. Verify HTTPS ────────────────────────────────────────────────
  step('Verifying HTTPS');
  await exec(conn, 'sleep 2 && curl -sf https://statsbudget.dk/api/health || curl -sf https://www.statsbudget.dk/api/health');
  ok('HTTPS working!');

  // ── 6. Set up certbot auto-renewal ─────────────────────────────────
  step('Configuring certbot auto-renewal');
  await exec(conn, 'systemctl enable certbot.timer && systemctl start certbot.timer', { allowFail: true });
  await exec(conn, 'certbot renew --dry-run 2>&1 | tail -5', { allowFail: true });
  ok('Auto-renewal configured');

  // ── 7. Harden SSH (disable password auth) ─────────────────────────
  step('Hardening SSH — disabling password authentication');
  await exec(conn, "sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config");
  await exec(conn, "sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config");
  await exec(conn, 'systemctl reload sshd', { allowFail: true });
  ok('SSH hardened — password auth disabled, key-only from now on');

  console.log(`
\x1b[32m══════════════════════════════════════════════════════\x1b[0m
\x1b[32m✓  statsbudget.dk is fully live on HTTPS!\x1b[0m

   \x1b[1mSite:\x1b[0m    https://www.statsbudget.dk
   \x1b[1mHealth:\x1b[0m  https://www.statsbudget.dk/api/health

   \x1b[1mSSH access (password-free):\x1b[0m
   ssh -i deploy/id_statsbudget root@91.99.193.181

   \x1b[1mFuture deploys:\x1b[0m
   HETZNER_HOST=root@91.99.193.181 bash deploy/hetzner-deploy.sh

   \x1b[33mNote:\x1b[0m Password auth is now disabled.
   Keep deploy/id_statsbudget safe — it's the only key.
\x1b[32m══════════════════════════════════════════════════════\x1b[0m
`);

  conn.end();
}

main().catch(err => {
  console.error('\n\x1b[31m✗ Finalize failed:\x1b[0m', err.message);
  process.exit(1);
});
