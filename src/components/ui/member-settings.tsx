import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, ChevronRight, CircleHelp, CircleUserRound, Database, FileText, Globe2, Info, LogOut, Monitor, Moon, Pencil, Settings, ShieldCheck, Store, Sun, Wallet, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import { navigateAuth } from '@/lib/auth-navigation';
import { memberPaths, type MemberPage, type SettingsPage } from '@/lib/member-navigation';
import type { MemberIdentity } from '@/lib/member-profile';
import type { ShowcaseSecurity, useShowcase } from '@/lib/showcase';
import { themeColors, useTheme } from '@/lib/theme';
import { ProfileSettings, SecurityChecklist } from './member-profile-page';
import '@/member-settings.css';

const sections = {
  settingsGeneral: { label: 'ทั่วไป', icon: Settings },
  account: { label: 'ข้อมูลบัญชี', icon: CircleUserRound },
  settingsShop: { label: 'ร้านค้าของฉัน', icon: Store },
  settingsWallet: { label: 'กระเป๋าเงิน', icon: Wallet },
  security: { label: 'ความปลอดภัย', icon: ShieldCheck },
  settingsPrivacy: { label: 'จัดการข้อมูล', icon: Database },
  settingsSupport: { label: 'ความช่วยเหลือ', icon: CircleHelp },
  settingsLegal: { label: 'ข้อมูลทางกฎหมาย', icon: FileText },
  settingsAppearance: { label: 'การแสดงผล', icon: Sun },
} satisfies Record<SettingsPage, { label: string; icon: typeof Sun }>;
const navPages = ['settingsGeneral', 'account', 'settingsShop', 'settingsWallet', 'security', 'settingsPrivacy', 'settingsSupport', 'settingsLegal'] as const;

type MemberSettingsProps = {
  page: SettingsPage | null;
  user: MemberIdentity;
  authUser?: User | null;
  security: ShowcaseSecurity;
  savedCount: number;
  cartCount: number;
  showcase: ReturnType<typeof useShowcase>;
  busy?: boolean;
  feedback?: ReactNode;
  onNavigate: (page: MemberPage) => void;
  onClose: () => void;
  onSignOut: () => void;
  onVerify?: () => void | Promise<void>;
};

function followLink(event: MouseEvent<HTMLAnchorElement>, onOpen: () => void) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  onOpen();
}

