import type { User } from 'firebase/auth';
export type MemberIdentity = { displayName: string | null; email: string | null; emailVerified: boolean; photoURL?: string | null };
export type MemberProfile = { displayName: string; goal: 'buyer' | 'seller' | 'both'; interests: string[]; completedAt: string };
export type ProfileAnswers = Omit<MemberProfile, 'completedAt'>;
export async function memberProfileRequest(user: User, answers?: ProfileAnswers, signal?: AbortSignal): Promise<MemberProfile | null> {
  const idToken = await user.getIdToken();
  const response = await fetch('/api/profile', { method: answers ? 'PUT' : 'GET', headers: { Authorization: `Bearer ${idToken}`, ...(answers ? { 'Content-Type': 'application/json' } : {}) }, ...(answers ? { body: JSON.stringify(answers) } : {}), signal });
  if (!response.ok) throw new Error(response.status === 401 ? 'กรุณาเข้าสู่ระบบใหม่ เซสชันของคุณหมดอายุแล้ว' : 'ยังบันทึกหรือโหลดข้อมูลไม่ได้ กรุณาลองอีกครั้ง');
  return (await response.json()).profile;
}
