const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-OpenCraft-API': 'Go', 'X-OpenCraft-Engine': 'Rust-Wasm' };
const json = (body, status) => new Response(JSON.stringify(body), { status, headers });
export async function marketplaceRequest(request, backend) {
  const url = new URL(request.url);
  let body = '';
  if (request.method === 'POST') {
    if (request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({ error: 'invalid-origin' }, 403);
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return json({ error: 'invalid-body' }, 415);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'invalid-body' }, 400);
    const decoder = new TextDecoder();
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 32768) { await reader.cancel(); return json({ error: 'body-too-large' }, 413); }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  }
  try {
    const response = backend.handle({ method: request.method, path: url.pathname, query: Object.fromEntries(url.searchParams), body });
    return json(response.body, response.status);
  } catch { return json({ error: 'api-unavailable' }, 503); }
}
