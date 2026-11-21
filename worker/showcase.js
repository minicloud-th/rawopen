import { identifyMember } from './profile.js';
import { normalizeShowcase } from '../shared/showcase-schema.js';
import { readAccountAccess } from './account-access.js';

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'Vary': 'Authorization', 'X-Content-Type-Options': 'nosniff' } });

export async function showcaseRequest(request, env, fetcher = fetch) {
  if (!['GET', 'PUT'].includes(request.method)) return json({ error: 'method-not-allowed' }, 405);
  if (request.method === 'PUT' && (request.headers.get('Origin') !== new URL(request.url).origin || request.headers.get('Sec-Fetch-Site') === 'cross-site')) return json({ error: 'invalid-origin' }, 403);
  let member;
  try { member = await identifyMember(request, fetcher); } catch { return json({ error: 'auth-unavailable' }, 503); }
  if (!member) return json({ error: 'unauthorized' }, 401);
  if (!env.DB) return json({ error: 'profile-unavailable' }, 503);
  try {
    const {access} = await readAccountAccess(member,env);
    if (!access.eligible) return json({error:'account-approval-required'},403);
    const row = await env.DB.prepare('SELECT content FROM member_showcases WHERE uid = ?').bind(member.localId).first();
    const showcase = row ? JSON.parse(row.content) : { displayName: member.displayName || '', bio: '', photoURL: member.photoUrl || '', storeName: '', storeBio: '', works: [] };
    let custom = {};
    try { custom = JSON.parse(member.customAttributes || '{}'); } catch { custom = {}; }
    const security = { emailVerified: member.emailVerified === true, mfaEnabled: Array.isArray(member.mfaInfo) && member.mfaInfo.length > 0, sellerApproved: access.sellerApproved, storeVerified: access.storeVerified };
    const visibleShowcase = value => access.sellerApproved ? value : {...value,storeName:'',storeBio:'',works:[]};
    if (request.method === 'GET') return json({ showcase:visibleShowcase(showcase), security });
    if (!request.headers.get('Content-Type')?.includes('application/json')) return json({ error: 'invalid-body' }, 415);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'invalid-body' }, 400);
    let size = 0, body = '';
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 24_576) { await reader.cancel(); return json({ error: 'body-too-large' }, 413); }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    let next;
    try { next = normalizeShowcase(JSON.parse(body)); } catch { return json({ error: 'invalid-profile' }, 400); }
    if (!next) return json({ error: 'invalid-profile' }, 400);
    if (!access.sellerApproved) {
      if (next.storeName || next.storeBio || next.works.length) return json({error:'seller-approval-required'},403);
      next = {...next,storeName:showcase.storeName,storeBio:showcase.storeBio,works:showcase.works};
    }
    const updatedAt = new Date().toISOString();
    await env.DB.prepare('INSERT INTO member_showcases (uid, content, updated_at) VALUES (?, ?, ?) ON CONFLICT(uid) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at').bind(member.localId, JSON.stringify(next), updatedAt).run();
    return json({ showcase: visibleShowcase(next), security });
  } catch { return json({ error: 'profile-unavailable' }, 503); }
}
