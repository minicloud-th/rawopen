import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Eye, EyeOff, Github, Loader2, LogOut, Mail } from 'lucide-react';
import { createUserWithEmailAndPassword, GithubAuthProvider, GoogleAuthProvider, getMultiFactorResolver, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signInWithCustomToken, signInWithEmailAndPassword, signInWithPopup, signOut, TotpMultiFactorGenerator, updateProfile, type MultiFactorError, type MultiFactorResolver, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { navigateAuth } from '@/lib/auth-navigation';
import { getMemberPage, memberPaths } from '@/lib/member-navigation';
import MemberHome from './member-home';
import MemberGate from './member-gate';
import AgreementGate from './agreement-gate';
import {ageOn,legalRequest,POLICY_VERSION} from '@/lib/legal';

type Provider = 'google' | 'github' | 'discord' | 'line';
function errorText(error: unknown): string {
  const code = (error as { code?: string }).code;
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง ลองตรวจสอบอีกครั้ง',
    'auth/invalid-email': 'กรุณากรอกอีเมลให้ถูกต้อง',
    'auth/email-already-in-use': 'อีเมลนี้มีบัญชีแล้ว ลองเข้าสู่ระบบหรือตั้งรหัสผ่านใหม่',
    'auth/weak-password': 'กรุณาใช้รหัสผ่านที่ปลอดภัยขึ้น อย่างน้อย 8 ตัวอักษร',
    'auth/password-does-not-meet-requirements': 'รหัสผ่านยังไม่ตรงตามเงื่อนไขความปลอดภัย กรุณาเพิ่มความยาวและผสมตัวอักษรกับตัวเลข',
    'auth/too-many-requests': 'มีการลองหลายครั้ง กรุณารอสักครู่แล้วลองใหม่',
    'auth/network-request-failed': 'เชื่อมต่อไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',
    'auth/popup-blocked': 'เบราว์เซอร์ปิดกั้นหน้าต่างเข้าสู่ระบบ กรุณาอนุญาตหน้าต่างป๊อปอัป',
    'auth/popup-closed-by-user': 'ปิดหน้าต่างเข้าสู่ระบบแล้ว คุณสามารถลองใหม่ได้',
    'auth/cancelled-popup-request': 'กำลังเปิดหน้าต่างเข้าสู่ระบบ กรุณารอสักครู่',
    'auth/account-exists-with-different-credential': 'อีเมลนี้ใช้วิธีเข้าสู่ระบบอื่นอยู่ กรุณาใช้วิธีเดิมเพื่อเข้าบัญชี',
    'auth/operation-not-allowed': 'ช่องทางนี้ยังไม่เปิดใช้งาน กรุณาลองช่องทางอื่น',
    'auth/unauthorized-domain': 'ยังไม่เปิดใช้งานการเข้าสู่ระบบสำหรับโดเมนนี้ กรุณาติดต่อ OpenCraft',
    'auth/configuration-not-found': 'ระบบสมาชิกยังตั้งค่าไม่ครบ กรุณาลองอีกครั้งภายหลัง',
    'auth/user-disabled': 'บัญชีนี้ถูกระงับ กรุณาติดต่อ OpenCraft',
    'auth/invalid-api-key': 'ระบบสมาชิกยังเชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้งภายหลัง',
    'auth/internal-error': 'เชื่อมต่อระบบสมาชิกไม่ได้ในขณะนี้ กรุณาลองอีกครั้ง',
  };
  return messages[code || ''] || 'ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง';
}
function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === 'github') return <Github size={18} fill="currentColor" strokeWidth={1.3}/>;
  if (provider === 'google') return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.58-4.12H3.08v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.42 13.92a6 6 0 0 1 0-3.84v-2.6H3.08a10 10 0 0 0 0 9.04l3.34-2.6Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.5L18.7 4.6A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.92 5.48l3.34 2.6C7.2 7.72 9.4 5.96 12 5.96Z"/></svg>;
  if (provider === 'line') return <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true"><path fill="#06c755" d="M12 2C5.9 2 1 5.9 1 10.6c0 4.2 3.8 7.7 8.9 8.4.3.1.8.3.8.8l-.2 1.5c-.1.4-.3 1.4 1.2.8C13.3 21.5 23 15.6 23 10.6 23 5.9 18.1 2 12 2Z"/><path d="M6 8v5h2.5M10 8v5m2-5v5m0-5 3 5V8m4 0h-2v5h2m-2-2.5h2" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  return <svg width="20" height="18" viewBox="0 0 24 24" fill="#5865f2" aria-hidden="true"><path d="M19.7 5.2a18.5 18.5 0 0 0-4.5-1.4l-.6 1.2a16.7 16.7 0 0 0-5.2 0l-.6-1.2a18.5 18.5 0 0 0-4.5 1.4C1.5 9.3.7 13.3 1.1 17.2a18 18 0 0 0 5.5 2.8l1.1-1.8-1.6-.8.4-.3a13 13 0 0 0 11 0l.4.3-1.6.8 1.1 1.8a18 18 0 0 0 5.5-2.8c.5-4.5-.8-8.5-3.2-12ZM8.5 14.8c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"/></svg>;
}
const labels = { google: 'Google', github: 'GitHub', discord: 'Discord', line: 'LINE' };

