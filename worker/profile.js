import { normalizeProfile } from '../shared/profile-schema.js';
import { readAccountAccess } from './account-access.js';

// Public Firebase project configuration. Credentials remain in Authorization headers only.
const FIREBASE_KEY = 'AIzaSyBMrOFSeAkK7NI9FRmjGrmbcvNG7buEU-s';
const PROJECT = 'opencraft-oauth';
const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Vary': 'Authorization', 'X-Content-Type-Options': 'nosniff' } });

export async function identifyMember(request, fetcher = fetch) {
  const bearer = request.headers.get('Authorization') || '';
  if (!bearer.startsWith('Bearer ') || bearer.length > 8192) return null;
  const idToken = bearer.slice(7);
  let claims;
  try {
    const part = idToken.split('.')[1];
    claims = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    if (claims.aud !== PROJECT || claims.iss !== `https://securetoken.google.com/${PROJECT}` || typeof claims.sub !== 'string' || claims.sub.length > 128 || !claims.sub || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) return null;
  } catch { return null; }
  // The Auth API validates the ID token; decoded claims above are never trusted by themselves.
  const response = await fetcher(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }), signal: AbortSignal.timeout(10000),
  });
  if (response.status >= 500 || response.status === 429) throw new Error('auth-unavailable');
  if (!response.ok) return null;
  const record = (await response.json()).users?.[0];
  if (!record || record.disabled || record.localId !== claims.sub) return null;
  if (record.validSince && (!Number.isFinite(claims.auth_time) || claims.auth_time < Number(record.validSince))) return null;
  return record;
}

export async function profileRequest(request, env, fetcher = fetch) {
  if (!['GET', 'PUT'].includes(request.method)) return json({ error: 'method-not-allowed' }, 405);
  if (request.method === 'PUT' && (request.headers.get('Origin') !== new URL(request.url).origin || request.headers.get('Sec-Fetch-Site') === 'cross-site')) return json({ error: 'invalid-origin' }, 403);
  let member;
  try { member = await identifyMember(request, fetcher); } catch { return json({ error: 'auth-unavailable' }, 503); }
  if (!member) return json({ error: 'unauthorized' }, 401);
  const uid = member.localId;
  if (!env.DB) return json({ error: 'profile-unavailable' }, 503);
  try {
    if (!(await readAccountAccess(member,env)).access.eligible) return json({error:'account-approval-required'},403);
    if (request.method === 'GET') {
      const row = await env.DB.prepare('SELECT display_name, goal, interests, completed_at FROM member_profiles WHERE uid = ?').bind(uid).first();
      return json({ profile: row ? { displayName: row.display_name, goal: row.goal, interests: JSON.parse(row.interests), completedAt: row.completed_at } : null });
    }
    if (!request.headers.get('Content-Type')?.includes('application/json')) return json({ error: 'invalid-body' }, 415);
    // Bound the streamed body, including chunked requests without Content-Length.
    const reader = request.body?.getReader();
    let size = 0, body = '';
    if (!reader) return json({ error: 'invalid-body' }, 400);
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.length;
      if (size > 4096) { await reader.cancel(); return json({ error: 'body-too-large' }, 413); }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    let profile;
    try { profile = normalizeProfile(JSON.parse(body)); } catch { return json({ error: 'invalid-profile' }, 400); }
    if (!profile) return json({ error: 'invalid-profile' }, 400);
    const now = new Date().toISOString();
    await env.DB.prepare('INSERT INTO member_profiles (uid, display_name, goal, interests, completed_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(uid) DO UPDATE SET display_name = excluded.display_name, goal = excluded.goal, interests = excluded.interests, updated_at = excluded.updated_at').bind(uid, profile.displayName, profile.goal, JSON.stringify(profile.interests), now, now).run();
    return json({ profile: { ...profile, completedAt: now } });
  } catch { return json({ error: 'profile-unavailable' }, 503); }
}
