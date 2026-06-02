// Quick update: git pull + restart on Hetzner
import { Client } from '../node_modules/ssh2/lib/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const conn = new Client();
await new Promise((res, rej) => {
  conn.on('ready', res); conn.on('error', rej);
  conn.connect({ host: '91.99.193.181', username: 'root',
    privateKey: fs.readFileSync(path.join(__dirname, 'id_statsbudget')),
    readyTimeout: 10000 });
});

function run(cmd, label) {
  if (label) process.stdout.write(`\n── ${label} ──\n`);
  return new Promise((res, rej) => {
    let out = '';
    conn.exec(cmd, (e, s) => {
      if (e) return rej(e);
      s.on('data', d => { out += d; process.stdout.write(d); });
      s.stderr.on('data', d => process.stderr.write(d));
      s.on('close', code => code !== 0 ? rej(new Error(`Exit ${code}`)) : res(out.trim()));
    });
  });
}

await run('cd /var/www/statsbudget && git pull origin main', 'Pulling latest code');
await run('cd /var/www/statsbudget && npm ci --omit=dev --silent', 'npm install');
await run('systemctl restart statsbudget && sleep 3 && systemctl is-active statsbudget', 'Restarting service');
await run('curl -sf http://127.0.0.1:3000/api/health', 'Health check');
console.log('\n✓ statsbudget.dk updated!');
conn.end();
