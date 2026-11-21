const encoder = new TextEncoder();
const project = 'opencraft-oauth';
const endpoints = {
  discord: { authorize: 'https://discord.com/oauth2/authorize', token: 'https://discord.com/api/oauth2/token', profile: 'https://discord.com/api/v10/users/@me', scope: 'identify', id: 'DISCORD_CLIENT_ID', secret: 'DISCORD_CLIENT_SECRET' },
  line: { authorize: 'https://access.line.me/oauth2/v2.1/authorize', token: 'https://api.line.me/oauth2/v2.1/token', profile: 'https://api.line.me/v2/profile', scope: 'profile', id: 'LINE_CHANNEL_ID', secret: 'LINE_CHANNEL_SECRET' },
};
const noStore = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' };
const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers: { ...noStore, ...headers } });
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
const un64 = text => Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), ch => ch.charCodeAt(0));
const random = () => b64(crypto.getRandomValues(new Uint8Array(32)));
const ready = (env, provider) => { const p = endpoints[provider]; return !!(p && env[p.id] && env[p.secret] && env.AUTH_STATE_SECRET?.length >= 32 && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY); };
const cookieName = (url, name) => `${url.protocol === 'https:' ? '__Host-' : ''}oc-${name}`;
function cookie(url, name, value, age = 600) { return `${cookieName(url, name)}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${age}${url.protocol === 'https:' ? '; Secure' : ''}`; }
function readCookie(request, url, name) {
  const entries = (request.headers.get('Cookie') || '').split(';').map(v => v.trim()).filter(v => v.startsWith(cookieName(url, name) + '='));
  return entries.length === 1 ? entries[0].slice(entries[0].indexOf('=') + 1) : '';
}
async function encryptionKey(secret) {
  return crypto.subtle.importKey('raw', await crypto.subtle.digest('SHA-256', encoder.encode(secret)), 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function seal(value, secret, purpose) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const body = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(purpose) }, await encryptionKey(secret), encoder.encode(JSON.stringify(value)));
  return `${b64(iv)}.${b64(body)}`;
}
async function unseal(value, secret, purpose) {
  const parts = value.split('.'); if (parts.length !== 2) throw new Error('invalid-state');
  const body = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: un64(parts[0]), additionalData: encoder.encode(purpose) }, await encryptionKey(secret), un64(parts[1]));
  const result = JSON.parse(new TextDecoder().decode(body));
  if (!Number.isFinite(result.expires) || result.expires < Date.now()) throw new Error('expired-state');
  return result;
}
function sameOrigin(request, url, requireOrigin = false) {
  const origin = request.headers.get('Origin');
  return (!requireOrigin || origin === url.origin) && (!origin || origin === url.origin) && request.headers.get('Sec-Fetch-Site') !== 'cross-site';
}
function redirect(url, target, cookies = []) {
  const headers = new Headers({ ...noStore, Location: new URL(target, url).href });
  cookies.forEach(value => headers.append('Set-Cookie', value));
  return new Response(null, { status: 303, headers });
}
async function customToken(uid, provider, env) {
  if (!env.FIREBASE_CLIENT_EMAIL.endsWith(`@${project}.iam.gserviceaccount.com`)) throw new Error('service-account-project');
  const pem = env.FIREBASE_PRIVATE_KEY.replaceAll('\\n', '\n').replace(/-----[A-Z ]+-----|\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', un64(pem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const now = Math.floor(Date.now() / 1000);
  const header = b64(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = b64(encoder.encode(JSON.stringify({ iss: env.FIREBASE_CLIENT_EMAIL, sub: env.FIREBASE_CLIENT_EMAIL, aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit', iat: now, exp: now + 120, uid, claims: { opencraft_provider: provider } })));
  const message = `${header}.${payload}`;
  return `${message}.${b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(message)))}`;
}

// This module only establishes Firebase identity. Future marketplace APIs must
// independently verify Firebase ID tokens and authorize user-owned operations.
export async function authRequest(request, env, fetcher = fetch) {
  const url = new URL(request.url);
  if (url.pathname === '/api/auth/providers' && request.method === 'GET') return json({ discord: ready(env, 'discord'), line: ready(env, 'line') });
  if (url.pathname === '/api/auth/complete') {
    if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405, { Allow: 'POST' });
    if (!sameOrigin(request, url, true)) return json({ error: 'invalid-origin' }, 403);
    try {
      const result = await unseal(readCookie(request, url, 'handoff'), env.AUTH_STATE_SECRET, 'handoff');
      return json({ token: result.token, displayName: result.displayName }, 200, { 'Set-Cookie': cookie(url, 'handoff', '', 0) });
    } catch { return json({ error: 'session-expired' }, 401, { 'Set-Cookie': cookie(url, 'handoff', '', 0) }); }
  }
  const match = url.pathname.match(/^\/api\/auth\/(discord|line)\/(start|callback)$/);
  if (!match) return json({ error: 'not-found' }, 404);
  if (request.method !== 'GET') return json({ error: 'method-not-allowed' }, 405, { Allow: 'GET' });
  const [, provider, action] = match, p = endpoints[provider];
  if (!ready(env, provider)) return action === 'start' ? redirect(url, '/signup?authError=provider-not-configured') : json({ error: 'provider-not-configured' }, 503);
  const callback = `${url.origin}/api/auth/${provider}/callback`;
  if (action === 'start') {
    if (!sameOrigin(request, url)) return json({ error: 'invalid-origin' }, 403);
    const state = random(), verifier = random();
    const saved = await seal({ state, verifier, provider, origin: url.origin, expires: Date.now() + 600_000 }, env.AUTH_STATE_SECRET, provider);
    const target = new URL(p.authorize);
    target.search = new URLSearchParams({ client_id: env[p.id], redirect_uri: callback, response_type: 'code', scope: p.scope, state, code_challenge: b64(await crypto.subtle.digest('SHA-256', encoder.encode(verifier))), code_challenge_method: 'S256' }).toString();
    return redirect(url, target.href, [cookie(url, `oauth-${provider}`, saved)]);
  }
  const clear = cookie(url, `oauth-${provider}`, '', 0);
  try {
    const saved = await unseal(readCookie(request, url, `oauth-${provider}`), env.AUTH_STATE_SECRET, provider);
    if (saved.provider !== provider || saved.origin !== url.origin || saved.state !== url.searchParams.get('state')) throw new Error('invalid-state');
    if (url.searchParams.has('error')) return redirect(url, '/signup?authError=oauth-cancelled', [clear]);
    const code = url.searchParams.get('code'); if (!code || code.length > 2048) throw new Error('invalid-code');
    const tokenResponse = await fetcher(p.token, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: callback, client_id: env[p.id], client_secret: env[p.secret], code_verifier: saved.verifier }), signal: AbortSignal.timeout(10_000) });
    if (!tokenResponse.ok) throw new Error('token-failed');
    const tokens = await tokenResponse.json(); if (typeof tokens.access_token !== 'string') throw new Error('token-failed');
    const profileResponse = await fetcher(p.profile, { headers: { Authorization: `Bearer ${tokens.access_token}` }, signal: AbortSignal.timeout(10_000) });
    if (!profileResponse.ok) throw new Error('profile-failed');
    const profile = await profileResponse.json();
    const id = provider === 'discord' ? profile.id : profile.userId;
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error('profile-failed');
    // Provider IDs are namespaced. Email addresses never implicitly link accounts.
    const token = await customToken(`${provider}:${id}`, provider, env);
    const displayName = String(provider === 'discord' ? profile.global_name || profile.username || 'สมาชิก OpenCraft' : profile.displayName || 'สมาชิก OpenCraft').slice(0, 80);
    const handoff = await seal({ token, displayName, expires: Date.now() + 60_000 }, env.AUTH_STATE_SECRET, 'handoff');
    return redirect(url, '/account?oauth=complete', [clear, cookie(url, 'handoff', handoff, 60)]);
  } catch { return redirect(url, '/signup?authError=oauth-failed', [clear]); }
}
