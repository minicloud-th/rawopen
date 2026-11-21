import { useEffect, useLayoutEffect, useRef } from 'react';
import { useSoftReveals } from '@/lib/use-soft-reveals';
import { useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { User } from 'firebase/auth';
import { navigateAuth } from '@/lib/auth-navigation';
import MemberCatalog from './member-catalog';
import ProfileDropdown from './profile-dropdown';
import { useMarket } from '@/lib/use-market';
import { MenuBar, type MenuBarKey } from './animated-menu-bar';
import type { MemberIdentity, MemberProfile } from '@/lib/member-profile';
import { isSettingsPage, memberPaths, type MemberPage, type SettingsPage } from '@/lib/member-navigation';
import MemberPages from './member-pages';
import MemberSettings from './member-settings';
import { pendingSecurity, useShowcase, type ShowcaseResult } from '@/lib/showcase';
import '@/profile-social.css';
import '@/appearance.css';
import '@/market-refinement.css';
import '@/reference-skin.css';

type MemberHomeProps = {
  user: MemberIdentity; page?: MemberPage; preferences?: MemberProfile; notice?: string; issue?: string; busy?: boolean;
  authUser?: User | null; previewShowcase?: ShowcaseResult;
  onSignOut: () => void; onBrowse?: () => void; onProfile?: () => void; onDismiss?: () => void; onNavigate?: (page: MemberPage) => void; onVerify?: () => void | Promise<void>;
};
const memberMenuItems = ['dashboard', 'favorites', 'cart', 'help', ['topup', 'notifications', 'security'], 'seller'] as const;
const memberMenuLabels = { dashboard: 'หน้าหลัก', favorites: 'รายการที่บันทึก', cart: 'ตะกร้า', topup: 'เติมเงิน', seller: 'ร้านค้าของฉัน', notifications: 'การแจ้งเตือน', settings: 'ตั้งค่า', help: 'ช่วยเหลือ', security: 'ความปลอดภัย' };

export default function MemberHome({ user, page = 'dashboard', preferences, authUser, previewShowcase, onSignOut, onBrowse, onProfile, onDismiss, onNavigate, onVerify, notice, issue, busy }: MemberHomeProps) {
  const root = useRef<HTMLDivElement>(null);
  const background = useRef<Exclude<MemberPage, SettingsPage>>('dashboard');
  const closingSettings = useRef(false);
  const settingsPage = isSettingsPage(page) ? page : null;
  const backgroundPage = isSettingsPage(page) ? background.current : page;
  useLayoutEffect(() => {
    if (!isSettingsPage(page)) {
      background.current = page;
      closingSettings.current = false;
    }
  }, [page]);
  useSoftReveals(root);
  const reduce = useReducedMotion();
  const market = useMarket();
  const showcase = useShowcase(authUser, previewShowcase);
  const security = showcase.data?.security || pendingSecurity;
  const memberUser: MemberIdentity = { ...user, displayName: showcase.data?.showcase.displayName || user.displayName, photoURL: showcase.data?.showcase.photoURL || user.photoURL };
  const secure = security.emailVerified && security.mfaEnabled;
  useEffect(() => {
    const open = () => { if(onBrowse){onBrowse();return;} document.querySelector('#member-catalog')?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth', block: 'start' }); document.querySelector<HTMLInputElement>('#member-catalog input[type=search]')?.focus({preventScroll:true}); };
    document.addEventListener('opencraft:browse', open);
    if (page === 'dashboard' && location.hash === '#discover') open();
    return () => document.removeEventListener('opencraft:browse', open);
  }, [page, onBrowse, reduce]);
  const goPage = (next: MemberPage) => {
    if (next === 'account' && !settingsPage && onProfile) { onProfile(); return; }
    if (onNavigate) onNavigate(next);
    else {
      const opensSettings = isSettingsPage(next);
      navigateAuth(memberPaths[next], {
        preserveScroll: opensSettings,
        replace: !!settingsPage && opensSettings,
        state: !settingsPage && opensSettings ? { opencraftSettings: true } : null,
      });
    }
  };
  const closeSettings = () => {
    if (onNavigate) onNavigate(backgroundPage);
    else if (history.state?.opencraftSettings) {
      if (closingSettings.current) return;
      closingSettings.current = true;
      history.back();
    } else navigateAuth(memberPaths[backgroundPage], { preserveScroll: true, replace: true });
  };
  const feedback = (notice || issue) && <div className={`member-notice ${issue ? 'is-error' : ''}`} role={issue ? 'alert' : 'status'}><span>{issue || notice}</span>{onDismiss && <button aria-label="ปิดข้อความ" onClick={onDismiss}><X size={16}/></button>}</div>;
  const selectTool = (key: MenuBarKey) => goPage(key === 'settings' ? 'settingsGeneral' : key);
  return <div ref={root} className="member-shell market-refined oc-redesign">
    <aside className="member-rail" aria-label="เมนูสมาชิก">
      <a className="member-brand" href="/" onClick={event => { event.preventDefault(); navigateAuth('/'); }} aria-label="OpenCraft หน้าแนะนำ"><img src="/assets/opencraft-symbol.png" alt="" width="36" height="36"/></a>
      <div className="member-side-menu"><MenuBar orientation="vertical" active={settingsPage === 'security' ? 'security' : backgroundPage === 'profile' || backgroundPage === 'sellerApply' ? null : backgroundPage} onSelect={selectTool} items={memberMenuItems.filter(item=>item!=='seller'||security.sellerApproved)} labels={memberMenuLabels} hrefs={memberPaths} counts={{ favorites: market.favorites.length, cart: market.cartCount }}/></div>
      <ProfileDropdown user={memberUser} secure={secure} sellerApproved={security.sellerApproved} page={page} busy={busy} onNavigate={goPage} onSignOut={onSignOut}/>
    </aside>
    <main className="member-panel">
      {backgroundPage === 'dashboard' ? <>
        <MemberCatalog preferredCategories={preferences?.interests} memberName={memberUser.displayName}/>
      </> : <MemberPages key={backgroundPage} page={backgroundPage} user={memberUser} authUser={authUser} showcase={showcase} security={security} onNavigate={goPage}/>}
      <footer className="member-hub-footer"><a href="/" onClick={event => { event.preventDefault(); navigateAuth('/'); }}>OpenCraft</a><div><a href="/sell">สมัครผู้ขาย</a><a href="/privacy">ความเป็นส่วนตัว</a><a href="/terms">ข้อกำหนด</a><a href="/contact">ติดต่อเรา</a></div></footer>
      {!settingsPage && feedback}
    </main>
    <MemberSettings page={settingsPage} user={memberUser} authUser={authUser} security={security}
      savedCount={market.favorites.length} cartCount={market.cartCount} showcase={showcase} busy={busy} feedback={feedback} onVerify={onVerify} onSignOut={onSignOut}
      onNavigate={goPage} onClose={closeSettings}/>
  </div>;
}
