import { useEffect, useState, type ReactNode } from 'react';
import { updateProfile, type User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { memberProfileRequest, type MemberProfile, type ProfileAnswers } from '@/lib/member-profile';
import { navigateAuth } from '@/lib/auth-navigation';
import OnboardingWizard from './onboarding-wizard';

export default function MemberGate({ user, onSignOut, children }: { user: User; onSignOut: () => void; children: (profile: MemberProfile) => ReactNode }) {
  const [state, setState] = useState<{ uid: string; profile: MemberProfile | null; loading: boolean; error: string }>({ uid: user.uid, profile: null, loading: true, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ uid: user.uid, profile: null, loading: true, error: '' });
    memberProfileRequest(user, undefined, controller.signal).then(profile => { if (!controller.signal.aborted) setState({ uid: user.uid, profile, loading: false, error: '' }); }).catch(error => { if (!controller.signal.aborted) setState({ uid: user.uid, profile: null, loading: false, error: error instanceof Error ? error.message : 'โหลดข้อมูลไม่ได้ กรุณาลองใหม่' }); });
    return () => controller.abort();
  }, [user, attempt]);
  async function complete(answers: ProfileAnswers) {
    const profile = await memberProfileRequest(user, answers);
    if (!profile) throw new Error('ยังบันทึกข้อมูลไม่ได้ กรุณาลองอีกครั้ง');
    // The durable profile is authoritative; an optional Auth display-name update must not lose it.
    await updateProfile(user, { displayName: answers.displayName }).catch(() => {});
    setState({ uid: user.uid, profile, loading: false, error: '' });
    navigateAuth('/dashboard');
  }
  if (state.uid !== user.uid || state.loading) return <div className="member-gate-wait" role="status"><Loader2 size={21} className="auth-spinner"/>กำลังเตรียมพื้นที่ของคุณ…</div>;
  if (state.error) return <div className="member-gate-wait"><p role="alert">{state.error}</p><button onClick={() => setAttempt(value => value + 1)}>ลองอีกครั้ง</button><button onClick={onSignOut}>ออกจากระบบ</button></div>;
  if (!state.profile) return <OnboardingWizard defaultName={user.displayName} onComplete={complete} onSignOut={onSignOut}/>;
  return children(state.profile);
}
