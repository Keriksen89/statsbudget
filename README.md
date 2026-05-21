# Virtuel Regering 2.1

> Form et politisk parti, stem på live-politikker og juster statsbudgettet — med MAKRO-kalibrerede dynamiske effekter.

En åben webapp der lader borgere forme et politisk parti, tage stilling til 40 politiske spørgsmål, stemme på fælles politikker i realtid og justere statsbudgettet. Baseret på åbne data fra Finanslov 2026, Danmarks Statistik, Folketinget og DREAM-gruppens MAKRO-model.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org) [![License: MIT](https://img.shields.io/badge/License-MIT-blue)](LICENSE) [![Data: FL2026](https://img.shields.io/badge/Data-Finanslov%202026-orange)](https://fm.dk)

---

## Hvad kan man?

### ⭐ Mit Parti — Politisk kompas
Tag stilling til **40 politiske positioner** på tværs af 8 politikområder og se præcis, hvor dit parti placerer sig på det politiske kompas — sammenlignet med de 11 rigtige danske partier (Ø, F, Å, A, B, M, C, V, I, O, D). Partiets navn og farve er valgfri. Gemmes lokalt i browseren.

### 🗳 Borgerstemmer — Live demokrati
Stem på **24 konkrete politikforslag** på tværs af 7 kategorier (økonomi, klima, velfærd, indvandring m.fl.). Se hvad andre danskere mener i realtid. IP-baseret ratelimiting og localStorage forhindrer dobbeltstemmer.

### 💰 Økonomi & Politik — MAKRO-kalibreret budgetsimulator
Justér **11 politiske parametre** (pensionsalder, topskat, selskabsskat, asyl, forsvar, CO2-afgift m.fl.) og se øjeblikkelig budgeteffekt. For hvert ændret parameter vises:
- **Statisk effekt** (1. ordensestimat)
- **⚡ MAKRO-dynamisk effekt** — selvfinansieringsgrad og adfærdsrespons kalibreret mod [DREAM's MAKRO-model](https://github.com/DREAM-DK/MAKRO)
- **SMILE fordelingseffekt** — progressiv/regressiv/neutral baseret på DREAM's mikrosimuleringsmodel
- **Netto budgeteffekt**

### 📊 Fremskrivning — DREAM holdbarhed
Statsgælds-prognose 2026–2034 + **DREAM holdbarhedsindikator** der sammenligner det strukturelle overskud mod det demografiske udgiftspres (~2,5% af BNP frem mod 2040) fra DREAM's OLG-model (overlappende generationer).

### 🧑‍🤝‍🧑 Demografi — Detaljeret befolkningsdata
Befolkningspyramide, projektion 2026–2070, fertilitetstrendkort, regioner, indvandreroriginer, beskæftigelse og **fiskalt pres-analyse** for 2040. Data fra DST FOLK1A og FRDK117.

### 🏛 Folketinget — Live afstemninger
De 15 seneste afstemninger i Folketingssalen direkte fra Folkentingets ODA-API.

---

## DREAM-integration

Modellen er kalibreret mod tre DREAM-modeller:

| DREAM-model | Anvendelse i Virtuel Regering |
|-------------|-------------------------------|
| **[MAKRO](https://github.com/DREAM-DK/MAKRO)** | Selvfinansieringsgrader for alle 11 politikparametre (topskattesats 25%, selskabsskat 35%, moms 5%, pensionsalder -43% forstærkning m.fl.) |
| **[GREU](https://github.com/DREAM-DK/GREU)** | CO2-afgift provenubase eroderer ~2-3%/år under grøn omstilling |
| **DREAM OLG** | Holdbarhedsindikator: demografisk pres 2026–2040 |
| **SMILE** | Fordelingseffekter pr. politikparameter (progressiv/regressiv-badges) |

> Modellen er pædagogisk og statisk i sin kerne — DREAM's modeller bruges til kalibrering og dynamiske korrektionstillæg, ikke som fuld CGE-model.

---

## Teknisk arkitektur

```
Browser ←→ Node.js/Express ←→ DST Statistikbank API
                            ←→ Folketingets ODA-API
                            ←→ /api/party  (in-memory + votes.json)
                            ←→ /api/demographics
```

- **Frontend:** Vanilla JS, ingen frameworks. 9 moduler (state, api, render, chart, share, party, demo, platform, app)
- **Backend:** Node.js 18+ / Express. API-proxy med in-memory caching
- **Afstemninger:** IP-baseret ratelimiting + fil-persistens (`server/data/votes.json`)
- **Sikkerhed:** Helmet CSP, ingen inline scripts
- **Tema:** Light/dark mode + mobile-responsive

---

## API-endpoints

| Endpoint | Beskrivelse | Cache |
|----------|-------------|-------|
| `GET /api/budget/baseline` | Budgetmodel v2.1 med MAKRO/SMILE-data | 10 min |
| `GET /api/dst/keyfigures` | BNP, befolkning, ledighed (live DST) | 6 t |
| `GET /api/oda/recent-votes` | Seneste 20 Folketing-afstemninger | 3 t |
| `GET /api/party/proposals` | 24 borgerforslagsforslag med live stemmer | — |
| `POST /api/party/vote` | Afgiv stemme (IP-ratelimited) | — |
| `GET /api/party/platform` | Vedtagne forslag + samlet budgeteffekt | — |
| `GET /api/demographics/summary` | Fuld demografirapport (DST-baseret) | — |

---

## Lokal udvikling

Krav: Node.js 18+ og npm.

```bash
git clone https://github.com/keriksen89/virtuel-regering
cd virtuel-regering
npm install
npm run dev
```

Åbn `http://localhost:3000`.

---

## Projekt-struktur

```
virtuel-regering/
├── server/
│   ├── index.js              # Express app + middleware
│   ├── data/
│   │   └── votes.json        # Persisterede borgerstemmer (committed til git)
│   ├── lib/
│   │   ├── cache.js          # In-memory TTL cache
│   │   └── fetch.js          # HTTP client med timeout
│   └── routes/
│       ├── budget.js         # Budgetmodel v2.1 (MAKRO+SMILE kalibreret)
│       ├── party.js          # Borgerstemmer — 24 forslag, IP-voting
│       ├── demographics.js   # Demografidata (DST FOLK1A + FRDK117)
│       ├── dst.js            # DST Statistikbank proxy
│       └── oda.js            # Folketinget ODA proxy
└── public/
    ├── index.html
    ├── css/app.css
    └── js/
        ├── state.js          # Global state + helpers
        ├── api.js            # API client
        ├── render.js         # Panel renderers (inkl. MAKRO + holdbarhed)
        ├── chart.js          # Canvas: gæld, alderspyramide, projektion, TFR, kompas
        ├── share.js          # URL state encoding
        ├── party.js          # Borgerstemmer frontend
        ├── demo.js           # Demografipanel
        ├── platform.js       # Mit Parti — politisk kompas
        └── app.js            # Bootstrap + event handlers
```

---

## Datakilder

- [Finanslov 2026](https://fm.dk/) — Finansministeriet (budgettal)
- [Danmarks Statistik](https://www.dst.dk/da/Statistik/hjaelp-til-statistikbanken/api) — FOLK1A, NAN1, FRDK117
- [Folketingets ODA-API](https://www.ft.dk/dokumenter/aabne_data) — Afstemninger
- [DREAM MAKRO](https://github.com/DREAM-DK/MAKRO) — Elasticiteter og selvfinansieringsgrader
- [DREAM GREU](https://github.com/DREAM-DK/GREU) — Grøn omstillingsdynamik
- Klimarådet — CO2-afgift provenuanalyse

Alle data under CC-BY 4.0 eller tilsvarende åbne licenser.

---

## Licens

MIT. Frit at kopiere, modificere og anvende kommercielt. Kildeangivelse for offentlige data kræves under deres respektive licenser.
