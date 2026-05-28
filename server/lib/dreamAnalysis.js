// Shared DREAM/MAKRO economic impact estimation
// Used by both /api/rygter/feed and /api/news

const POLICY_KEYWORDS = [
  { cat: 'Skat',          words: ['topskat','bundskat','indkomstskat','skattelettelse','skattestigning','personskat','kapitalbeskatning','aktieskat','formueskat','arveafgift'] },
  { cat: 'Skat',          words: ['moms','afgift','energiafgift','tobaksafgift','sukkerskat','plastafgift'] },
  { cat: 'Velfærd',       words: ['dagpenge','kontanthjælp','førtidspension','ydelse','overførselsindkomst','sociale ydelser','fattigdomsgrænse'] },
  { cat: 'Pension',       words: ['pension','pensionsalder','folkepension','tilbagetrækningsalder','efterløn','pensionsopsparing'] },
  { cat: 'Klima',         words: ['klima','co2','grøn','vedvarende energi','solcelle','vindmølle','elbil','klimaafgift','klimamål'] },
  { cat: 'Bolig',         words: ['bolig','husleje','ejendomsskat','grundskyld','lejelov','almene boliger','boligmarked','boligpris'] },
  { cat: 'Forsvar',       words: ['forsvar','militær','nato','hæren','flyvevåbenet','marinen','forsvarsbudget','forsvarsudgifter'] },
  { cat: 'Uddannelse',    words: ['uddannelse','folkeskole','gymnasie','su','universitet','erhvervsuddannelse','studiestøtte','lærer'] },
  { cat: 'Sundhed',       words: ['sundhed','hospital','sygehus','venteliste','læge','psykiatri','medicin','sygesikring'] },
  { cat: 'Arbejdsmarked', words: ['arbejdsmarked','løn','overenskomst','fagforening','arbejdsløshed','beskæftigelse','flexicurity','jobcenter','ledighed'] },
  { cat: 'Immigration',   words: ['indvandring','integration','asyl','udlænding','flygtninge','opholdstilladelse','statsborgerskab','udvisning'] },
];

