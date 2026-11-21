import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authRequest } from '../worker/auth.js';

const origin = 'https://opencraft-market.kawertyff-2.chatgpt.site';
const bytes64 = bytes => Buffer.from(bytes).toString('base64url');
const envPromise = (async () => {
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  return { pair, env: { AUTH_STATE_SECRET: bytes64(crypto.getRandomValues(new Uint8Array(32))), FIREBASE_CLIENT_EMAIL: 'test@opencraft-oauth.iam.gserviceaccount.com', FIREBASE_PRIVATE_KEY: `-----BEGIN PRIVATE KEY-----\n${Buffer.from(await crypto.subtle.exportKey('pkcs8', pair.privateKey)).toString('base64')}\n-----END PRIVATE KEY-----`, DISCORD_CLIENT_ID: 'test-discord', DISCORD_CLIENT_SECRET: 'test-discord-secret', LINE_CHANNEL_ID: 'test-line', LINE_CHANNEL_SECRET: 'test-line-secret' } };
})();

test('provider availability reflects missing server configuration', async () => {
  const response = await authRequest(new Request(origin + '/api/auth/providers'), {});
  assert.deepEqual(await response.json(), { discord: false, line: false });
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
});
test('unconfigured providers return to signup without making network calls', async () => {
  const response = await authRequest(new Request(origin + '/api/auth/discord/start'), {}, () => assert.fail('network called'));
  assert.equal(response.headers.get('Location'), origin + '/signup?authError=provider-not-configured');
});
test('cross-origin starts and session completion are rejected', async () => {
  const { env } = await envPromise;
  const response = await authRequest(new Request(origin + '/api/auth/discord/start', { headers: { Origin: 'https://attacker.example' } }), env);
  assert.equal(response.status, 403);
  const complete = await authRequest(new Request(origin + '/api/auth/complete', { method: 'POST', headers: { Origin: 'https://attacker.example' } }), env);
  assert.equal(complete.status, 403);
});
test('missing or tampered state cannot reach token exchange', async () => {
  const { env } = await envPromise;
  for (const cookie of ['', '__Host-oc-oauth-discord=invalid.tampered']) {
    const response = await authRequest(new Request(origin + '/api/auth/discord/callback?state=wrong&code=code', { headers: { Cookie: cookie } }), env, () => assert.fail('network called'));
    assert.equal(response.headers.get('Location'), origin + '/signup?authError=oauth-failed');
    assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
  }
});
for (const provider of ['discord', 'line']) test(`${provider} code + PKCE yields a correctly signed namespaced Firebase token`, async () => {
  const { env, pair } = await envPromise;
  const start = await authRequest(new Request(`${origin}/api/auth/${provider}/start`), env);
  const authorize = new URL(start.headers.get('Location'));
  assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
  const stateCookie = start.headers.get('Set-Cookie').split(';')[0];
  assert.match(start.headers.get('Set-Cookie'), /HttpOnly; Path=\/; SameSite=Lax; Max-Age=600; Secure/);
  let calls = 0;
  const callback = await authRequest(new Request(`${origin}/api/auth/${provider}/callback?code=test-code&state=${authorize.searchParams.get('state')}`, { headers: { Cookie: stateCookie } }), env, async (input, init) => {
    calls++;
    if (String(input).endsWith('/token')) {
      const body = new URLSearchParams(init.body);
      assert.equal(body.get('redirect_uri'), `${origin}/api/auth/${provider}/callback`);
      assert.equal(bytes64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body.get('code_verifier')))), authorize.searchParams.get('code_challenge'));
      return Response.json({ access_token: 'test-access-token' });
    }
    assert.equal(init.headers.Authorization, 'Bearer test-access-token');
    return Response.json(provider === 'discord' ? { id: '123456', global_name: 'Test User' } : { userId: 'U123456', displayName: 'Test User' });
  });
  assert.equal(calls, 2);
  assert.equal(callback.headers.get('Location'), origin + '/account?oauth=complete');
  const handoff = callback.headers.getSetCookie().find(value => value.startsWith('__Host-oc-handoff=')).split(';')[0];
  const complete = await authRequest(new Request(origin + '/api/auth/complete', { method: 'POST', headers: { Origin: origin, Cookie: handoff } }), env);
  assert.equal(complete.status, 200);
  const { token, displayName } = await complete.json();
  const [header, payload, signature] = token.split('.');
  assert.equal(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', pair.publicKey, Buffer.from(signature, 'base64url'), new TextEncoder().encode(`${header}.${payload}`)), true);
  const claims = JSON.parse(Buffer.from(payload, 'base64url'));
  assert.equal(claims.uid, `${provider}:${provider === 'discord' ? '123456' : 'U123456'}`);
  assert.equal(claims.exp - claims.iat, 120);
  assert.equal(claims.claims.opencraft_provider, provider);
  assert.equal(displayName, 'Test User');
  assert.match(complete.headers.get('Set-Cookie'), /Max-Age=0/);
});
test('a valid browser cookie with a mismatched state is rejected', async () => {
  const { env } = await envPromise;
  const start = await authRequest(new Request(origin + '/api/auth/line/start'), env);
  const response = await authRequest(new Request(origin + '/api/auth/line/callback?code=test&state=wrong', { headers: { Cookie: start.headers.get('Set-Cookie').split(';')[0] } }), env, () => assert.fail('network called'));
  assert.match(response.headers.get('Location'), /oauth-failed/);
});
test('handoff requires POST, a same-origin request and a valid encrypted cookie', async () => {
  const { env } = await envPromise;
  assert.equal((await authRequest(new Request(origin + '/api/auth/complete'), env)).status, 405);
  assert.equal((await authRequest(new Request(origin + '/api/auth/complete', { method: 'POST', headers: { Origin: origin } }), env)).status, 401);
});
