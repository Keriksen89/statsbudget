import { Router } from 'express';
import * as cache from '../lib/cache.js';
import { fetchWithTimeout } from '../lib/fetch.js';
import { estimateDREAMImpact } from '../lib/dreamAnalysis.js';

const router = Router();

// ── RSS XML parser (no extra dependencies) ────────────────────────────────

function parseRSSItems(xml) {
  const items = [];
  const itemPattern = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemPattern.exec(xml)) !== null) {
    const block = match[1];
    const title       = extractTag(block, 'title');
    const description = extractTag(block, 'description');
    const link        = extractTag(block, 'link');
    const pubDate     = extractTag(block, 'pubDate');
    const guid        = extractTag(block, 'guid');
    items.push({ title, description, link, pubDate, guid });
  }
  return items;
}

function extractTag(block, tag) {
  // Handle CDATA and plain content
  const cdataRe = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const c = cdataRe.exec(block);
  if (c) return c[1].trim();
  const p = plainRe.exec(block);
  if (p) return p[1].trim();
  return '';
}

function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
}

// ── RSS fetchers ───────────────────────────────────────────────────────────

const POLITIK_KEYWORDS = /politi[ck]|finanslov|budge|skat|regering|folketing|minister|parti|reform|valg|venstref|socialdem|liberal|konservativ|dansk folkeparti|radikale|SF|enhedslisten/i;

async function fetchDR() {
  const url = 'https://www.dr.dk/nyheder/service/feeds/politik';
  const res = await fetchWithTimeout(url, {
    headers: { 'Accept': 'application/rss+xml, text/xml, application/xml', 'User-Agent': 'VirtuelRegering/1.0' }
  }, 10000);
  const xml = await res.text();
  const items = parseRSSItems(xml);
  return items.map(item => ({
    title:       cleanHtml(item.title),
    description: cleanHtml(item.description).slice(0, 300),
    link:        item.link,
    pubDate:     item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    source:      'DR',
    guid:        item.guid || item.link,
  }));
}

async function fetchTV2() {
  const url = 'https://feeds.tv2.dk/nyheder/rss';
  const res = await fetchWithTimeout(url, {
    headers: { 'Accept': 'application/rss+xml, text/xml, application/xml', 'User-Agent': 'VirtuelRegering/1.0' }
  }, 10000);
  const xml = await res.text();
  const allItems = parseRSSItems(xml);
  // Filter for politics-relevant items
  return allItems
    .filter(item => POLITIK_KEYWORDS.test(item.title + ' ' + item.description))
    .map(item => ({
      title:       cleanHtml(item.title),
      description: cleanHtml(item.description).slice(0, 300),
      link:        item.link,
      pubDate:     item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      source:      'TV2',
      guid:        item.guid || item.link,
    }));
}

// ── Route ─────────────────────────────────────────────────────────────────

