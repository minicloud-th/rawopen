// Development-only visual fixture. This HTML entry is not part of the production build.
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useState } from 'react';
import MemberHome from './components/ui/member-home';
import { getMemberPage, memberTitles } from './lib/member-navigation';
import type { ShowcaseResult } from './lib/showcase';
import './theme.css';
import './appearance.css';
import './profile-social.css';
import './store.css';
import './member-home.css';
import './portfolio.css';
import './landing.css';
import './onboarding.css';
import './market-refinement.css';
import './reference-skin.css';
function MemberPreview() {
  const [fixture] = useState(() => new URLSearchParams(location.search));
  const secure = fixture.has('secure');
  const previewShowcase = useMemo<ShowcaseResult>(() => ({
    showcase: { displayName: 'OpenCraft', bio: 'ค้นพบและสร้างสรรค์ไปด้วยกัน', photoURL: fixture.has('photo') ? '/assets/headphones.jpg' : '', storeName: 'OpenCraft Studio', storeBio: 'ร้านตัวอย่างสำหรับทดสอบโปรไฟล์', works: [{ title: 'ชุด UI สำหรับร้านค้า', description: 'ตัวอย่างผลงานดิจิทัล', image: location.origin + '/assets/ui-kit.svg' }] },
    security: { emailVerified: secure, mfaEnabled: secure, storeVerified: fixture.has('verified'), sellerApproved:fixture.has('seller')||fixture.has('verified') },
  }), [fixture, secure]);
  const [page, setPage] = useState(() => getMemberPage(location.pathname) || 'dashboard');
  useEffect(() => {
    const read = () => setPage(getMemberPage(location.pathname) || 'dashboard');
    addEventListener('popstate', read);
    return () => removeEventListener('popstate', read);
  }, []);
  useEffect(() => { document.title = `${memberTitles[page]} — OpenCraft preview`; }, [page]);
  return <MemberHome page={page} user={{ displayName: 'OpenCraft', email: null, emailVerified: secure, photoURL: fixture.has('photo') ? '/assets/headphones.jpg' : null }} previewShowcase={previewShowcase} preferences={{ displayName: 'OpenCraft', goal: 'both', interests: ['digital', 'design'], completedAt: '2026-11-14' }} onSignOut={() => location.assign('/login')}/>;
}
if (import.meta.env.DEV) createRoot(document.getElementById('member-preview')!).render(<MemberPreview/>);
