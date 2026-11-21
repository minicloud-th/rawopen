import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBackend } from '../worker/backend-runtime.js';
import { marketplaceRequest } from '../worker/marketplace-http.js';

let backend;
before(async () => {
  backend = await createBackend(
    new WebAssembly.Module(readFileSync(new URL('../worker/generated/api.wasm', import.meta.url))),
    new WebAssembly.Module(readFileSync(new URL('../worker/generated/money.wasm', import.meta.url))),
    JSON.parse(readFileSync(new URL('../shared/catalog.json', import.meta.url), 'utf8')),
  );
});
after(async () => { await backend?.close(); });
function request(path, body, headers = {}) {
  return new Request(`https://market.test${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { ...(body === undefined ? {} : { Origin: 'https://market.test', 'Content-Type': 'application/json' }), ...headers }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) });
}
const call = (path, body, headers) => marketplaceRequest(request(path, body, headers), backend);
test('real compiled Go calls real Rust and reports a working engine', async () => {
  const response = await call('/api/runtime');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-OpenCraft-API'), 'Go');
  assert.equal(response.headers.get('X-OpenCraft-Engine'), 'Rust-Wasm');
  assert.deepEqual(await response.json(), { api: 'Go', currency: 'THB', engine: 'Rust/Wasm', engineCheck: 258000, paymentsEnabled: false, transport: 'Cloudflare Worker' });
});
test('Go searches Thai catalog text and validates filters', async () => {
  const thai = await (await call('/api/catalog?q='+encodeURIComponent('หูฟัง'))).json();
  assert.deepEqual(thai.products.map(p => p.id), ['headphones']);
  const digital = await (await call('/api/catalog?filter=digital&sort=price-asc')).json();
  assert.deepEqual(digital.products.map(p => p.id), ['social', 'uikit']);
  assert.equal((await call('/api/catalog?category=unknown')).status, 400);
  assert.equal((await call('/api/catalog?sort=arbitrary')).status, 400);
});
test('quotes use server prices and Rust integer satang, rejecting client prices', async () => {
  const quote = await (await call('/api/quote', { items: [{ id: 'headphones', quantity: 2 }, { id: 'uikit', quantity: 1 }] })).json();
  assert.equal(quote.totalSatang, 297000);
  assert.equal(quote.items[0].unitSatang, 129000);
  assert.equal(quote.checkoutEnabled, false);
  for (const body of [
    { items: [{ id: 'headphones', quantity: 1, price: 1 }] },
    { items: [{ id: 'headphones', quantity: 10 }] },
    { items: [{ id: 'headphones', quantity: 0 }] },
    { items: [{ id: 'uikit', quantity: 2 }] },
    { items: [{ id: 'missing', quantity: 1 }] },
    { items: [{ id: 'headphones', quantity: 1 }, { id: 'headphones', quantity: 1 }] },
  ]) assert.equal((await call('/api/quote', body)).status, 400, JSON.stringify(body));
});
test('Rust validates top-up decimal input without creating payments', async () => {
  for (const [amount, cents] of [['0.29', 29], ['250.50', 25050], ['1000', 100000]]) {
    const response = await call('/api/topup/preview', { amount, method: 'promptpay' });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { amountSatang: cents, currency: 'THB', method: 'promptpay', paymentsEnabled: false });
  }
  for (const amount of ['0', '-1', '1e3', '.5', '1.001', '90071992547409.92']) assert.equal((await call('/api/topup/preview', { amount, method: 'card' })).status, 400);
  assert.equal((await call('/api/topup/preview', { amount: '100', method: 'unknown' })).status, 400);
});
test('HTTP boundary rejects cross-site writes, oversized streams and invalid JSON', async () => {
  assert.equal((await call('/api/quote', { items: [] }, { Origin: 'https://evil.test' })).status, 403);
  assert.equal((await call('/api/quote', { items: [] }, { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await call('/api/quote', '{broken')).status, 400);
  assert.equal((await call('/api/quote', 'x'.repeat(32769))).status, 413);
  assert.equal((await marketplaceRequest(new Request('https://market.test/api/quote', { method: 'DELETE' }), backend)).status, 405);
  assert.equal((await call('/api/missing')).status, 404);
});
test('independent concurrent requests cannot mix their quote amounts', async () => {
  const responses = await Promise.all(Array.from({ length: 30 }, (_, i) => call('/api/topup/preview', { amount: `${i+1}.29`, method: 'card' })));
  const bodies = await Promise.all(responses.map(r => r.json()));
  assert.deepEqual(bodies.map(b => b.amountSatang), Array.from({ length: 30 }, (_, i) => (i+1)*100+29));
});
