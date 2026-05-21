# Virtuel Regering 1.0

> Bliv finansminister for en dag. Datadreven simulator af det danske statsbudget.

En åben webapp der lader borgere justere statsbudgettet og se konsekvenserne for økonomi og samfund. Baseret på live data fra Finanslov 2026, Danmarks Statistik og Folketinget.

## Funktioner

- **16 udgiftsposter** kalibreret mod Finanslov 2026 og DST nationalregnskab
- **8 indtægtskategorier** med live skattedata
- **9 politiske parametre** (pensionsalder, topskat, asyl, forsvar, CO2-afgift m.fl.) med offentliggjorte elasticiteter
- **6 færdige scenarier** (borgerlig reform, rødt scenarie, LA 2035, kriseplan m.fl.)
- **Statsgældsfremskrivning** 2026-2034 + EU-budgetregler-tjek
- **Live data** fra DST Statistikbank og Folketingets ODA-API
- **Del dit budget** via URL — alle valg encodes i et delbart link
- **Light/dark mode** + mobile-responsive
- **GDPR-venligt** — ingen tracking, ingen cookies, ingen tredjepartsskripts

## Teknisk arkitektur

```
Browser ←→ Nginx (HTTPS) ←→ Node.js/Express ←→ DST API
                                              ←→ Folketinget ODA API
```

- **Frontend:** Vanilla JS, ingen frameworks. 5 moduler (state, api, render, chart, share, app)
- **Backend:** Node.js 18+ med Express. API-proxy med in-memory caching (6h TTL for data, 24h for metadata)
- **Sikkerhed:** Helmet CSP, ingen inline scripts, validated input på proxy-endpoints
- **Performance:** Gzip, HTTP caching, lazy-loaded live data

## Lokal udvikling

Krav: Node.js 18+ og npm.

```bash
git clone <repo>
cd virtuel-regering
npm install
npm run dev
```

Åbn `http://localhost:3000`.

## Projekt-struktur

```
virtuel-regering/
├── server/
│   ├── index.js              # Express app + middleware
│   ├── lib/
│   │   ├── cache.js          # In-memory TTL cache
│   │   └── fetch.js          # HTTP client med timeout
│   └── routes/
│       ├── budget.js         # Baseline + scenarier
│       ├── dst.js            # DST Statistikbank proxy
│       └── oda.js            # Folketinget ODA proxy
├── public/
│   ├── index.html
│   ├── favicon.svg
│   ├── robots.txt
│   ├── css/app.css
│   └── js/
│       ├── state.js          # Global state + helpers
│       ├── api.js            # API client
│       ├── render.js         # Panel renderers
│       ├── chart.js          # Canvas debt chart
│       ├── share.js          # URL state encoding
│       └── app.js            # Bootstrap + event handlers
├── deploy/
│   ├── virtuel-regering.service   # systemd unit
│   └── nginx.conf            # nginx reverse proxy
├── Dockerfile
├── docker-compose.yml
├── DEPLOY.md                 # Production deployment guide
└── package.json
```

## API endpoints

| Endpoint | Beskrivelse | Cache |
|----------|-------------|-------|
| `GET /api/health` | Health check | — |
| `GET /api/budget/baseline` | Hele budget-modellen + scenarier | 10 min |
| `GET /api/dst/keyfigures` | BNP, befolkning, ledighed (live) | 6 t |
| `POST /api/dst/data/:tableId` | Generisk DST-tabel proxy | 6 t |
| `GET /api/dst/tableinfo/:tableId` | DST tabel-metadata | 24 t |
| `GET /api/oda/recent-votes` | Seneste 20 afstemninger i Folketinget | 3 t |
| `GET /api/oda/parties` | Danske partier | 24 t |
| `GET /api/oda/recent-bills` | Seneste lovforslag (valgfrit topic-filter) | 3 t |

## Deployment

Se [DEPLOY.md](DEPLOY.md) for komplet guide til at hoste på egen server med nginx + systemd, eller Docker.

## Modelbegrænsninger

Dette er en pædagogisk simulator, ikke et makroøkonomisk værktøj. Den fanger førsteordens-effekter — direkte budgetimpact af politiske valg — men IKKE:

- Arbejdsudbudseffekter (lavere topskat → mere arbejde → mere skat)
- Laffer-kurver (høj skat → adfærdsændring → lavere provenu)
- Demografisk dynamik (pensionsalder → arbejdsstyrke 20 år frem)
- Adfærdsændringer (grænsehandel, kapital-udflytning, m.m.)

For ægte makroanalyse henvises til Finansministeriets [MAKRO-model](https://dreamgruppen.dk/makro/) (offentlig kode siden marts 2023).

## Roadmap

**v1.1** Fordelingseffekter via DST indkomstdeciler ("dine valg betyder X for en LO-familie")

**v1.2** Folketingsmatch ("dine valg matcher SF 64%, K 28%")

**v1.3** MAKRO-multiplikatorer indbygget for realistiske skatte-elasticiteter

**v2.0** Domæne-udvidelse: klima-impact (Energi Data Service), sundhedseffekter (eSundhed), kommunale visninger (Open Data DK)

## Datakilder

- [Finanslov 2026](https://fm.dk/) — Finansministeriet
- [Danmarks Statistik](https://www.dst.dk/da/Statistik/hjaelp-til-statistikbanken/api) — Statistikbank API
- [Folketingets ODA-API](https://www.ft.dk/dokumenter/aabne_data) — Afstemninger og lovforslag
- [Regeringens 2035-plan](https://regeringen.dk/) — Mellem- og langfristede mål
- [DREAM-gruppen MAKRO](https://dreamgruppen.dk/makro/) — Elasticiteter (publiceret)

Alle data under CC-BY 4.0 eller tilsvarende åbne licenser.

## Licens

MIT. Du må frit kopiere, modificere, kommercielt anvende og redistribuere. Kildeangivelse for de offentlige data kræves dog under deres respektive licenser.

## Bidrag

Pull requests velkomne. Ved kalibrering af tal eller elasticiteter, vedlæg kildehenvisning i `server/routes/budget.js`.
