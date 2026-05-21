const cache = new Map();
const stats = { hits: 0, misses: 0, evictions: 0 };

const MAX_ENTRIES = 200;

export function get(key) {
  const entry = cache.get(key);
  if (!entry) {
    stats.misses++;
    return null;
  }
  if (Date.now() > entry.expires) {
    cache.delete(key);
    stats.misses++;
    return null;
  }
  stats.hits++;
  return entry.value;
}

export function set(key, value, ttlSeconds) {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) {
      cache.delete(oldest);
      stats.evictions++;
    }
  }
  cache.set(key, {
    value,
    expires: Date.now() + ttlSeconds * 1000
  });
}

export function getStats() {
  return { ...stats, size: cache.size };
}

export function clear() {
  cache.clear();
}