function SettingsRow({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return <div className="oc-settings-row">
    <div className="oc-settings-copy"><h3>{title}</h3>{description && <p>{description}</p>}</div>
    {children && <div className="oc-settings-value">{children}</div>}
  </div>;
}

function SettingsCardLink({ href, title, description, icon: Icon, count, onOpen }: {
  href: string; title: string; description?: string; icon?: typeof Sun; count?: number; onOpen: () => void;
}) {
  return <a className="oc-settings-card oc-settings-card-link" href={href} onClick={event => followLink(event, onOpen)}>
    {Icon && <Icon aria-hidden="true" size={20}/>}
    <span className="oc-settings-copy">
      <strong>{title}</strong>{description && <small>{description}</small>}
    </span>
    {count !== undefined && <span className="oc-settings-count">{count} รายการ</span>}
    <ArrowUpRight className="oc-settings-go" aria-hidden="true" size={16}/>
  </a>;
}

function SettingsAccount({ user, security, showcase, onNavigate }: Pick<MemberSettingsProps, 'user' | 'security' | 'showcase' | 'onNavigate'>) {
  const [editing, setEditing] = useState(false);
  const editButton = useRef<HTMLButtonElement>(null);
  const editorHeading = useRef<HTMLHeadingElement>(null);

  function startEditing() {
    setEditing(true);
    requestAnimationFrame(() => editorHeading.current?.focus());
  }

  function stopEditing() {
    setEditing(false);
    requestAnimationFrame(() => editButton.current?.focus());
  }

  return <>
    <section className="oc-settings-block" aria-labelledby="settings-details-title">
      <h2 id="settings-details-title">รายละเอียด</h2>
      <div className="oc-settings-card oc-settings-stack">
        <SettingsRow title="ชื่อที่แสดง" description="ชื่อที่ใช้ใน OpenCraft">
          <span className="oc-settings-value-text">{user.displayName || 'สมาชิก OpenCraft'}</span>
          <button ref={editButton} type="button" className="oc-settings-icon" aria-label="แก้ไขข้อมูลบัญชี" aria-expanded={editing} onClick={editing ? stopEditing : startEditing}><Pencil size={15}/></button>
        </SettingsRow>
        <SettingsRow title="อีเมล" description="อีเมลที่เชื่อมกับบัญชีนี้">
          <span className="oc-settings-value-text">{user.email || '—'}</span>
        </SettingsRow>
        <SettingsRow title="การยืนยันอีเมล" description="ตรวจสอบสถานะในหมวดความปลอดภัย">
          <button type="button" className="oc-settings-link" onClick={() => onNavigate('security')}>
            {security.emailVerified ? 'ยืนยันแล้ว' : user.email ? 'รอการยืนยัน' : 'ดูความปลอดภัย'}<ChevronRight size={15}/>
          </button>
        </SettingsRow>
      </div>
    </section>
    {editing && <section className="oc-settings-block" aria-labelledby="settings-editor-title">
      <h2 id="settings-editor-title" ref={editorHeading} tabIndex={-1}>แก้ไขข้อมูลบัญชี</h2>
      <ProfileSettings data={showcase.data} loading={showcase.loading} error={showcase.error} saving={showcase.saving}
        onSave={showcase.save} onRetry={() => void showcase.reload()} onCancel={stopEditing}/>
    </section>}
  </>;
}

const modes = [
  { key: 'light', label: 'สว่าง', icon: Sun },
  { key: 'dark', label: 'มืด', icon: Moon },
  { key: 'system', label: 'ตามระบบ', icon: Monitor },
] as const;

function SettingsAppearance() {
  const { mode, accent, setTheme, setAccent } = useTheme();
  return <section className="oc-settings-block" aria-labelledby="settings-appearance-title">
    <h2 id="settings-appearance-title">การแสดงผล</h2>
    <div className="oc-settings-card">
      <SettingsRow title="โหมด">
        <div className="oc-settings-mode" role="group" aria-label="โหมดแสดงผล">
          {modes.map(({ key, label, icon: Icon }) => <button key={key} type="button" aria-label={label} title={label} aria-pressed={mode === key} onClick={() => setTheme(key)}>
            <Icon size={17} aria-hidden="true"/>
          </button>)}
        </div>
      </SettingsRow>
      <div className="oc-settings-colors">
        <h3 id="settings-color-title">สีธีม</h3>
        <div className="oc-settings-swatches" role="group" aria-labelledby="settings-color-title">
          {themeColors.map(({ color, label }) => <button key={color} type="button" aria-label={label} title={label}
            aria-pressed={accent === color} style={{ backgroundColor: color }} onClick={() => setAccent(color)}/>)}
        </div>
      </div>
    </div>
  </section>;
}

function SettingsGeneral({ savedCount, cartCount, onNavigate }: Pick<MemberSettingsProps, 'savedCount' | 'cartCount' | 'onNavigate'>) {
  return <>
    <SettingsCardLink href={memberPaths.account} title="บัญชี OpenCraft" description="ความปลอดภัยและข้อมูลส่วนตัว"
      icon={Info} onOpen={() => onNavigate('account')}/>
    <section className="oc-settings-block" aria-labelledby="settings-usage-title">
      <h2 id="settings-usage-title">การใช้งาน</h2>
      <div className="oc-settings-card oc-settings-stack">
        <SettingsCardLink href={memberPaths.favorites} title="รายการที่บันทึก" description="สินค้าและบริการที่คุณกดบันทึก"
          count={savedCount} onOpen={() => onNavigate('favorites')}/>
        <SettingsCardLink href={memberPaths.cart} title="ตะกร้า" description="รายการที่คุณเลือกไว้"
          count={cartCount} onOpen={() => onNavigate('cart')}/>
      </div>
    </section>
    <div className="oc-settings-card oc-settings-language"><Globe2 aria-hidden="true" size={20}/><SettingsRow title="ภาษาเว็บไซต์">ไทย</SettingsRow></div>
    <SettingsAppearance/>
  </>;
}

const privacyLink = { path: '/privacy', title: 'ประกาศความเป็นส่วนตัว', description: 'การใช้ข้อมูลและสิทธิของเจ้าของข้อมูล' } as const;
const termsLink = { path: '/terms', title: 'ข้อกำหนดการใช้บริการ' } as const;
const contactLink = { path: '/contact', title: 'ติดต่อ OpenCraft', description: 'สอบถามหรือแจ้งปัญหากับทีมงาน' } as const;

function SettingsLegalLinks({ links }: { links: readonly { path: '/privacy' | '/terms' | '/contact'; title: string; description?: string }[] }) {
  return links.map(({ path, title, description }) =>
    <SettingsCardLink key={path} href={path} title={title} description={description} onOpen={() => navigateAuth(path)}/>);
}

export default function MemberSettings({
  page, user, authUser, security, savedCount, cartCount, showcase, busy, feedback, onNavigate, onClose, onSignOut, onVerify,
}: MemberSettingsProps) {
  const [refreshIssue, setRefreshIssue] = useState(false);
  const lastPage = useRef<SettingsPage>('settingsGeneral');
  const previousPage = useRef<SettingsPage | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const pane = useRef<HTMLDivElement>(null);
  const closeFocus = useRef<HTMLElement | null>(null);
  const requestedSection = page ?? lastPage.current;
  const section = requestedSection === 'settingsShop' && !security.sellerApproved ? 'settingsGeneral' : requestedSection;
  const navSection = section === 'settingsAppearance' ? 'settingsGeneral' : section;

  useLayoutEffect(() => {
    const previous = previousPage.current;
    previousPage.current = page;
    if (!page) return;
    lastPage.current = page;
    if (pane.current) pane.current.scrollTop = 0;
    if (previous && previous !== page) heading.current?.focus({ preventScroll: true });
  }, [page]);

  useEffect(() => {
    if (!page) setRefreshIssue(false);
  }, [page]);

  async function refreshSecurity(verifyEmail = false) {
    setRefreshIssue(false);
    try {
      if (verifyEmail) await onVerify?.();
      await authUser?.reload();
      await authUser?.getIdToken(true);
      await showcase.reload();
    } catch {
      setRefreshIssue(true);
    }
  }

  return <Dialog.Root open={page !== null} onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="oc-settings-overlay"/>
      <Dialog.Content className="oc-settings-dialog" aria-describedby={undefined} onOpenAutoFocus={event => {
        event.preventDefault();
        const active = document.activeElement;
        closeFocus.current = active instanceof HTMLElement && active !== document.body ? active : null;
        heading.current?.focus();
      }} onCloseAutoFocus={event => {
        event.preventDefault();
        const target = closeFocus.current?.isConnected ? closeFocus.current : document.querySelector<HTMLButtonElement>('.profile-dropdown-trigger');
        target?.focus({ preventScroll: true });
      }}>
        <aside className="oc-settings-sidebar">
          <div className="oc-settings-brand">การตั้งค่า</div>
          <nav className="oc-settings-nav" aria-label="หมวดการตั้งค่า">
            {navPages.filter(destination => destination !== 'settingsShop' || security.sellerApproved).map(destination => {
              const { label, icon: Icon } = sections[destination];
              return <a key={destination} href={memberPaths[destination]} aria-current={navSection === destination ? 'page' : undefined} onClick={event => followLink(event, () => {
                if (section === destination) heading.current?.focus({ preventScroll: true });
                else onNavigate(destination);
              })}><Icon aria-hidden="true" size={17}/><span>{label}</span></a>;
            })}
          </nav>
          <button type="button" className="oc-settings-signout" disabled={busy} onClick={onSignOut}><LogOut size={17} aria-hidden="true"/>{busy ? 'กำลังออกจากระบบ…' : 'ออกจากระบบ'}</button>
        </aside>
        <div className="oc-settings-pane" ref={pane}>
          <header className="oc-settings-header">
            <Dialog.Title ref={heading} tabIndex={-1}>{sections[section].label}</Dialog.Title>
            <Dialog.Close className="oc-settings-icon oc-settings-close" aria-label="ปิดการตั้งค่า"><X size={16}/></Dialog.Close>
          </header>
          {section === 'settingsGeneral' && <SettingsGeneral savedCount={savedCount} cartCount={cartCount} onNavigate={onNavigate}/>}
          {section === 'account' && <SettingsAccount user={user} security={security} showcase={showcase} onNavigate={onNavigate}/>}
          {section === 'settingsShop' && <>
            <SettingsCardLink href={memberPaths.seller} title="จัดการร้านค้า" description="ดูข้อมูลร้านและแบบร่าง" onOpen={() => onNavigate('seller')}/>
            <SettingsCardLink href={memberPaths.profile} title="โปรไฟล์ร้าน" description="ดูหน้าร้านและผลงานของคุณ" onOpen={() => onNavigate('profile')}/>
          </>}
          {section === 'settingsWallet' && <SettingsCardLink href={memberPaths.topup} title="เติมเงิน" description="ดูยอดคงเหลือและช่องทางเติมเงิน" onOpen={() => onNavigate('topup')}/>}
          {section === 'security' && <div className="oc-settings-block oc-settings-security">
            <SecurityChecklist user={user} authUser={authUser} security={security} onVerify={onVerify && !busy ? () => void refreshSecurity(true) : undefined} onRefresh={() => void refreshSecurity()}/>
            {refreshIssue && <p role="alert" className="oc-settings-error">อัปเดตสถานะบัญชีไม่ได้ในตอนนี้ <button type="button" onClick={() => void refreshSecurity()}>ลองอีกครั้ง</button></p>}
          </div>}
          {section === 'settingsAppearance' && <SettingsAppearance/>}
          {section === 'settingsPrivacy' && <SettingsLegalLinks links={[privacyLink, { ...contactLink, title: 'ยื่นคำขอเกี่ยวกับข้อมูลส่วนบุคคล', description: undefined }]}/>}
          {section === 'settingsSupport' && <>
            <SettingsCardLink href={memberPaths.help} title="คำถามที่พบบ่อย" onOpen={() => onNavigate('help')}/>
            <SettingsLegalLinks links={[contactLink]}/>
          </>}
          {section === 'settingsLegal' && <SettingsLegalLinks links={[termsLink, privacyLink]}/>}
          {feedback && <div className="oc-settings-feedback">{feedback}</div>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
