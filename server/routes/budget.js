import { Router } from 'express';

const router = Router();

const BUDGET_DATA = {
  version: '1.0.0',
  fiscalYear: 2026,
  gdp: 2700,
  debtStartRatio: 0.30,
  lastCalibrated: '2026-05-01',
  expense: {
    pension: { name: "Folkepension + førtidspension", val: 240, min: 180, max: 300, info: "Største enkeltpost. Ca. 1.1 mio modtagere.", source: "DST OFF3 + Finanslov 2026 §17" },
    social: { name: "Øvrige sociale ydelser", val: 180, min: 100, max: 250, info: "Kontanthjælp, dagpenge, sygedagpenge, SU.", source: "Finanslov 2026 §15, §17, §19" },
    health: { name: "Sundhedsvæsen", val: 215, min: 150, max: 280, info: "Regioner 154 mia + kommunal sundhed + medicintilskud.", source: "DST BUDR32 + Finanslov 2026 §16" },
    education: { name: "Undervisning", val: 182, min: 130, max: 230, info: "Folkeskole, gymnasium, videregående, SU.", source: "DST NYT 49687 + Finanslov 2026 §20" },
    elderly: { name: "Ældrepleje (kommunal)", val: 65, min: 40, max: 90, info: "Hjemmepleje, plejehjem.", source: "Kommunale budgetter 2026" },
    childcare: { name: "Dagtilbud (børn)", val: 55, min: 30, max: 80, info: "Vuggestue, børnehave, SFO.", source: "Kommunale budgetter 2026" },
    defense: { name: "Forsvar", val: 95, min: 30, max: 160, info: "3.5% af BNP-mål 2030. Stiger kraftigt fra 1.36% i 2022.", source: "Forsvarsforlig 2024-2033 + tillægsaftale okt. 2025" },
    police: { name: "Politi & retsvæsen", val: 25, min: 15, max: 40, info: "Politi, anklagemyndighed, domstole, kriminalforsorg.", source: "Finanslov 2026 §11" },
    foreign: { name: "Udenrigs & udviklingsbistand", val: 22, min: 5, max: 40, info: "0.7% af BNI-mål. Ukraine-støtte separat.", source: "Finanslov 2026 §6" },
    climate: { name: "Klima & grøn omstilling", val: 30, min: 10, max: 80, info: "CO2-fond, energi-tilskud, transport-omstilling.", source: "Finanslov 2026 §29" },
    transport: { name: "Transport & infrastruktur", val: 35, min: 20, max: 70, info: "Veje, baner, kollektiv trafik.", source: "Finanslov 2026 §28" },
    research: { name: "Forskning & innovation", val: 28, min: 15, max: 60, info: "1% af BNP-mål. Universiteter, fonde.", source: "Finanslov 2026 §19" },
    asylum: { name: "Asyl & integration", val: 4, min: 0.5, max: 12, info: "Asylcentre, integrationsydelse, hjemsendelse.", source: "Finanslov 2026 §14" },
    admin: { name: "Offentlig administration", val: 60, min: 35, max: 90, info: "Statsforvaltning, kommunal admin, IT.", source: "DST OFF3 aggregat" },
    interest: { name: "Renter på statsgælden", val: 12, min: 5, max: 50, info: "Stiger med gæld og renteniveau.", source: "Finanslov 2026 §37" },
    other: { name: "Andre udgifter", val: 50, min: 20, max: 100, info: "Erhvervsstøtte, kultur, EU-bidrag, m.m.", source: "Finanslov 2026 aggregat" }
  },
  revenue: {
    income: { name: "Personlig indkomstskat", val: 580, min: 400, max: 750, info: "Bund-, mellem-, top-, top-topskat + kommune.", source: "DST OFF12 + Skatteministeriet" },
    am: { name: "Arbejdsmarkedsbidrag (AM)", val: 130, min: 80, max: 170, info: "8% af bruttoløn.", source: "DST OFF12" },
    vat: { name: "Moms", val: 280, min: 200, max: 350, info: "25% sats. Næststørste indtægt.", source: "DST OFF12" },
    corp: { name: "Selskabsskat", val: 95, min: 50, max: 160, info: "22% sats. Volatil med konjunktur.", source: "DST OFF12" },
    excise: { name: "Afgifter (energi, bil, alkohol)", val: 130, min: 80, max: 200, info: "CO2, registrering, alkohol, tobak.", source: "DST OFF12" },
    pal: { name: "Pensionsafkastskat (PAL)", val: 43, min: 0, max: 90, info: "15.3% af pensions-afkast. Meget volatil.", source: "Skatteministeriet 2024-niveau" },
    property: { name: "Ejendomsværdiskat", val: 18, min: 8, max: 35, info: "Boligskattereform 2024.", source: "Skatteministeriet" },
    other: { name: "Øvrige indtægter", val: 119, min: 60, max: 200, info: "Udbytte, gebyrer, EU-overførsler m.m.", source: "DST OFF3" }
  },
  policy: {
    retireAge: { name: "Folkepensionsalder", val: 67, min: 62, max: 72, unit: "år", info: "Hvert år ned koster ~14 mia. Hvert år op sparer ~14 mia. Vedtaget 70 år fra 2040.", elasticity: 14, target: "pension", direction: "expense" },
    topTax: { name: "Topskattesats", val: 7.5, min: 0, max: 25, unit: "%", info: "7.5% er FL2026-niveau (delt op i mellem/top/top-top). Hvert pct.point ≈ 4 mia provenu.", elasticity: 4, target: "income", direction: "revenue" },
    vatRate: { name: "Momssats", val: 25, min: 10, max: 30, unit: "%", info: "Hvert pct.point ≈ 11 mia. Lavere moms = lavere priser, lavere provenu.", elasticity: 11.2, target: "vat", direction: "revenue" },
    corpTax: { name: "Selskabsskattesats", val: 22, min: 10, max: 35, unit: "%", info: "Hvert pct.point ≈ 4.3 mia. Risiko for kapital-udflytning ved højere sats.", elasticity: 4.3, target: "corp", direction: "revenue" },
    asylumCap: { name: "Antal asylansøgere/år", val: 2500, min: 0, max: 15000, unit: "pers", info: "~1.600 kr/person/år all-in over første år. Tal er omstridt: regeringens estimat er lavere, kritikeres højere.", elasticity: 0.0016, target: "asylum", direction: "expense" },
    publicEmp: { name: "Offentlige ansatte", val: 850000, min: 700000, max: 1000000, unit: "pers", info: "Hvert 10.000 færre ansatte sparer ~5 mia på løn. Påvirker også service-niveau.", elasticity: 0.0005, target: "admin", direction: "expense" },
    devAid: { name: "Udviklingsbistand", val: 0.7, min: 0, max: 1.5, unit: "% BNI", info: "FN-mål er 0.7%. Hver 0.1 pct.point = ~2.7 mia.", elasticity: 27, target: "foreign", direction: "expense" },
    co2Tax: { name: "CO2-afgift (kr/ton)", val: 750, min: 0, max: 2500, unit: "kr", info: "Hvert 100 kr/ton ≈ 0.8 mia provenu (faldende basis pga. omstilling).", elasticity: 0.008, target: "excise", direction: "revenue" },
    defGoal: { name: "Forsvarsbudget (% BNP)", val: 3.5, min: 1, max: 6, unit: "%", info: "NATO-mål 2%. Regeringen sigter 3.5% i 2030. Hver 0.1 pct.point = ~2.7 mia.", elasticity: 27, target: "defense", direction: "expense" }
  },
  scenarios: {
    "fl2026": { title: "Finanslov 2026 (faktisk)", desc: "Den vedtagne finanslov fra december 2025.", changes: {} },
    "borgerlig": { title: "Borgerlig reform", desc: "Lavere skatter, slankere stat, højere forsvar.", changes: { topTax: 5, corpTax: 18, vatRate: 25, publicEmp: 800000, defGoal: 3.5, retireAge: 68 } },
    "rod": { title: "Rødt scenarie", desc: "Højere velfærd, grøn omstilling, højere topskat.", changes: { topTax: 12, corpTax: 25, co2Tax: 1500, devAid: 1.0, defGoal: 2.5, retireAge: 67 } },
    "lib2035": { title: "Liberal Alliance 2035", desc: "Topskat afskaffet, stærk skattereform.", changes: { topTax: 0, corpTax: 17, vatRate: 25, publicEmp: 750000, devAid: 0.4 } },
    "kriseplan": { title: "Kriseplan: balance straks", desc: "Hvad skal der til for nul-underskud uden gæld?", changes: { vatRate: 22, topTax: 12, retireAge: 69, publicEmp: 800000, devAid: 0.5 } },
    "klimaradikal": { title: "Radikal klima", desc: "Maksimal CO2-afgift, høj grøn investering.", changes: { co2Tax: 2000, topTax: 10, corpTax: 24, devAid: 1.0 } }
  }
};

router.get('/baseline', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=600');
  res.json(BUDGET_DATA);
});

export default router;
