import { identifyMember } from './profile.js';
import { readAccountAccess, readBoundJson, privateJson as json, sameOrigin } from './account-access.js';
import { normalizeAgreement, normalizeSellerApplication, POLICY_VERSION } from '../shared/policy.js';

export async function memberLegalRequest(request, env, fetcher = fetch) {
  const path = new URL(request.url).pathname;
  if (!['GET','PUT','POST'].includes(request.method)) return json({error:'method-not-allowed'},405);
  if (request.method !== 'GET' && !sameOrigin(request)) return json({error:'invalid-origin'},403);
  let member;
  try { member = await identifyMember(request,fetcher); } catch { return json({error:'auth-unavailable'},503); }
  if (!member) return json({error:'unauthorized'},401);
  if (!env.DB) return json({error:'unavailable'},503);
  try {
    const {agreement,access} = await readAccountAccess(member,env);
    if (path === '/api/agreements') {
      if (request.method === 'GET') return json({ access, version:POLICY_VERSION, acceptedAt:agreement?.acceptedAt || null });
      if (request.method !== 'PUT') return json({error:'method-not-allowed'},405);
      let value; try { value = normalizeAgreement(await readBoundJson(request)); } catch { return json({error:'invalid-agreement'},400); }
      if (!value) return json({error:'invalid-agreement'},400);
      if (agreement && agreement.birthDate !== value.birthDate) return json({error:'age-change-requires-review'},409);
      if (access.current) return json({access,version:POLICY_VERSION,acceptedAt:agreement.acceptedAt});
      const next = {...value,id:crypto.randomUUID(),acceptedAt:new Date().toISOString()};
      // The current record and immutable version event are committed together.
      await env.DB.batch([
        env.DB.prepare('INSERT INTO member_agreements (uid, content) VALUES (?, ?) ON CONFLICT(uid) DO UPDATE SET content = excluded.content').bind(member.localId,JSON.stringify(next)),
        env.DB.prepare('INSERT INTO policy_events (id, uid, content, recorded_at) VALUES (?, ?, ?, ?)').bind(next.id,member.localId,JSON.stringify(next),next.acceptedAt),
      ]);
      const result = await readAccountAccess(member,env);
      return json({access:result.access,version:POLICY_VERSION,acceptedAt:next.acceptedAt});
    }
    if (path === '/api/seller-application') {
      if (!access.eligible) return json({error:'account-approval-required'},403);
      if (request.method === 'GET') {
        const row = await env.DB.prepare('SELECT content, submitted_at FROM seller_applications WHERE uid = ?').bind(member.localId).first();
        return json({application:row?{...JSON.parse(row.content),status:access.sellerApproved?'approved':'pending_review',submittedAt:row.submitted_at}:null,approved:access.sellerApproved});
      }
      if (request.method !== 'POST') return json({error:'method-not-allowed'},405);
      let value; try { value = normalizeSellerApplication(await readBoundJson(request),access.age); } catch { return json({error:'invalid-application'},400); }
      if (!value) return json({error:'invalid-application'},400);
      if (!member.emailVerified) return json({error:'verified-email-required'},403);
      const now = new Date().toISOString();
      // User input never grants seller, KYC, guardian, bank or verification status.
      await env.DB.batch([
        env.DB.prepare('INSERT INTO seller_applications (uid, content, submitted_at) VALUES (?, ?, ?) ON CONFLICT(uid) DO UPDATE SET content = excluded.content, submitted_at = excluded.submitted_at').bind(member.localId,JSON.stringify(value),now),
        env.DB.prepare('INSERT INTO policy_events (id, uid, content, recorded_at) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(),member.localId,JSON.stringify({kind:'seller-terms',...value,acceptedAt:now}),now),
      ]);
      return json({application:{...value,status:'pending_review',submittedAt:now},approved:access.sellerApproved});
    }
    if (path === '/api/support') {
      if (request.method !== 'POST') return json({error:'method-not-allowed'},405);
      let value; try {value=await readBoundJson(request);} catch {return json({error:'invalid-request'},400);}
      if (!['privacy','guardian','seller','complaint','account'].includes(value?.topic) || typeof value.message !== 'string' || value.message.trim().length < 10 || value.message.length > 2000) return json({error:'invalid-request'},400);
      const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM support_requests WHERE uid = ? AND julianday(created_at) > julianday('now', '-1 day')").bind(member.localId).first();
      if (Number(count?.n) >= 5) return json({error:'daily-limit'},429);
      const id=crypto.randomUUID(),now=new Date().toISOString();
      await env.DB.prepare('INSERT INTO support_requests (id, uid, topic, message, created_at) VALUES (?, ?, ?, ?, ?)').bind(id,member.localId,value.topic,value.message.trim(),now).run();
      return json({ticket:id,createdAt:now},201);
    }
    return json({error:'not-found'},404);
  } catch {return json({error:'service-unavailable'},503);}
}