router.get('/feed', async (req, res) => {
  const cacheKey = 'rygter:feed';
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  let drItems = [], tv2Items = [];

  const [drResult, tv2Result] = await Promise.allSettled([
    fetchDR().catch(e => { console.warn('[rygter] DR fetch failed:', e.message); return []; }),
    fetchTV2().catch(e => { console.warn('[rygter] TV2 fetch failed:', e.message); return []; }),
  ]);

  if (drResult.status === 'fulfilled')  drItems  = drResult.value  || [];
  if (tv2Result.status === 'fulfilled') tv2Items = tv2Result.value || [];

  // Merge and deduplicate by title similarity
  const all = [...drItems, ...tv2Items];
  const seen = new Set();
  const unique = all.filter(item => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by date descending
  unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Apply DREAM analysis to each item
  const analyzed = unique.map(item => {
    const impact = estimateDREAMImpact(item.title, item.description);
    return { ...item, impact };
  });

  // If both feeds failed, provide mock data for demo
  const result = analyzed.length > 0 ? analyzed : getMockRygter();

  cache.set(cacheKey, result, 5 * 60); // 5 minutes
  res.setHeader('X-Cache', 'MISS');
  res.json(result);
});

// ── Scenario definitions ──────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: 'blaa',
    name: 'Blåt forlig',
    emoji: '🔵',
    subtitle: 'Centerhøjre-koalition',
    description: 'Lavere topskat, forsvarsopbygning, strammere dagpengeregler og pensionsalder op til 69. Finansieret via besparelser på overførsler og strammet indvandring.',
    policies: [
      { name: 'Sænk/fjern topskatten', fiscalBn: -4.5, gdpPct: 0.08, employmentK: -3, giniDelta: 0.3 },
      { name: 'Forsvarspakke: 2% af BNP inden 2030', fiscalBn: -10.0, gdpPct: 0.2, employmentK: 8, giniDelta: 0.0 },
      { name: 'Stram dagpengeperiode (−6 mdr.)', fiscalBn: 2.5, gdpPct: 0.05, employmentK: 5, giniDelta: 0.3 },
      { name: 'Pensionsalder til 69 år fra 2030', fiscalBn: 7.0, gdpPct: 0.4, employmentK: 15, giniDelta: 0.1 },
      { name: 'SU-reform: kortere støtteperiode', fiscalBn: 1.5, gdpPct: -0.03, employmentK: 0, giniDelta: 0.2 },
      { name: 'Stram indvandring & integration', fiscalBn: 1.5, gdpPct: -0.1, employmentK: -5, giniDelta: 0.1 },
    ],
    assumptions: [
      'Topskattelettelse indfaset over 4 år; selvfinansieringsgrad antages 20–25% via øget arbejdsudbud',
      'Forsvarsmål på 2% BNP nås i 2030 via ny flerårsaftale (fra nuværende ~1,4%)',
      'Dagpengereform: perioden forkortes fra 2 til 1,5 år; øger arbejdsudbud ~5.000 pers. jf. DREAM',
      'Pensionsalder +1 år fra 2030 per Velfærdskommissionens anbefaling; spar ~7 mia. kr./år',
      'Immigrationsstramning reducerer nettotilstrømning af ikke-arbejdsmarkedsparate med ca. 20%',
    ],
    categories: ['Skat', 'Forsvar', 'Velfærd', 'Pension', 'Uddannelse', 'Immigration'],
  },
  {
    id: 'roed',
    name: 'Rødt forlig',
    emoji: '🟤',
    subtitle: 'Centervenstre-koalition',
    description: 'Velfærdsløft, massive klimainvesteringer, styrket sundhed og folkeskole. Finansieret primært via hævet topskat og kapitalbeskatning.',
    policies: [
      { name: 'Hæv topskatten (+5 pct.point)', fiscalBn: 4.5, gdpPct: -0.08, employmentK: 3, giniDelta: -0.3 },
      { name: 'Klimainvesteringer: 20 mia. kr.', fiscalBn: -5.0, gdpPct: 0.15, employmentK: 10, giniDelta: -0.1 },
      { name: 'Sundhedsløft (+3 mia. kr./år)', fiscalBn: -3.0, gdpPct: 0.1, employmentK: 8, giniDelta: -0.2 },
      { name: 'Folkeskolereform: styrk lærere', fiscalBn: -2.0, gdpPct: 0.08, employmentK: 5, giniDelta: -0.2 },
      { name: 'Løft kontanthjælp til 15.000 kr./mdr.', fiscalBn: -2.0, gdpPct: 0.03, employmentK: -1, giniDelta: -0.3 },
      { name: 'Moderat forsvarsløft (1,7% BNP)', fiscalBn: -5.0, gdpPct: 0.1, employmentK: 4, giniDelta: 0.0 },
    ],
    assumptions: [
      'Topskat +5 pct.point (til 20%) på indkomst > 611.500 kr.; DØR-estimat: 4,5 mia. kr./år',
      'Klimainvesteringer delfinansieret via EU\'s Klimafond (antager ~30% EU-medfinansiering)',
      'Sundhedsudgifter baseret på Sundhedskommissionens 2024-anbefalinger om 10.000 ekstra sygeplejersker',
      'Kontanthjælp til 15.000 kr./mdr. koster ca. 2 mia. kr./år netto (inkl. aktiveringsmodvirkning)',
      'Forsvar til 1,7% BNP som etape mod NATO-krav; fuld opfyldelse er betinget af flertalsaftale',
    ],
    categories: ['Klima', 'Sundhed', 'Velfærd', 'Uddannelse', 'Skat', 'Forsvar'],
  },
  {
    id: 'center',
    name: 'Centerforlig',
    emoji: '⚪',
    subtitle: 'Bred midterkoalition',
    description: 'Pragmatisk kompromis: delvis forsvarsvækst, grøn arbejdsmarkedsreform, boligskattereform og pensionsalder til 68. Tilnærmet budgetbalance.',
    policies: [
      { name: 'Forsvarspakke: 1,7% BNP i 2028', fiscalBn: -7.0, gdpPct: 0.15, employmentK: 6, giniDelta: 0.0 },
      { name: 'Grøn arbejdsmarkedsreform', fiscalBn: -2.5, gdpPct: 0.12, employmentK: 8, giniDelta: -0.1 },
      { name: 'Boligreform: grundskyldrevision', fiscalBn: 3.0, gdpPct: -0.05, employmentK: 0, giniDelta: -0.2 },
      { name: 'Sundhedsoptimering (fokusinvestering)', fiscalBn: -1.5, gdpPct: 0.05, employmentK: 4, giniDelta: -0.1 },
      { name: 'Pensionsalder til 68 (kompromis)', fiscalBn: 3.5, gdpPct: 0.2, employmentK: 7, giniDelta: 0.05 },
    ],
    assumptions: [
      'Forsvarsmål afpasset til 1,7% BNP som etapemål; resten via NATO-samarbejde og materielinvesteringer',
      'Grundskyldrevision: omfordeling fra boligejere til erhvervslejere; ikke nettostigende samlet',
      'Grøn reform kombinerer VE-investeringer med omskoling af 40.000 arbejdere over 5 år',
      'Bred parlamentarisk aftale giver hurtigere implementering (2–3 år vs. typisk 4–5 år)',
      'Pensionskompromis på 68 år fra 2029: balancerer rød og blå bloks positioner',
    ],
    categories: ['Forsvar', 'Klima', 'Bolig', 'Sundhed', 'Pension', 'Arbejdsmarked'],
  },
];

