# Deployment guide — Virtuel Regering 1.0

Komplet guide til at hoste på egen Linux-server. Forudsætter Ubuntu/Debian-server med root-adgang og et registreret domæne.

To deployment-strategier dokumenteret:
- **A. Native (anbefalet)** — Node.js + systemd + nginx
- **B. Docker** — for hurtigere setup og isolation

---

## A. Native deployment (anbefalet)

### Forudsætninger

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y nginx curl

# Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificér
node --version  # skal vise v20.x
npm --version
```

### 1. Opret system-bruger

```bash
sudo useradd --system --shell /bin/bash --create-home --home-dir /var/www/virtuel-regering virtuelregering
sudo mkdir -p /var/www/virtuel-regering/logs
sudo chown -R virtuelregering:virtuelregering /var/www/virtuel-regering
```

### 2. Deploy koden

```bash
# Som root, kopier projekt-mappen til serveren (rsync eller scp)
sudo rsync -av --exclude node_modules --exclude .git ./virtuel-regering/ /var/www/virtuel-regering/

# Installer dependencies som app-bruger
sudo -u virtuelregering bash -c "cd /var/www/virtuel-regering && npm ci --omit=dev"
```

### 3. Sæt systemd op

```bash
sudo cp /var/www/virtuel-regering/deploy/virtuel-regering.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable virtuel-regering
sudo systemctl start virtuel-regering

# Tjek status
sudo systemctl status virtuel-regering
sudo journalctl -u virtuel-regering -f
```

App'en kører nu på `127.0.0.1:3000`. Test lokalt:

```bash
curl http://127.0.0.1:3000/api/health
```

### 4. Konfigurer nginx

Rediger `/var/www/virtuel-regering/deploy/nginx.conf` og udskift `DIT-DOMAEN.DK` med dit faktiske domæne.

```bash
sudo cp /var/www/virtuel-regering/deploy/nginx.conf /etc/nginx/sites-available/virtuel-regering
sudo ln -s /etc/nginx/sites-available/virtuel-regering /etc/nginx/sites-enabled/
sudo nginx -t   # Test konfiguration
sudo systemctl reload nginx
```

### 5. SSL/TLS med Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d DIT-DOMAEN.DK -d www.DIT-DOMAEN.DK

# Auto-fornyelse (cron)
sudo systemctl status certbot.timer
```

Efter certbot kører din site på HTTPS med automatisk fornyelse hver 60 dage.

### 6. Verificér deployment

```bash
curl -I https://DIT-DOMAEN.DK
curl https://DIT-DOMAEN.DK/api/health
curl https://DIT-DOMAEN.DK/api/budget/baseline | head -c 200
```

Forventet: HTTP 200 + JSON-responses + HSTS-header.

---

## B. Docker deployment

### Forudsætninger

```bash
# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER  # log ud/ind efter dette
```

### 1. Byg og start

```bash
cd virtuel-regering
docker compose up -d --build
docker compose logs -f
```

App'en kører nu på `127.0.0.1:3000`.

### 2. Nginx foran

Samme nginx-config som A.4 fungerer — bare uden `User=` osv. Den proxy'er stadig til `127.0.0.1:3000`.

### 3. Opdatering

```bash
git pull
docker compose up -d --build
docker image prune -f
```

---

## Vedligeholdelse

### Logs

```bash
# Native
sudo journalctl -u virtuel-regering -n 100 --no-pager
sudo tail -f /var/log/nginx/virtuel-regering-access.log

# Docker
docker compose logs -f --tail 100
```

### Cache-statistik

```bash
curl https://DIT-DOMAEN.DK/api/dst/_stats
```

Returnerer hits/misses for diagnostik.

### Genstart

```bash
sudo systemctl restart virtuel-regering   # Native
docker compose restart                     # Docker
```

### Opdater data-kalibrering

Når en ny finanslov udkommer (typisk i december), opdater baseline-tal i `server/routes/budget.js` og redeploy. Live DST-data opdateres automatisk via API.

### Backup

Backup er minimal — der gemmes ingen brugerdata. Backup `/var/www/virtuel-regering/` (kode) og evt. nginx-config. Live data hentes altid fra DST/ODA.

---

## Performance og skalering

App'en er ekstremt let — under 50MB hukommelse, ingen database. En enkelt VPS (1 vCPU, 1GB RAM) klarer 100+ samtidige brugere.

Hvis du forventer >1000 samtidige brugere:

- Sæt Cloudflare foran (cache statiske aktiver, DDoS-beskyttelse)
- Skaler ved at køre flere instanser med PM2 cluster mode
- Skift cache fra in-memory til Redis hvis du har flere noder

```bash
# PM2 cluster (eksempel)
sudo npm install -g pm2
pm2 start server/index.js -i max --name virtuel-regering
```

## Fejlfinding

**"Cannot connect to DST API"**
DST har planlagte vedligeholdelsesvinduer. Tjek `https://api.statbank.dk/v1/` direkte. App'en virker stadig med baseline-data uden live tal.

**"ODA returnerer 503"**
ODA er nogle gange langsom om eftermiddagen. Cache er sat til 3 timer for at minimere requests.

**"npm install fejler på serveren"**
Tjek Node-version (`node --version` skal være 18+). Slet `node_modules` og `package-lock.json`, kør `npm install` igen.

**"nginx 502 Bad Gateway"**
App er nede. `sudo systemctl status virtuel-regering` for at se hvorfor. Tjek logs.

**"Mixed content warnings i browseren"**
Sker hvis du har konfigureret HTTPS men app'en stadig laver HTTP-requests. Tjek at alle URLs i frontend er relative (de er det i 1.0).

---

## Sikkerhed

App'en kører som unprivileged bruger med systemd-hardening. Den eksponerer ingen sensitive endpoints. Men:

- Hold Node.js og npm-pakker opdateret (`npm audit` regelmæssigt)
- Hold systemet opdateret (`apt update && apt upgrade`)
- Hold nginx og certbot opdateret
- Overvej fail2ban hvis du ser misbrug
- Sæt rate-limiting i nginx hvis du oplever scraping

## GDPR

App'en gemmer ingen brugerdata, har ingen cookies, ingen tracking. Eneste data der logges er nginx access logs (IP-adresser). Hvis du vil være helt GDPR-perfekt:

```nginx
# I nginx.conf, anonymisér IPs:
log_format anon '$remote_addr_anon - $remote_user [$time_local] '
                '"$request" $status $body_bytes_sent ...';
map $remote_addr $remote_addr_anon {
    ~(?P<ip>\d+\.\d+\.\d+)\.    $ip.0;
    ~(?P<ip>[^:]+:[^:]+):       $ip::;
    default                      0.0.0.0;
}
access_log /var/log/nginx/virtuel-regering-access.log anon;
```
