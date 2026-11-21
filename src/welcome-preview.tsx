// Development-only UI fixture; it neither creates a Firebase session nor writes a member record.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import OnboardingWizard from './components/ui/onboarding-wizard';
import './market-refinement.css'; import './theme.css'; import './store.css'; import './portfolio.css'; import './onboarding.css';
function WelcomePreview() {
  const [done, setDone] = useState(false);
  return done ? <div className="member-gate-wait"><h1>ขั้นตอนเริ่มต้นเสร็จแล้ว</h1><p>ตัวอย่างหน้าจอสำหรับตรวจ UI เท่านั้น</p><button onClick={() => location.assign('/preview/member.html')}>ดูหน้าหลักสมาชิก</button></div> : <OnboardingWizard onSignOut={() => location.assign('/')} onComplete={async () => { setDone(true); }}/>;
}
if (import.meta.env.DEV) createRoot(document.getElementById('welcome-preview')!).render(<WelcomePreview/>);

import './reference-skin.css';
