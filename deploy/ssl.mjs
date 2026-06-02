/**
 * ssl.mjs — Run certbot once DNS is working.
 *
 * Usage: node deploy/ssl.mjs
 *
 * Run this after DNS is fixed (when statsbudget.dk resolves in a browser).
 * SSH key auth will be used (no password needed).
 */

import { Client } from '../node_modules/ssh2/lib/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST     = '91.99.193.181';
const KEY_FILE = path.join(__dirname, 'id_statsbudget');

const conn = new Client();
await new Promise((res, rej) => {
  conn.on('ready', res);
  conn.on('error', rej);
  conn.connect({
    host:     HOST,
    username: 'root',
    privateKey: fs.readFileSync(KEY_FILE),
    readyTimeout: 15000,
  });
});
console.log('✓ Connected (key auth)');

function run(cmd, { allowFail = false } = {}) {
  return new Promise((res, rej) => {
    let out = '', err = '';
    conn.exec(cmd, (e, s) => {
      if (e) return rej(e);
      s.on('data', d => { out += d; process.stdout.write(d); });
      s.stderr.on('data', d => { err += d; process.stderr.write(d); });
      s.on('close', code => {
        if (code !== 0 && !allowFail) return rej(new Error(`Exit ${code}: ${err.trim().slice(0,200)}`));
        res(out.trim());
      });
    });
  });
}

function getSftp(conn) {
  return new Promise((res, rej) => conn.sftp((e, s) => e ? rej(e) : res(s)));
}

function uploadFile(sftp, localPath, remote) {
  return new Promise((res, rej) => sftp.fastPut(localPath, remote, {}, e => e ? rej(e) : res()));
}

// 1. Verify DNS resolves
console.log('\n── Checking DNS ──');
const dnsCheck = await run('dig +short statsbudget.dk A || echo FAIL', { allowFail: true });
if (!dnsCheck || dnsCheck === 'FAIL' || dnsCheck.trim() === '') {
  console.error('\n✗ statsbudget.dk still does not resolve. Fix DNS first, then re-run this script.');
  console.error('  Check: https://intodns.com/statsbudget.dk');
  conn.end();
  process.exit(1);
}
console.log('✓ DNS resolves to:', dnsCheck.trim());

// 2. Run certbot
console.log('\n── Running certbot ──');
await run([
  'certbot --nginx',
  '--non-interactive --agree-tos',
  '--email keriksen1@gmail.com',
  '-d statsbudget.dk -d www.statsbudget.dk',
  '--redirect',
].join(' '));
console.log('✓ SSL certificate issued');

// 3. Upload full HTTPS nginx config
console.log('\n── Uploading HTTPS nginx config ──');
const sftp = await getSftp(conn);
await uploadFile(sftp, path.join(__dirname, 'nginx.conf'), '/etc/nginx/sites-available/statsbudget');
const { code } = await run('nginx -t 2>&1 && echo OK || echo FAIL', { allowFail: true }).then(o => ({ code: o.includes('OK') ? 0 : 1 }));
await run('systemctl reload nginx');

// 4. Enable auto-renewal
console.log('\n── Enabling auto-renewal ──');
await run('systemctl enable certbot.timer && systemctl start certbot.timer', { allowFail: true });

// 5. Harden SSH
console.log('\n── Hardening SSH ──');
await run("sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config");
await run("sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config");
await run('systemctl reload sshd', { allowFail: true });

// 6. Final health check
console.log('\n── Final check ──');
await run('sleep 2 && curl -sf https://statsbudget.dk/api/health');

console.log(`
\x1b[32m══════════════════════════════════════\x1b[0m
\x1b[32m✓  https://www.statsbudget.dk is live!\x1b[0m
\x1b[32m══════════════════════════════════════\x1b[0m
`);
conn.end();