const FISCAL_RULES = [
  { pattern: /hæver? topskatten?|øger? topskatten?|forhøjer? topskatten?/i, fiscalBn: 4.5, gdpPct: -0.08, employmentK: 3, giniDelta: -0.3, politicalScore: 60 },
  { pattern: /sænker? topskatten?|reducerer? topskatten?|fjerner? topskatten?|afskaffe topskat/i, fiscalBn: -4.5, gdpPct: 0.08, employmentK: -3, giniDelta: 0.3, politicalScore: -60 },
  { pattern: /hæver? momsen?|øger? momsen?|forhøjer? momsen?/i, fiscalBn: 6.5, gdpPct: -0.1, employmentK: 0, giniDelta: 0.2, politicalScore: 30 },
  { pattern: /sænker? momsen?|reducerer? momsen?|halverer? momsen?/i, fiscalBn: -6.5, gdpPct: 0.1, employmentK: 0, giniDelta: -0.2, politicalScore: -30 },
  { pattern: /hæver? selskabsskatten?|øger? selskabsskat/i, fiscalBn: 3.0, gdpPct: -0.05, employmentK: 0, giniDelta: -0.1, politicalScore: 50 },
  { pattern: /sænker? selskabsskatten?|reducerer? selskabsskat/i, fiscalBn: -3.0, gdpPct: 0.05, employmentK: 0, giniDelta: 0.1, politicalScore: -50 },
  { pattern: /hæver? pensionsalderen?|øger? pensionsalderen?|udskyder? pensionsalder/i, fiscalBn: 7.0, gdpPct: 0.4, employmentK: 15, giniDelta: 0.1, politicalScore: -30 },
  { pattern: /sænker? pensionsalderen?|reducerer? pensionsalderen?|tidligere pension/i, fiscalBn: -7.0, gdpPct: -0.4, employmentK: -15, giniDelta: -0.1, politicalScore: 30 },
  { pattern: /stramme?r? kontanthjælp|skære?r? kontanthjælp|reducere?r? kontanthjælp/i, fiscalBn: 2.0, gdpPct: -0.05, employmentK: 3, giniDelta: 0.4, politicalScore: -40 },
  { pattern: /øge?r? kontanthjælp|hæve?r? kontanthjælp|forbedre?r? kontanthjælp/i, fiscalBn: -2.0, gdpPct: 0.03, employmentK: -1, giniDelta: -0.3, politicalScore: 50 },
  { pattern: /stramme?r? dagpenge|forkorte?r? dagpengeperiode|reducere?r? dagpenge/i, fiscalBn: 2.5, gdpPct: 0.05, employmentK: 5, giniDelta: 0.3, politicalScore: -35 },
  { pattern: /øge?r? dagpenge|forlænge?r? dagpengeperiode|forbedre?r? dagpenge/i, fiscalBn: -2.5, gdpPct: -0.02, employmentK: -2, giniDelta: -0.3, politicalScore: 45 },
  { pattern: /øger? forsvarsbudget|løfter? forsvarsudgifter|investerer? i forsvar|forhøjer? forsvar/i, fiscalBn: -10.0, gdpPct: 0.2, employmentK: 8, giniDelta: 0.0, politicalScore: -20 },
  { pattern: /skære?r? forsvar|reducerer? forsvarsudgifter|sænker? forsvarsbudget/i, fiscalBn: 5.0, gdpPct: -0.1, employmentK: -4, giniDelta: 0.0, politicalScore: 20 },
  { pattern: /øger? su|forbedrer? su|hæver? su/i, fiscalBn: -1.5, gdpPct: 0.05, employmentK: 0, giniDelta: -0.2, politicalScore: 40 },
  { pattern: /stramme?r? su|reducerer? su|skære?r? su/i, fiscalBn: 1.5, gdpPct: -0.03, employmentK: 0, giniDelta: 0.2, politicalScore: -35 },
  { pattern: /grøn investering|klimainvestering|grøn omstilling|vedvarende energi investering/i, fiscalBn: -5.0, gdpPct: 0.15, employmentK: 10, giniDelta: -0.1, politicalScore: 30 },
  { pattern: /hæver? grundskyld|øger? grundskyld|forhøjer? grundskyld/i, fiscalBn: 3.0, gdpPct: -0.05, employmentK: 0, giniDelta: -0.2, politicalScore: 40 },
  { pattern: /sænker? grundskyld|reducerer? grundskyld|afskaffe grundskyld/i, fiscalBn: -3.0, gdpPct: 0.03, employmentK: 0, giniDelta: 0.2, politicalScore: -35 },
  { pattern: /investerer? i folkeskole|løfter? folkeskole|styrker? folkeskole/i, fiscalBn: -2.0, gdpPct: 0.08, employmentK: 5, giniDelta: -0.2, politicalScore: 35 },
  { pattern: /investerer? i sundhed|løfter? sygehus|styrker? psykiatri/i, fiscalBn: -3.0, gdpPct: 0.1, employmentK: 8, giniDelta: -0.2, politicalScore: 30 },
  { pattern: /stramme?r? indvandring|begrænser? asyl|reducerer? integration/i, fiscalBn: 1.5, gdpPct: -0.1, employmentK: -5, giniDelta: 0.1, politicalScore: -50 },
  { pattern: /åbner? for indvandring|lempelse?r? asyl|letter? integration/i, fiscalBn: -1.0, gdpPct: 0.1, employmentK: 8, giniDelta: 0.0, politicalScore: 40 },
];

function detectConfidence(text) {
  const t = text.toLowerCase();
  if (/vedtaget|godkendt|aftale indgået|loven er|er vedtaget/.test(t)) return 'vedtaget';
  if (/forslag|vil foreslå|har fremsat|udspil|planer om/.test(t)) return 'forslag';
  if (/forhandler|drøfter|taler om|overvejer|er ved at/.test(t)) return 'forhandling';
  return 'rygte';
}

function detectCategory(text) {
  const t = text.toLowerCase();
  for (const rule of POLICY_KEYWORDS) {
    if (rule.words.some(w => t.includes(w))) return rule.cat;
  }
  return 'Øvrig';
}

