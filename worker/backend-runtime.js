import Go from './generated/go-runtime.js';

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
export async function createBackend(goModule, rustModule, catalog) {
  const rust = new WebAssembly.Instance(rustModule, {});
  const unwrap = value => {
    if (typeof value !== 'bigint' || value < 0n || value > MAX_SAFE) throw new Error('invalid-money');
    return Number(value);
  };
  const integer = value => { if (!Number.isSafeInteger(value) || value < 0) throw new Error('invalid-money'); return BigInt(value); };
  const encoder = new TextEncoder();
  const money = {
    parse(value) {
      const bytes = encoder.encode(value);
      if (bytes.length > 128) throw new Error('invalid-money');
      new Uint8Array(rust.exports.memory.buffer, rust.exports.input_ptr(), bytes.length).set(bytes);
      return unwrap(rust.exports.parse_amount(bytes.length));
    },
    line(unit, quantity) { if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9) throw new Error('invalid-quantity'); return unwrap(rust.exports.line_total(integer(unit), quantity)); },
    add(left, right) { return unwrap(rust.exports.checked_add(integer(left), integer(right))); },
  };
  const go = new Go();
  go.argv = ['opencraft-api'];
  go.env = { GOMEMLIMIT: '64MiB' };
  let closed = false;
  go.exit = () => { closed = true; };
  const instance = new WebAssembly.Instance(goModule, go.importObject);
  const running = go.run(instance);
  void running.catch(() => { closed = true; });
  const start = globalThis.__opencraftGoStart;
  const handle = globalThis.__opencraftGoHandle;
  const stop = globalThis.__opencraftGoStop;
  delete globalThis.__opencraftGoStart;
  delete globalThis.__opencraftGoHandle;
  delete globalThis.__opencraftGoStop;
  if (typeof start !== 'function' || typeof handle !== 'function' || start(JSON.stringify(catalog), money) !== '') throw new Error('api-start-failed');
  return {
    handle(request) {
      if (closed) throw new Error('api-unavailable');
      const response = JSON.parse(handle(JSON.stringify(request)));
      if (!Number.isInteger(response.status) || response.status < 200 || response.status > 599) throw new Error('invalid-api-response');
      return response;
    },
    async close() { if (!closed && typeof stop === 'function') stop(); await running; },
  };
}
