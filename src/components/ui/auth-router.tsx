import { lazy, Suspense, useEffect, useState } from 'react';
import { getMemberPage, memberPaths, memberTitles } from '@/lib/member-navigation';
const AuthScreen = lazy(() => import('./auth-screen'));
const LegalPages = lazy(() => import('./legal-pages'));
const legalTitles:Record<string,string>={'/privacy':'ความเป็นส่วนตัว','/terms':'ข้อกำหนดการใช้บริการ','/seller-terms':'ข้อกำหนดผู้ขาย','/legal/guardians':'ผู้เยาว์และผู้ปกครอง','/sell':'สมัครผู้ขาย','/contact':'ติดต่อเรา'};
const routes = new Set(['/signup', '/login', '/reset-password', '/welcome', ...Object.values(memberPaths)]);
export function AuthRouter() {
  const [path, setPath] = useState(location.pathname);
  const legal = !!legalTitles[path];
  const visible = routes.has(path) || legal;
  useEffect(() => { const read = () => setPath(location.pathname); addEventListener('popstate', read); return () => removeEventListener('popstate', read); }, []);
  useEffect(() => {
    document.body.classList.toggle('auth-view', visible);
    document.documentElement.classList.toggle('auth-route', visible);
    const memberPage = getMemberPage(path);
    document.title = visible ? `${legal ? legalTitles[path] : memberPage ? memberTitles[memberPage] : path === '/welcome' ? 'เริ่มต้นใช้งาน' : path === '/signup' ? 'สมัครสมาชิก' : path === '/reset-password' ? 'ลืมรหัสผ่าน' : 'เข้าสู่ระบบ'} — OpenCraft` : 'OpenCraft — ตลาดซื้อขาย ครบจบในที่เดียว';
    let frame = 0;
    if (!visible && location.hash === '#discover') frame = requestAnimationFrame(() => document.querySelector('#discover')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
    return () => { cancelAnimationFrame(frame); document.body.classList.remove('auth-view'); document.documentElement.classList.remove('auth-route'); };
  }, [visible, path]);
  return visible ? <Suspense fallback={<div className="auth-loading" role="status">กำลังเปิด OpenCraft…</div>}>{legal?<LegalPages path={path}/>:<AuthScreen mode={path.slice(1)}/>}</Suspense> : null;
}