function getCategoryAssumptions(cat) {
  const map = {
    Skat:           'Elasticitetsantagelse: topskattens arbejdsudbudseffekt sat til 0,2 (DREAM); selvfinansieringsgrad ~20% via dynamiske effekter.',
    Velfærd:        'DREAM-arbejdsudbudsmodel: overførsler reducerer arbejdsudbud med 0,1–0,3 fuldtidspersoner pr. modtager ved marginale ændringer.',
    Klima:          'IEA/DMI-parametre: 1 mia. kr. klimainvestering = ca. 0,6–0,8 mia. BNP og 150–200 nye job i grøn sektor på 5-årshorisont.',
    Forsvar:        'NATO-baseline: fra ca. 1,4% til 2% af BNP koster ~10 mia. kr./år ekstra. Forsvarsudgifter har multiplikator på ~0,7 mod ~1,2 for civil investering.',
    Bolig:          'Boligmarkedsmodel: ændringer i grundskyld kapitaliseres delvist i priser inden for 3–5 år; ikke-neutral for lejer vs. ejer.',
    Pension:        'AE-rådsestimater: 1 år ekstra pensionsalder = ~7 mia. kr./år i reduceret pension + øget skatteindtægt fra fortsat beskæftigelse.',
    Sundhed:        'Produktivitetskommissionen: 1 kr. investeret i sundhedskapacitet giver ~0,5–0,8 kr. retur via lavere sygefravær og øget erhvervsdeltagelse.',
    Uddannelse:     'Uddannelsesinvesteringer: afkastet er 7–9% pr. år men viser sig tidligst 10–15 år frem i BNP — kortsigtet udgift, langsigtet gevinst.',
    Arbejdsmarked:  'Flexicurity-parametre: konjunkturafhængig effekt; normalt 1–3 mia. kr. i udgiftsændring pr. 10.000 fuldtidspersoner.',
    Immigration:    'DST-statistik: nettobidrag varierer kraftigt — veluddannede +300k kr./år, ikke-vestlige uden erhvervsuddannelse ca. −150k kr./år (2023-tal).',
    Øvrig:          'Estimat baseret på gennemsnitlige DREAM/MAKRO-elasticiteter for åben, lille økonomi som Danmarks.',
  };
  return map[cat] || map['Øvrig'];
}

function getCategoryDefault(cat) {
  const defaults = {
    Skat:           'Skatteændringer påvirker direkte de offentlige finanser og arbejdsudbuddet — de præcise beløb afhænger af udformningen.',
    Velfærd:        'Velfærdsreformer har komplekse effekter: direkte udgiftsændringer samt sekundære effekter på arbejdsudbud og sociale indikatorer.',
    Klima:          'Klimainvesteringer er typisk dyre på kort sigt men giver positive langsigtede effekter via grøn omstilling og nye jobs.',
    Bolig:          'Boligpolitik påvirker markedspriser og ulighed — effekterne afhænger af balance mellem udbud og efterspørgsel.',
    Forsvar:        'Forsvarsudgifter har en direkte multiplikatoreffekt i dansk økonomi, men fortrænger private investeringer.',
    Uddannelse:     'Uddannelsesinvesteringer er langsigtede — kortfristet udgift, men positiv BNP-effekt over 10-20 år via højere produktivitet.',
    Sundhed:        'Sundhedsinvesteringer forbedrer folkesundheden og arbejdsudbuddet — men kræver finansiering på kort sigt.',
    Arbejdsmarked:  'Arbejdsmarkedsreformer påvirker beskæftigelse og lønudvikling — effekter varierer med konjunkturerne.',
    Immigration:    'Indvandringspolitik påvirker arbejdsudbud, offentlige udgifter og samfundsøkonomisk integration.',
    Pension:        'Pensionsreformer har store langsigtede finanspolitiske effekter via ændret tilbagetrækningsadfærd.',
    Øvrig:          'Tiltaget analyseres i henhold til generelle DREAM/MAKRO-parametre for dansk økonomi.',
  };
  return defaults[cat] || defaults['Øvrig'];
}

