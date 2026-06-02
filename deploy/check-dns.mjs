import { Client } from '../node_modules/ssh2/lib/index.js';

const conn = new Client();
await new Promise((res, rej) => {
  conn.on('ready', res); conn.on('error', rej);
  conn.connect({ host: '91.99.193.181', username: 'root', password: '9qmbqXi4jqjU', readyTimeout: 10000 });
});

function run(cmd) {
  return new Promise(res => {
    let out = '', err = '';
    conn.exec(cmd, (e, s) => {
      if (e) return res('');
      s.on('data', d => { out += d; process.stdout.write(d); });
      s.stderr.on('data', d => { err += d; process.stderr.write(d); });
      s.on('close', () => res(out.trim()));
    });
  });
}

console.log('\n── DNS lookup from server ──');
await run('dig +short statsbudget.dk A || nslookup statsbudget.dk');
await run('dig +short www.statsbudget.dk A');
console.log('\n── NS records ──');
await run('dig +short statsbudget.dk NS');
console.log('\n── External DNS check ──');
await run('curl -sf "https://dns.google/resolve?name=statsbudget.dk&type=A" 2>/dev/null | head -c 200 || echo "google DNS check failed"');
console.log('\n── HTTP test ──');
await run('curl -sf --max-time 5 http://statsbudget.dk/ -o /dev/null -w "HTTP status: %{http_code}" || echo "HTTP failed"');
console.log('\n── nginx status ──');
await run('systemctl is-active nginx && ss -tlnp | grep nginx || echo "nginx info"');
conn.end();
