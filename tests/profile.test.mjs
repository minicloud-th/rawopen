import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { profileRequest } from '../worker/profile.js';
import { normalizeProfile } from '../shared/profile-schema.js';
import { readFileSync,readdirSync } from 'node:fs';
import {POLICY_VERSION} from '../shared/policy.js';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(file=>file.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
  for(const uid of ['alice','bob']) sqlite.prepare('INSERT INTO member_agreements (uid,content) VALUES (?,?)').run(uid,JSON.stringify({id:'fixture-'+uid,birthDate:'2000-01-01',acceptedTerms:true,acknowledgedPrivacy:true,termsVersion:POLICY_VERSION,privacyVersion:POLICY_VERSION}));
  return { sqlite, DB: { prepare(sql) { return { bind(...params) { return { first: async () => sqlite.prepare(sql).get(...params) || null, run: async () => sqlite.prepare(sql).run(...params) }; } }; } } };
}
function token(uid = 'alice', extra = {}) {
  const claims = { aud: 'opencraft-oauth', iss: 'https://securetoken.google.com/opencraft-oauth', sub: uid, exp: Math.floor(Date.now() / 1000) + 3600, auth_time: Math.floor(Date.now() / 1000), ...extra };
  return ['header', Buffer.from(JSON.stringify(claims)).toString('base64url'), 'test-signature'].join('.');
}
function request(method = 'GET', uid = 'alice', body, extra = {}) {
  return new Request('https://market.test/api/profile', { method, headers: { Authorization: `Bearer ${token(uid)}`, ...(method === 'PUT' ? { Origin: 'https://market.test', 'Content-Type': 'application/json' } : {}), ...extra }, ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }) });
}
const answers = { displayName: 'Alice', goal: 'buyer', interests: ['digital', 'design'] };
const lookup = async (_url, options) => {
  const uid = JSON.parse(Buffer.from(JSON.parse(options.body).idToken.split('.')[1], 'base64url').toString()).sub;
  return Response.json({ users: [{ localId: uid, disabled: false, validSince: String(Math.floor(Date.now() / 1000) - 60) }] });
};
test('unauthenticated, expired and wrong-project requests never reach member data', async () => {
  const { DB } = database(); let called = false;
  const denied = async () => { called = true; throw new Error(); };
  assert.equal((await profileRequest(new Request('https://market.test/api/profile'), { DB }, denied)).status, 401);
  for (const extra of [{ exp: 1 }, { aud: 'other-project' }, { iss: 'https://bad.test' }]) {
    assert.equal((await profileRequest(new Request('https://market.test/api/profile', { headers: { Authorization: `Bearer ${token('alice', extra)}` } }), { DB }, denied)).status, 401);
  }
  assert.equal(called, false);
});
test('a locally decoded token is insufficient without Firebase accepting it', async () => {
  const { DB } = database();
  assert.equal((await profileRequest(request(), { DB }, async () => Response.json({ error: {} }, { status: 400 }))).status, 401);
  assert.equal((await profileRequest(request(), { DB }, async () => Response.json({ users: [{ localId: 'someone-else' }] }))).status, 401);
  assert.equal((await profileRequest(request(), { DB }, async () => Response.json({ users: [{ localId: 'alice', disabled: true }] }))).status, 401);
});
test('profile is absent until saved, durable, scoped by verified uid and repeatable', async () => {
  const { DB } = database();
  assert.equal((await (await profileRequest(request(), { DB }, lookup)).json()).profile, null);
  assert.equal((await profileRequest(request('PUT', 'alice', { ...answers, uid: 'bob' }), { DB }, lookup)).status, 200);
  const alice = await (await profileRequest(request(), { DB }, lookup)).json();
  assert.equal(alice.profile.displayName, 'Alice');
  assert.deepEqual(alice.profile.interests, answers.interests);
  assert.equal((await (await profileRequest(request('GET', 'bob'), { DB }, lookup)).json()).profile, null);
  await profileRequest(request('PUT', 'alice', { ...answers, displayName: 'New name' }), { DB }, lookup);
  assert.equal((await (await profileRequest(request(), { DB }, lookup)).json()).profile.displayName, 'New name');
});
test('cross-site writes and unsupported methods are rejected', async () => {
  const { DB } = database();
  assert.equal((await profileRequest(request('PUT', 'alice', answers, { Origin: 'https://evil.test' }), { DB }, lookup)).status, 403);
  assert.equal((await profileRequest(request('PUT', 'alice', answers, { 'Sec-Fetch-Site': 'cross-site' }), { DB }, lookup)).status, 403);
  assert.equal((await profileRequest(request('DELETE'), { DB }, lookup)).status, 405);
});
test('answers are validated and oversized/chunked bodies do not write', async () => {
  const { DB } = database();
  for (const body of [{ ...answers, displayName: 'x' }, { ...answers, goal: 'admin' }, { ...answers, interests: [] }, { ...answers, interests: ['unknown'] }, '{invalid']) {
    assert.equal((await profileRequest(request('PUT', 'alice', body), { DB }, lookup)).status, 400);
  }
  assert.equal((await profileRequest(request('PUT', 'alice', 'x'.repeat(5000)), { DB }, lookup)).status, 413);
  assert.equal((await profileRequest(request('PUT', 'alice', answers, { 'Content-Type': 'text/plain' }), { DB }, lookup)).status, 415);
  assert.equal((await (await profileRequest(request(), { DB }, lookup)).json()).profile, null);
});
test('outages fail closed and member responses are never cacheable', async () => {
  const { DB } = database();
  assert.equal((await profileRequest(request(), {}, lookup)).status, 503);
  assert.equal((await profileRequest(request(), { DB }, async () => { throw new Error('offline'); })).status, 503);
  const response = await profileRequest(request(), { DB }, lookup);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('vary'), 'Authorization');
  assert.equal(normalizeProfile({ ...answers, interests: ['digital', 'digital'] }).interests.length, 1);
});