function generateExplanation(category, rule, title) {
  const { fiscalBn, gdpPct, employmentK, giniDelta } = rule;
  const parts = [];

  if (fiscalBn != null) {
    const abs = Math.abs(fiscalBn).toFixed(1).replace('.', ',');
    if (fiscalBn > 0) {
      parts.push(`Tiltaget forbedrer de offentlige finanser med anslået ${abs} mia. kr. om året — under antagelse om fuld indfasning over 3–4 år og en selvfinansieringsgrad på ca. 15–25%.`);
    } else {
      parts.push(`Tiltaget belaster de offentlige finanser med ca. ${abs} mia. kr. om året. Antager at udgiften er fuldt finansieret over finansloven og indfases over 2–3 år.`);
    }
  }

  if (gdpPct != null && Math.abs(gdpPct) >= 0.04) {
    const dir = gdpPct > 0 ? 'positivt' : 'negativt';
    parts.push(`BNP-effekten vurderes ${dir} på ca. ${Math.abs(gdpPct).toFixed(2).replace('.', ',')}% set over en 5-årig modelhorisont.`);
  }

  if (employmentK != null && Math.abs(employmentK) >= 0.5) {
    if (employmentK > 0) {
      parts.push(`DREAM-parametrene indikerer op til ${employmentK.toFixed(0)}k ekstra fuldtidsjob som følge af øget arbejdsudbud eller ny aktivitet.`);
    } else {
      parts.push(`Beskæftigelsen kan falde med op til ${Math.abs(employmentK).toFixed(0)}k fuldtidspersoner via lavere arbejdsudbud eller efterspørgselsfald.`);
    }
  }

  if (giniDelta != null && Math.abs(giniDelta) >= 0.1) {
    if (giniDelta > 0) {
      parts.push(`Indkomstfordelingen vil sandsynligvis blive mere ulige (Gini +${giniDelta.toFixed(1)} point).`);
    } else {
      parts.push(`Tiltaget har en udligningseffekt på indkomstfordelingen (Gini ${giniDelta.toFixed(1)} point).`);
    }
  }

  const assumption = getCategoryAssumptions(category);
  if (assumption) parts.push(assumption);

  return parts.length > 0 ? parts.join(' ') : getCategoryDefault(category);
}

function buildImpact(rule, category, confidence, title) {
  const explanation = generateExplanation(category, rule, title);
  return {
    fiscalBn:       rule.fiscalBn,
    gdpPct:         rule.gdpPct,
    employmentK:    rule.employmentK,
    giniDelta:      rule.giniDelta,
    politicalScore: rule.politicalScore,
    category,
    confidence,
    explanation,
  };
}

export function estimateDREAMImpact(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  // Check for specific fiscal rule match first (strong signal)
  for (const rule of FISCAL_RULES) {
    if (rule.pattern.test(text)) {
      const category = detectCategory(text);
      const confidence = detectConfidence(text);
      return buildImpact(rule, category, confidence, title);
    }
  }

  // Check if any policy keywords are present
  const category = detectCategory(text);

  // No policy keywords → not a policy article, skip analysis
  if (category === 'Øvrig') return null;

  // Policy topic detected but no specific fiscal rule → use category heuristics
  const confidence = detectConfidence(text);
  const heuristics = {
    Skat:           { fiscalBn: null,  gdpPct: null,   employmentK: null, giniDelta: null,  politicalScore: 0 },
    Velfærd:        { fiscalBn: -2.0,  gdpPct: 0.03,   employmentK: -1,   giniDelta: -0.3,  politicalScore: 45 },
    Klima:          { fiscalBn: -3.0,  gdpPct: 0.1,    employmentK: 6,    giniDelta: -0.1,  politicalScore: 25 },
    Bolig:          { fiscalBn: -1.5,  gdpPct: 0.05,   employmentK: 2,    giniDelta: -0.1,  politicalScore: 20 },
    Forsvar:        { fiscalBn: -8.0,  gdpPct: 0.15,   employmentK: 6,    giniDelta: 0.0,   politicalScore: -15 },
    Uddannelse:     { fiscalBn: -2.0,  gdpPct: 0.08,   employmentK: 5,    giniDelta: -0.2,  politicalScore: 30 },
    Sundhed:        { fiscalBn: -3.0,  gdpPct: 0.1,    employmentK: 8,    giniDelta: -0.2,  politicalScore: 25 },
    Arbejdsmarked:  { fiscalBn: 0.5,   gdpPct: 0.05,   employmentK: 4,    giniDelta: 0.05,  politicalScore: -10 },
    Immigration:    { fiscalBn: 1.5,   gdpPct: -0.05,  employmentK: -3,   giniDelta: 0.1,   politicalScore: -40 },
    Pension:        { fiscalBn: 3.0,   gdpPct: 0.2,    employmentK: 8,    giniDelta: 0.05,  politicalScore: -20 },
  };

  const h = heuristics[category];
  if (!h) return null;
  return buildImpact(h, category, confidence, title);
}
