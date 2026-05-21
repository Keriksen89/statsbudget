import { Router } from 'express';
import * as cache from '../lib/cache.js';
import { fetchJSON } from '../lib/fetch.js';

const router = Router();
const ODA_BASE = 'https://oda.ft.dk/api';
const CACHE_TTL = 3 * 3600;

router.get('/recent-votes', async (req, res) => {
  const cacheKey = 'oda:recent-votes';
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  try {
    const url = `${ODA_BASE}/Afstemning?$top=20&$orderby=opdateringsdato%20desc&$expand=Sagstrin/Sag&$select=id,nummer,konklusion,vedtaget,opdateringsdato,kommentar,Sagstrin/Sag/titel`;
    const data = await fetchJSON(url);

    const votes = (data.value || []).map(v => ({
      id: v.id,
      nummer: v.nummer,
      vedtaget: v.vedtaget,
      konklusion: (v.konklusion || '').slice(0, 200),
      dato: v.opdateringsdato,
      sagTitel: v.Sagstrin && v.Sagstrin.Sag ? v.Sagstrin.Sag.titel : null
    }));

    const result = {
      votes,
      fetched: new Date().toISOString(),
      source: 'Folketingets ODA-API'
    };

    cache.set(cacheKey, result, CACHE_TTL);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  } catch (err) {
    console.warn('[oda] recent-votes failed:', err.message);
    res.json({ votes: [], fetched: new Date().toISOString(), source: 'Folketingets ODA-API', error: 'temporarily unavailable' });
  }
});

router.get('/parties', async (req, res) => {
  const cacheKey = 'oda:parties';
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  try {
    const url = `${ODA_BASE}/Aktør?$filter=typeid%20eq%205&$select=id,navn,gruppenavnkort,opdateringsdato&$top=50`;
    const data = await fetchJSON(url);

    const parties = (data.value || []).map(p => ({
      id: p.id,
      navn: p.navn,
      forkortelse: p.gruppenavnkort
    }));

    const result = {
      parties,
      fetched: new Date().toISOString(),
      source: 'Folketingets ODA-API'
    };

    cache.set(cacheKey, result, 24 * 3600);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  } catch (err) {
    console.warn('[oda] parties failed:', err.message);
    res.json({ parties: [], fetched: new Date().toISOString(), source: 'Folketingets ODA-API', error: 'temporarily unavailable' });
  }
});

router.get('/recent-bills', async (req, res) => {
  const topic = req.query.topic || '';
  const cacheKey = `oda:recent-bills:${topic}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  try {
    let filter = "typeid%20eq%203";
    if (topic) {
      const safeTopic = topic.replace(/[^a-zæøåA-ZÆØÅ0-9\s-]/g, '').slice(0, 50);
      if (safeTopic) {
        filter += `%20and%20substringof('${encodeURIComponent(safeTopic)}',titel)`;
      }
    }

    const url = `${ODA_BASE}/Sag?$filter=${filter}&$top=10&$orderby=opdateringsdato%20desc&$select=id,nummer,titel,statusid,opdateringsdato`;
    const data = await fetchJSON(url);

    const bills = (data.value || []).map(s => ({
      id: s.id,
      nummer: s.nummer,
      titel: s.titel,
      opdateret: s.opdateringsdato,
      url: `https://www.ft.dk/samling/sag/${s.id}`
    }));

    const result = {
      bills,
      topic,
      fetched: new Date().toISOString(),
      source: 'Folketingets ODA-API'
    };

    cache.set(cacheKey, result, CACHE_TTL);
    res.setHeader('X-Cache', 'MISS');
    res.json(result);
  } catch (err) {
    console.warn('[oda] recent-bills failed:', err.message);
    res.json({ bills: [], topic, fetched: new Date().toISOString(), source: 'Folketingets ODA-API', error: 'temporarily unavailable' });
  }
});

export default router;
