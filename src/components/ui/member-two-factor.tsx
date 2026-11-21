import { useState, type FormEvent } from "react";
import { EmailAuthProvider, GithubAuthProvider, GoogleAuthProvider, TotpMultiFactorGenerator, multiFactor, reauthenticateWithCredential, reauthenticateWithPopup, type TotpSecret, type User } from "firebase/auth";
import { ShieldCheck } from "lucide-react";

export function MemberTwoFactor({ user, emailVerified, enabled, onUpdated }: { user?: User | null; emailVerified: boolean; enabled: boolean; onUpdated: () => void }) {
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState<TotpSecret | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const providerIds = user?.providerData.map(item => item.providerId) || [];

  async function begin() {
    if (!user || !emailVerified || busy) return;
    setBusy(true); setMessage(""); setError(false);
    try {
      if (providerIds.includes("password")) {
        if (!user.email || !password) throw new Error("กรอกรหัสผ่านเพื่อยืนยันตัวตนอีกครั้ง");
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
        setPassword("");
      } else if (providerIds.includes("google.com")) await reauthenticateWithPopup(user, new GoogleAuthProvider());
      else if (providerIds.includes("github.com")) await reauthenticateWithPopup(user, new GithubAuthProvider());
      else throw new Error("ช่องทางเข้าสู่ระบบนี้ยังไม่รองรับการยืนยันซ้ำเพื่อเปิด TOTP กรุณาเชื่อมบัญชี Google หรือ GitHub ก่อน");
      const generated = await TotpMultiFactorGenerator.generateSecret(await multiFactor(user).getSession());
      setSecret(generated);
      setMessage("เพิ่ม OpenCraft ในแอปยืนยันตัวตน แล้วกรอกรหัส 6 หลักที่แอปแสดง");
    } catch (reason) {
      setError(true);
      const code = (reason as { code?: string }).code;
      setMessage(code === "auth/operation-not-allowed" ? "โปรเจกต์ Firebase ยังไม่ได้เปิดผู้ให้บริการ TOTP ใน Firebase Authentication" : reason instanceof Error ? reason.message : "เริ่มตั้งค่าไม่สำเร็จ กรุณาลองใหม่");
    } finally { setBusy(false); }
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !secret || !/^\d{6}$/.test(code) || busy) return;
    setBusy(true); setError(false); setMessage("");
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, code);
      await multiFactor(user).enroll(assertion, "OpenCraft");
      await user.reload(); await user.getIdToken(true);
      setSecret(null); setCode(""); setMessage("เปิดการยืนยันสองขั้นตอนแล้ว"); onUpdated();
    } catch (reason) {
      setError(true);
      const code = (reason as { code?: string }).code;
      setMessage(code === "auth/invalid-verification-code" ? "รหัสไม่ถูกต้องหรือหมดอายุ ลองใช้รหัสใหม่จากแอป" : code === "auth/requires-recent-login" ? "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง" : "ยืนยันรหัสไม่สำเร็จ กรุณาตรวจสอบแอปและลองอีกครั้ง");
    } finally { setBusy(false); }
  }

  if (enabled) return <div className="member-security-success"><ShieldCheck size={19}/><div><strong>เปิดการยืนยันสองขั้นตอนแล้ว</strong><span>ผูกแอปยืนยันตัวตนไว้กับบัญชี OpenCraft</span></div></div>;
  if (!user) return <p className="member-security-inline-note">ตัวอย่างหน้านี้ไม่เชื่อมบัญชีจริง เข้าสู่ระบบเพื่อจัดการการยืนยันสองขั้นตอน</p>;
  if (!emailVerified) return <p className="member-security-inline-note">ยืนยันอีเมลก่อน แล้วกลับมาเปิดการยืนยันสองขั้นตอน</p>;
  return <div className="member-2fa">
    {!secret ? <>
      {providerIds.includes("password") && <label>รหัสผ่านปัจจุบัน<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" maxLength={128}/></label>}
      <button type="button" className="member-page-action" onClick={() => void begin()} disabled={busy}>{busy ? "กำลังเตรียม…" : "ตั้งค่าแอปยืนยันตัวตน"}</button>
    </> : <form onSubmit={confirm}>
      <label>คีย์สำหรับเพิ่มในแอปยืนยันตัวตน<input className="member-2fa-secret" readOnly value={secret.secretKey} onFocus={event => event.currentTarget.select()} autoComplete="off"/></label>
      <p>เก็บคีย์นี้ไว้ในแอปยืนยันตัวตนส่วนตัว อย่าส่งต่อให้ผู้อื่น</p>
      <label>รหัส 6 หลัก<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required/></label>
      <button className="member-page-action" type="submit" disabled={busy || code.length !== 6}>{busy ? "กำลังยืนยัน…" : "เปิดการยืนยันสองขั้นตอน"}</button>
      <button className="member-2fa-cancel" type="button" onClick={() => { setSecret(null); setCode(""); setMessage(""); }}>ยกเลิก</button>
    </form>}
    {message && <p role={error ? "alert" : "status"} className={error ? "member-2fa-message is-error" : "member-2fa-message"}>{message}</p>}
  </div>;
}
