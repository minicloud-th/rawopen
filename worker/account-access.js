import { accountAccess } from '../shared/policy.js';
export function memberClaims(member) {
  try { const value = JSON.parse(member.customAttributes || '{}'); return value && typeof value === 'object' ? value : {}; } catch { return {}; }
}
export async function readAccountAccess(member, env) {
  if (!env.DB) throw new Error('database-unavailable');
  const row = await env.DB.prepare('SELECT content FROM member_agreements WHERE uid = ?').bind(member.localId).first();
  const agreement = row ? JSON.parse(row.content) : null;
  return { agreement, access: accountAccess(agreement, memberClaims(member)) };
}
export async function readBoundJson(request, maximum = 8192) {
  if (!request.headers.get('Content-Type')?.includes('application/json')) throw new Error('invalid-body');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid-body');
  let size = 0, text = ''; const decoder = new TextDecoder();
  while (true) { const { value, done } = await reader.read(); if (done) break; size += value.byteLength; if (size > maximum) { await reader.cancel(); throw new Error('body-too-large'); } text += decoder.decode(value, {stream:true}); }
  return JSON.parse(text + decoder.decode());
}
export const privateJson = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control':'no-store', 'Vary':'Authorization', 'X-Content-Type-Options':'nosniff' } });
export const sameOrigin = request => request.headers.get('Origin') === new URL(request.url).origin && request.headers.get('Sec-Fetch-Site') !== 'cross-site';