export default function AuthScreen({ mode }: { mode: string }) {
  const memberPage = getMemberPage(`/${mode}`);
  const memberDestination = memberPage ? memberPaths[memberPage] : '/dashboard';
  const [user, setUser] = useState<User | null>(null), [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(''), [issue, setIssue] = useState(''), [notice, setNotice] = useState('');
  const [resolver, setResolver] = useState<MultiFactorResolver | null>(null), [mfaCode, setMfaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false), [providers, setProviders] = useState({ discord: false, line: false });
  const confirmRef = useRef<HTMLInputElement>(null), alive = useRef(true), completing = useRef(false);
  const previousMode = useRef(mode);
  const signup = mode === 'signup', reset = mode === 'reset-password';
  const title = reset ? 'ตั้งรหัสผ่านใหม่' : signup ? 'สร้างบัญชี OpenCraft' : 'ยินดีต้อนรับกลับ';
  function captureMfa(error: unknown) {
    if ((error as { code?: string })?.code !== 'auth/multi-factor-auth-required') return false;
    try {
      const next = getMultiFactorResolver(auth, error as MultiFactorError);
      if (!next.hints.some(hint => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID)) {
        setIssue('บัญชีนี้ต้องยืนยันด้วยอีกขั้นตอนที่ยังไม่รองรับในหน้านี้ กรุณาเข้าสู่ระบบด้วยช่องทางอื่น'); return true;
      }
      setResolver(next); setMfaCode(''); setIssue(''); setNotice(''); return true;
    } catch { return false; }
  }
  async function completeMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hint = resolver?.hints.find(item => item.factorId === TotpMultiFactorGenerator.FACTOR_ID);
    if (!resolver || !hint || !/^\d{6}$/.test(mfaCode) || busy) return;
    setBusy('mfa'); setIssue('');
    try {
      const result = await resolver.resolveSignIn(TotpMultiFactorGenerator.assertionForSignIn(hint.uid, mfaCode));
      setUser(result.user); setResolver(null); setMfaCode(''); navigateAuth(memberDestination);
    } catch (error) {
      setIssue((error as { code?: string }).code === 'auth/invalid-verification-code' ? 'รหัสไม่ถูกต้องหรือหมดอายุ ลองใช้รหัสใหม่จากแอป' : 'ยืนยันขั้นตอนที่สองไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally { setBusy(''); }
  }
  useEffect(() => {
    alive.current = true;
    const stop = onAuthStateChanged(auth, next => { setUser(next); setLoading(false); });
    const controller = new AbortController();
    fetch('/api/auth/providers', { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => { if (data && alive.current) setProviders({ discord: data.discord === true, line: data.line === true }); }).catch(() => {});
    const error = new URLSearchParams(location.search).get('authError');
    if (error) setIssue(error === 'oauth-cancelled' ? 'ยกเลิกการเชื่อมต่อแล้ว คุณสามารถเลือกช่องทางอื่นได้' : error === 'provider-not-configured' ? 'ช่องทางนี้ยังไม่เปิดใช้งาน กรุณาเลือกช่องทางอื่น' : 'เชื่อมต่อบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง');
    if (error) history.replaceState(null, '', location.pathname);
    return () => { alive.current = false; stop(); controller.abort(); };
  }, []);
  useEffect(() => {
    if (new URLSearchParams(location.search).get('oauth') !== 'complete' || completing.current) return;
    completing.current = true; history.replaceState(null, '', '/account'); setBusy('oauth');
    void (async () => {
      try {
        const response = await fetch('/api/auth/complete', { method: 'POST', credentials: 'same-origin' });
        if (!response.ok) throw new Error('expired');
        const data = await response.json(); const result = await signInWithCustomToken(auth, data.token);
        if (data.displayName && !result.user.displayName) await updateProfile(result.user, { displayName: data.displayName });
        if (alive.current) { setUser(result.user); setNotice('เชื่อมต่อบัญชีเรียบร้อยแล้ว'); navigateAuth('/dashboard'); }
      } catch (error) { if (alive.current && !captureMfa(error)) setIssue('การเชื่อมต่อหมดอายุ กรุณาเข้าสู่ระบบใหม่'); }
      finally { if (alive.current) setBusy(''); }
    })();
  }, []);
  useEffect(() => { if (previousMode.current !== mode) { previousMode.current = mode; setIssue(''); setNotice(''); } }, [mode]);

  async function social(provider: Provider) {
    setIssue(''); setNotice('');
    if (provider === 'discord' || provider === 'line') {
      if (!providers[provider]) { setIssue(`${labels[provider]} ยังไม่เปิดใช้งาน กรุณาเลือกอีเมลหรือช่องทางอื่น`); return; }
      location.assign(`/api/auth/${provider}/start`); return;
    }
    setBusy(provider);
    try {
      const credential = provider === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
      if (provider === 'google') credential.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, credential); navigateAuth(memberDestination);
    } catch (error) { if (alive.current && !captureMfa(error)) setIssue(errorText(error)); }
    finally { if (alive.current) setBusy(''); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget), email = String(data.get('email') || '').trim(), password = String(data.get('password') || '');
    setIssue(''); setNotice('');
    const signupAge = signup ? ageOn(String(data.get('birthDate') || '')) : null;
    if (signup && (signupAge === null || signupAge < 13 || data.get('terms') !== 'on' || data.get('privacy') !== 'on')) { setIssue('สมัครได้เมื่ออายุครบ 13 ปี และต้องอ่านข้อกำหนดกับประกาศความเป็นส่วนตัว'); return; }
    if (signup && password !== data.get('confirm')) { setIssue('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); confirmRef.current?.focus(); return; }
    setBusy('email');
    try {
      if (reset) {
        await sendPasswordResetEmail(auth, email, { url: location.origin + '/login' });
        if (alive.current) setNotice('หากมีบัญชีที่ใช้อีเมลนี้ คุณจะได้รับลิงก์ตั้งรหัสผ่านใหม่ กรุณาตรวจสอบกล่องจดหมายและสแปม');
      } else if (signup) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: String(data.get('name') || '').trim() });
        await legalRequest(result.user, '/api/agreements', 'PUT', { birthDate: String(data.get('birthDate')), acceptedTerms: true, acknowledgedPrivacy: true, termsVersion: POLICY_VERSION, privacyVersion: POLICY_VERSION });
        dispatchEvent(new Event('opencraft:agreement-updated'));
        navigateAuth('/dashboard');
        try { await sendEmailVerification(result.user, { url: location.origin + '/account' }); if (alive.current) setNotice('ส่งลิงก์ยืนยันอีเมลแล้ว กรุณาตรวจสอบกล่องจดหมาย'); }
        catch { if (alive.current) setNotice('สร้างบัญชีแล้ว แต่ยังส่งอีเมลยืนยันไม่ได้ คุณสามารถส่งใหม่จากหน้านี้'); }
      } else { await signInWithEmailAndPassword(auth, email, password); navigateAuth(memberDestination); }
    } catch (error) { if (alive.current && !captureMfa(error)) setIssue(errorText(error)); }
    finally { if (alive.current) setBusy(''); }
  }
  async function verify() {
    if (!user || busy) return; setBusy('verify'); setIssue('');
    try { await user.reload(); setUser(auth.currentUser); if (auth.currentUser?.emailVerified) setNotice('ยืนยันอีเมลเรียบร้อยแล้ว'); else { await sendEmailVerification(user, { url: location.origin + '/account' }); setNotice('ส่งลิงก์ยืนยันอีกครั้งแล้ว กรุณาตรวจสอบอีเมล'); } }
    catch (error) { setIssue(errorText(error)); } finally { setBusy(''); }
  }
  async function leave() {
    if (busy) return;
    setBusy('signout');
    try { await signOut(auth); navigateAuth('/login'); }
    catch (error) { if (alive.current) setIssue(errorText(error)); }
    finally { if (alive.current) setBusy(''); }
  }
  const account = !!user && !reset;
  const view = <div className="auth-shell oc-redesign">
    <header className="auth-header"><a className="auth-brand" href="/" aria-label="OpenCraft หน้าแรก" onClick={event => { event.preventDefault(); navigateAuth('/'); }}><svg viewBox="220 170 1645 330" aria-hidden="true"><image href="/assets/opencraft-wordmark.png" width="2048" height="682"/></svg></a><a className="auth-back" href="/" onClick={event => { event.preventDefault(); navigateAuth('/'); }}>กลับหน้าแนะนำ</a></header>
    <main className="auth-main">
      <div className="auth-card">
        <div className="reference-auth-intro"><img src="/assets/opencraft-symbol.png" alt="" width="76" height="76"/><h2>ทุกสิ่งที่มองหา<br/>เริ่มได้ที่นี่</h2></div>
        <div className="auth-heading"><img src="/assets/opencraft-symbol.png" alt="" width="48" height="48"/><h1>{loading ? 'บัญชี OpenCraft' : account ? 'บัญชีของคุณ' : title}</h1><p>{account ? 'พื้นที่ของสิ่งที่คุณชอบ' : reset ? 'รับลิงก์สำหรับตั้งรหัสผ่านทางอีเมล' : 'ทุกสิ่งที่มองหา เริ่มต้นได้ที่นี่'}</p></div>
        {loading ? <div className="auth-wait" role="status"><Loader2 className="auth-spinner" size={19}/>กำลังตรวจสอบบัญชี…</div> : <>
          {issue && <p className="auth-message auth-error" role="alert">{issue}</p>}
          {notice && <p className="auth-message auth-notice" role="status">{notice}</p>}
          {resolver ? <form className="auth-form auth-mfa-form" onSubmit={completeMfa}>
            <p className="auth-message">บัญชีนี้เปิดการยืนยันสองขั้นตอนแล้ว กรอกรหัส 6 หลักจากแอปยืนยันตัวตน</p>
            <label htmlFor="auth-mfa-code">รหัสยืนยัน<input id="auth-mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={mfaCode} onChange={event => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required/></label>
            <button className="auth-submit" type="submit" disabled={!!busy || mfaCode.length !== 6}>{busy === 'mfa' ? 'กำลังตรวจสอบ…' : 'ยืนยันและเข้าสู่ระบบ'}</button>
            <button type="button" className="auth-signout" onClick={() => { setResolver(null); setMfaCode(''); setIssue(''); }}>กลับไปหน้าเข้าสู่ระบบ</button>
          </form> : account ? <div className="auth-account">
            <div className="auth-avatar" aria-hidden="true">{(user.displayName || user.email || 'O').slice(0, 1).toUpperCase()}</div>
            <h2>{user.displayName || 'สมาชิก OpenCraft'}</h2>{user.email && <p className="auth-account-email">{user.email}</p>}
            {user.email && <div className="auth-verification">{user.emailVerified ? <><Check size={15}/>ยืนยันอีเมลแล้ว</> : <><Mail size={15}/>ยังไม่ได้ยืนยันอีเมล</>}</div>}
            {user.email && !user.emailVerified && <button className="auth-secondary" disabled={!!busy} onClick={verify}>{busy === 'verify' ? 'กำลังส่ง…' : 'ส่งอีเมลยืนยัน / ตรวจสอบอีกครั้ง'}</button>}
            <button className="auth-submit" onClick={() => navigateAuth('/dashboard')}>ไปหน้าหลัก</button>
            <button className="auth-signout" disabled={!!busy} onClick={() => void leave()}><LogOut size={15}/>ออกจากระบบ</button>
          </div> : <>
            {!reset && <><div className="auth-providers">{(['google', 'github', 'discord', 'line'] as Provider[]).map(provider => <button key={provider} className="auth-provider" type="button" disabled={!!busy} onClick={() => void social(provider)}><ProviderIcon provider={provider}/><span>{labels[provider]}</span>{busy === provider && <Loader2 className="auth-spinner" size={14}/>}</button>)}</div><div className="auth-divider"><span>หรือใช้อีเมล</span></div></>}
            <form className="auth-form" onSubmit={submit}>
              {signup && <label htmlFor="auth-name">ชื่อที่แสดง<input id="auth-name" name="name" autoComplete="nickname" placeholder="ชื่อของคุณ" required minLength={2} maxLength={60} disabled={!!busy}/></label>}
              <label htmlFor="auth-email">อีเมล<input id="auth-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} disabled={!!busy}/></label>
              {!reset && <label htmlFor="auth-password"><span className="auth-field-heading">รหัสผ่าน{!signup && <a href="/reset-password" onClick={event => { event.preventDefault(); navigateAuth('/reset-password'); }}>ลืมรหัสผ่าน?</a>}</span><span className="auth-password"><input id="auth-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? 'อย่างน้อย 8 ตัวอักษร' : 'รหัสผ่านของคุณ'} required minLength={signup ? 8 : 1} maxLength={128} disabled={!!busy}/><button type="button" aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label>}
              {signup && <label htmlFor="auth-confirm">ยืนยันรหัสผ่าน<input ref={confirmRef} id="auth-confirm" name="confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="กรอกรหัสผ่านอีกครั้ง" required minLength={8} maxLength={128} disabled={!!busy}/></label>}
              {signup && <><label htmlFor="auth-birth">วันเดือนปีเกิด<input id="auth-birth" name="birthDate" type="date" required max={new Date().toISOString().slice(0,10)} disabled={!!busy}/></label><p className="auth-age-note">อายุขั้นต่ำ 13 ปี อายุ 13–19 ปีต้องรอตรวจความยินยอมผู้แทนโดยชอบธรรมก่อนเปิดใช้งาน</p><label className="legal-check"><input name="terms" type="checkbox" required disabled={!!busy}/><span>ฉันยอมรับ <a href="/terms" target="_blank" rel="noopener">ข้อกำหนดการใช้บริการ</a></span></label><label className="legal-check"><input name="privacy" type="checkbox" required disabled={!!busy}/><span>ฉันอ่าน <a href="/privacy" target="_blank" rel="noopener">ประกาศความเป็นส่วนตัว</a> แล้ว การรับทราบนี้ไม่ใช่การยินยอมการตลาด</span></label></>}
              <button className="auth-submit" type="submit" disabled={!!busy}>{busy ? <Loader2 className="auth-spinner" size={17}/> : reset ? 'ส่งลิงก์ตั้งรหัสผ่าน' : signup ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}</button>
            </form>
            <p className="auth-switch">{reset ? 'จำรหัสผ่านได้แล้ว?' : signup ? 'มีบัญชีอยู่แล้ว?' : 'เพิ่งมา OpenCraft ครั้งแรก?'}<a href={signup || reset ? '/login' : '/signup'} onClick={event => { event.preventDefault(); navigateAuth(signup || reset ? '/login' : '/signup'); }}>{signup || reset ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}</a></p>
          </>}
        </>}
      </div>
    </main>
    <footer className="auth-footer"><span>© 2026 OpenCraft</span><div><a href="/terms">ข้อกำหนดการใช้บริการ</a><a href="/privacy">ความเป็นส่วนตัว</a></div></footer>
  </div>;
  return user && !reset ? <AgreementGate user={user} onSignOut={() => void leave()}><MemberGate user={user} onSignOut={() => void leave()}>{profile => memberPage || mode === 'welcome' ? <MemberHome page={memberPage || 'dashboard'} user={{ displayName: profile.displayName, email: user.email, emailVerified: user.emailVerified, photoURL: user.photoURL }} authUser={user} preferences={profile} notice={notice} issue={issue} busy={!!busy} onVerify={verify} onSignOut={() => void leave()} onDismiss={() => { setIssue(''); setNotice(''); }}/> : view}</MemberGate></AgreementGate> : view;
}
