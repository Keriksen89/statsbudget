import { Router } from 'express';
import * as cache from '../lib/cache.js';
import { fetchJSON } from '../lib/fetch.js';

const router = Router();
const DST_BASE = 'https://api.statbank.dk/v1';

const CACHE_TTL = {
  meta: 24 * 3600,
  data: 6 * 3600,
  default: 3600
};

router.post('/data/:tableId', async (req, res, next) => {
  try {
    const { tableId } = req.params;
    if (!/^[A-Z0-9_]{2,40}$/i.test(tableId)) {
      return res.status(400).json({ error: 'Invalid table ID' });
    }

    const cacheKey = `dst:data:${tableId}:${JSON.stringify(req.body)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const body = {
      table: tableId,
      format: 'JSONSTAT',
      ...req.body
    };

    const data = await fetchJSON(`${DST_BASE}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    cache.set(cacheKey, data, CACHE_TTL.data);
    res.setHeader('X-Cache', 'MISS');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/tableinfo/:tableId', async (req, res, next) => {
  try {
    const { tableId } = req.params;
    if (!/^[A-Z0-9_]{2,40}$/i.test(tableId)) {
      return res.status(400).json({ error: 'Invalid table ID' });
    }

    const cacheKey = `dst:meta:${tableId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const data = await fetchJSON(`${DST_BASE}/tableinfo/${tableId}?format=JSON&lang=da`);
    cache.set(cacheKey, data, CACHE_TTL.meta);
    res.setHeader('X-Cache', 'MISS');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/keyfigures', async (req, res, next) => {
  try {
    const cacheKey = 'dst:keyfigures';
    const cached = cache.get(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const result = await Promise.allSettled([
      fetchJSON(`${DST_BASE}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'FOLK1A', format: 'JSONSTAT',
          variables: [{ code: 'Tid', values: ['>=2024K1'] }]
        })
      }).catch(() => null),
      fetchJSON(`${DST_BASE}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'NKN1', format: 'JSONSTAT',
          variables: [{ code: 'Tid', values: ['>=2024K1'] }]
        })
      }).catch(() => null),
      fetchJSON(`${DST_BASE}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'AULAAR', format: 'JSONSTAT',
          variables: [{ code: 'Tid', values: ['>=2023'] }]
        })
      }).catch(() => null)
    ]);

    const out = {
      population: extractLatest(result[0]),
      gdp: extractLatest(result[1]),
      unemployment: extractLatest(result[2]),
      fetched: new Date().toISOString(),
      sources: {
        population: 'DST FOLK1A',
        gdp: 'DST NKN1',
        unemployment: 'DST AULAAR'
      }
    };

    cache.set(cacheKey, out, CACHE_TTL.data);
    res.setHeader('X-Cache', 'MISS');
    res.json(out);
  } catch (err) {
    next(err);
  }
});

router.get('/_stats', (req, res) => {
  res.json(cache.getStats());
});

function extractLatest(settledResult) {
  if (!settledResult || settledResult.status !== 'fulfilled' || !settledResult.value) return null;
  const data = settledResult.value;
  try {
    const dataset = data.dataset || data;
    const values = dataset.value || [];
    if (!values.length) return null;
    const timeDim = (dataset.dimension && dataset.dimension.Tid) || null;
    const timeIndex = timeDim ? timeDim.category.index : {};
    const labels = timeDim ? timeDim.category.label : {};
    const sortedKeys = Object.entries(timeIndex)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
    const latestKey = sortedKeys[0];
    if (!latestKey) return null;
    const latestIdx = timeIndex[latestKey];
    return {
      period: labels[latestKey] || latestKey,
      value: values[latestIdx]
    };
  } catch {
    return null;
  }
}

export default router;
