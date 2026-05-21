export async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'VirtuelRegering/1.0 (+https://github.com/virtuelregering)',
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const err = new Error(`Upstream ${response.status}: ${text.slice(0, 200)}`);
      err.status = response.status >= 500 ? 502 : response.status;
      throw err;
    }

    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error(`Upstream timeout after ${timeoutMs}ms`);
      e.status = 504;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchJSON(url, options = {}, timeoutMs = 15000) {
  const res = await fetchWithTimeout(url, options, timeoutMs);
  return res.json();
}