router.get('/scenarios', async (req, res) => {
  const cacheKey = 'rygter:scenarios';
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  // Try to correlate with cached news
  const feedItems = cache.get('rygter:feed') || [];

  const result = SCENARIOS.map(scenario => {
    const combined = scenario.policies.reduce((acc, p) => ({
      fiscalBn:    acc.fiscalBn    + (p.fiscalBn    || 0),
      gdpPct:      acc.gdpPct      + (p.gdpPct      || 0),
      employmentK: acc.employmentK + (p.employmentK || 0),
      giniDelta:   acc.giniDelta   + (p.giniDelta   || 0),
    }), { fiscalBn: 0, gdpPct: 0, employmentK: 0, giniDelta: 0 });

    combined.fiscalBn    = Math.round(combined.fiscalBn    * 10) / 10;
    combined.gdpPct      = Math.round(combined.gdpPct      * 100) / 100;
    combined.employmentK = Math.round(combined.employmentK);
    combined.giniDelta   = Math.round(combined.giniDelta   * 10) / 10;

    const relatedNews = feedItems
      .filter(item => item.impact && scenario.categories.includes(item.impact.category))
      .slice(0, 3)
      .map(item => ({ title: item.title, source: item.source, link: item.link }));

    return { ...scenario, combined, relatedNews };
  });

  cache.set(cacheKey, result, 5 * 60);
  res.setHeader('X-Cache', 'MISS');
  res.json(result);
});

// ── Mock data if both feeds fail ───────────────────────────────────────────

function getMockRygter() {
  const items = [
    {
      title: 'Regeringen overvejer reform af dagpengesystemet',
      description: 'Ifølge kilder tæt på forhandlingerne overvejer regeringen at stramme dagpengereglerne for at øge arbejdsudbuddet.',
      link: 'https://www.dr.dk/nyheder/politik',
      source: 'DR',
      pubDate: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    },
    {
      title: 'Ny forsvarsaftale kan koste 10 milliarder ekstra',
      description: 'En ny forsvarsaftale er under forhandling. Partierne er enige om at øge forsvarsbudgettet til 2% af BNP hurtigere end planlagt.',
      link: 'https://www.dr.dk/nyheder/politik',
      source: 'DR',
      pubDate: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      title: 'Mulig topskattelettelse på vej',
      description: 'Kilder siger at blå blok drøfter en reduktion af topskatten som led i en kommende skatteaftale.',
      link: 'https://nyheder.tv2.dk/politik',
      source: 'TV2',
      pubDate: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      title: 'SF foreslår at hæve kontanthjælpen',
      description: 'SF har fremsat forslag om at løfte kontanthjælpen til 15.000 kr. om måneden for at bekæmpe fattigdom.',
      link: 'https://nyheder.tv2.dk/politik',
      source: 'TV2',
      pubDate: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    },
    {
      title: 'Klimaforlig kan udløse 20 mia. i grønne investeringer',
      description: 'En bred kreds af partier forhandler om et klimaforlig der vil udløse massive investeringer i vedvarende energi og grøn omstilling.',
      link: 'https://www.dr.dk/nyheder/politik',
      source: 'DR',
      pubDate: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    {
      title: 'Folkeskolereform: Regeringen vil investere i læreruddannelsen',
      description: 'Regeringen planlægger at styrke folkeskolen med nye midler til læreruddannelse og efteruddannelse.',
      link: 'https://www.dr.dk/nyheder/politik',
      source: 'DR',
      pubDate: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    },
  ];

  return items.map(item => ({
    ...item,
    guid: item.link + item.title.slice(0, 20),
    impact: estimateDREAMImpact(item.title, item.description),
  }));
}

export default router;
