import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUpRight, ImagePlus, Loader2, Plus, ShieldCheck, Store, X } from "lucide-react";
import type { User } from "firebase/auth";
import type { MemberIdentity } from "@/lib/member-profile";
import type { MemberPage } from "@/lib/member-navigation";
import type { Showcase, ShowcaseResult, ShowcaseSecurity, ShowcaseWork } from "@/lib/showcase";
import { emptyShowcase } from "@/lib/showcase";
import { VerifiedBadge } from "./verified-badge";
import { MemberTwoFactor } from "./member-two-factor";

type OnNavigate = (page: MemberPage) => void;
const fallbackShowcase = (user: MemberIdentity, data?: ShowcaseResult | null): Showcase => data?.showcase || { ...emptyShowcase, displayName: user.displayName || "สมาชิก OpenCraft", photoURL: user.photoURL || "" };

export function MemberProfilePage({ user, data, loading, error, security, onNavigate, onRetry }: { user: MemberIdentity; data?: ShowcaseResult | null; loading: boolean; error: string; security: ShowcaseSecurity; onNavigate: OnNavigate; onRetry: () => void }) {
  const [tab, setTab] = useState<"works" | "store">("works");
  const profile = fallbackShowcase(user, data);
  const secure = security.emailVerified && security.mfaEnabled;
  const tabs = useMemo(() => [{ id: "works" as const, label: "ผลงาน" }, { id: "store" as const, label: "ร้านค้า" }], []);
  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const next = tab === "works" ? "store" : "works"; setTab(next);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-profile-tab="${next}"]`)?.focus());
  };
  if(!security.sellerApproved) return <div className="social-profile-empty"><h2>โปรไฟล์ร้านยังไม่เปิดใช้งาน</h2><p>พื้นที่ร้านและผลงานจะแสดงเมื่อสมัครและผ่านการอนุมัติผู้ขายแล้ว</p><button onClick={()=>onNavigate('account')}>ตั้งค่าบัญชีส่วนตัว</button></div>;
  return <section className="social-profile" aria-labelledby="social-profile-title">
    <div className="social-profile-header">
      <div className={`social-profile-avatar ${secure ? "is-secure" : "is-pending"}`}>
        {profile.photoURL ? <img src={profile.photoURL} alt="" referrerPolicy="no-referrer"/> : <span>{profile.displayName.slice(0,1).toUpperCase()}</span>}
      </div>
      <div className="social-profile-summary">
        <div className="social-profile-title-row"><h2 id="social-profile-title">{profile.displayName || "สมาชิก OpenCraft"}</h2><button onClick={() => onNavigate("account")} className="social-edit-button">แก้ไขโปรไฟล์</button><button className="social-view-store" onClick={() => { setTab("store"); document.querySelector("[data-profile-tab=store]")?.scrollIntoView({ block: "nearest" }); }}>ดูร้านค้า</button></div>
        {profile.bio && <p>{profile.bio}</p>}
        {!secure && <div className="social-security-reminder"><span className="social-reminder-dot"/><span>ทำโปรไฟล์ให้ปลอดภัย: ยืนยันอีเมลและเปิดการยืนยันสองขั้นตอน</span><button onClick={() => onNavigate("security")}>ทำต่อ<ArrowUpRight size={14}/></button></div>}
      </div>
    </div>
    <div className="social-profile-tabs" role="tablist" aria-label="เนื้อหาโปรไฟล์" onKeyDown={onTabKey}>{tabs.map(item => <button id={`profile-tab-${item.id}`} key={item.id} data-profile-tab={item.id} role="tab" aria-selected={tab===item.id} aria-controls="profile-tab-content" tabIndex={tab===item.id?0:-1} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
    <div id="profile-tab-content" role="tabpanel" aria-labelledby={`profile-tab-${tab}`} className="social-profile-content">
      {loading ? <p className="social-profile-empty" role="status">กำลังโหลดโปรไฟล์…</p> : error ? <div className="social-profile-empty" role="alert"><p>{error}</p><button onClick={onRetry}>ลองอีกครั้ง</button></div> : tab === "works" ? profile.works.length ? <div className="social-work-grid">{profile.works.map((work,index)=><article key={`${work.title}-${index}`}><img src={work.image} alt="" loading="lazy"/><div><h3>{work.title}</h3>{work.description&&<p>{work.description}</p>}</div></article>)}</div> : <div className="social-profile-empty"><ImagePlus size={25}/><h3>ยังไม่มีผลงาน</h3><p>เพิ่มผลงานของคุณจากหน้าแก้ไขโปรไฟล์</p><button onClick={() => onNavigate("account")}>เพิ่มผลงาน</button></div>
      : <div className="social-store-card"><div className="social-store-icon"><Store size={21}/></div><div className="social-store-heading"><div><h3>{profile.storeName || "ร้านค้าของฉัน"}</h3>{security.storeVerified ? <span className="social-store-verified"><VerifiedBadge variant="static" size={18} aria-label="ร้านค้ายืนยันแล้ว"/>ร้านค้ายืนยันแล้ว</span> : <span className="social-store-unverified">ร้านค้ายังไม่ได้รับการยืนยัน</span>}</div><button onClick={() => onNavigate("seller")}>จัดการร้าน<ArrowUpRight size={14}/></button></div><p>{profile.storeBio || "เพิ่มชื่อและรายละเอียดร้านได้จากหน้าแก้ไขโปรไฟล์"}</p>{!profile.storeName&&!profile.storeBio&&<button className="social-add-store" onClick={() => onNavigate("account")}>ตั้งค่าร้านค้า</button>}</div>}
    </div>
  </section>;
}

export function ProfileSettings({ data, loading, error, saving, onSave, onRetry, onCancel }: { data?: ShowcaseResult | null; loading: boolean; error: string; saving: boolean; onSave: (value: Showcase) => Promise<void>; onRetry: () => void; onCancel: () => void }) {
  const initial = data?.showcase || emptyShowcase;
  const [form, setForm] = useState<Showcase>(initial);
  const [message, setMessage] = useState(""); const [saveError, setSaveError] = useState(false);
  useEffect(() => { if (data?.showcase) setForm(data.showcase); }, [data?.showcase]);
  const set = <K extends keyof Showcase>(key: K, value: Showcase[K]) => setForm(current => ({ ...current, [key]: value }));
  const editWork = (index: number, key: keyof ShowcaseWork, value: string) => set("works", form.works.map((work, i) => i === index ? { ...work, [key]: value } : work));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setSaveError(false);
    try { await onSave(form); setMessage("บันทึกโปรไฟล์แล้ว"); }
    catch (reason) { setSaveError(true); setMessage(reason instanceof Error ? reason.message : "บันทึกไม่สำเร็จ"); }
  }
  if (loading) return <div className="social-settings-loading" role="status"><Loader2 size={18} className="member-2fa-spinner"/>กำลังโหลดข้อมูลโปรไฟล์…</div>;
  if (error) return <div className="social-profile-empty" role="alert"><p>{error}</p><button onClick={onRetry}>ลองอีกครั้ง</button></div>;
  return <form className="social-settings" onSubmit={submit}>
    <label>ชื่อที่แสดง<input value={form.displayName} minLength={2} maxLength={60} onChange={event=>set("displayName",event.target.value)} required/></label>
    <label>รูปโปรไฟล์ · URL รูปภาพ HTTPS<input type="url" value={form.photoURL} maxLength={2048} placeholder="https://…" onChange={event=>set("photoURL",event.target.value)}/></label>
    <label>แนะนำตัว<textarea value={form.bio} maxLength={240} rows={3} placeholder="เล่าให้คนอื่นรู้จักคุณสั้น ๆ" onChange={event=>set("bio",event.target.value)}/><span>{form.bio.length}/240</span></label>
    {data?.security.sellerApproved&&<><div className="social-settings-section"><div><h3>ร้านค้าของคุณ</h3><p>ข้อมูลร้านนี้แสดงในแท็บร้านค้าบนโปรไฟล์</p></div></div>
    <label>ชื่อร้าน<input value={form.storeName} maxLength={60} placeholder="ชื่อร้าน" onChange={event=>set("storeName",event.target.value)}/></label>
    <label>เกี่ยวกับร้าน<textarea value={form.storeBio} maxLength={500} rows={3} placeholder="สินค้าหรือบริการที่ร้านนำเสนอ" onChange={event=>set("storeBio",event.target.value)}/></label>
    <div className="social-settings-section"><div><h3>ผลงาน</h3><p>เพิ่มภาพที่เข้าถึงได้ผ่าน URL HTTPS จำนวนไม่เกิน 6 รายการ</p></div><button type="button" onClick={()=>set("works",[...form.works,{title:"",description:"",image:""}])} disabled={form.works.length>=6}><Plus size={15}/>เพิ่มผลงาน</button></div>
    {form.works.map((work,index)=><fieldset className="social-work-editor" key={index}><legend>ผลงาน {index+1}</legend><button type="button" className="social-work-remove" aria-label={`ลบผลงาน ${index+1}`} onClick={()=>set("works",form.works.filter((_,i)=>i!==index))}><X size={15}/></button><label>ชื่อผลงาน<input value={work.title} minLength={2} maxLength={80} onChange={event=>editWork(index,"title",event.target.value)} required/></label><label>URL รูปภาพ HTTPS<input type="url" value={work.image} maxLength={2048} placeholder="https://…" onChange={event=>editWork(index,"image",event.target.value)} required/></label><label>รายละเอียด<textarea value={work.description} maxLength={240} rows={2} onChange={event=>editWork(index,"description",event.target.value)}/></label></fieldset>)}
    </>}
    <div className="social-settings-actions"><button type="button" className="social-cancel" onClick={onCancel}>ยกเลิก</button><button className="member-page-action" disabled={saving}>{saving?"กำลังบันทึก…":"บันทึกการเปลี่ยนแปลง"}</button>{message&&<p role={saveError?"alert":"status"} className={saveError?"is-error":""}>{message}</p>}</div>
  </form>;
}

export function SecurityChecklist({ user, authUser, security, onVerify, onRefresh }: { user: MemberIdentity; authUser?: User | null; security: ShowcaseSecurity; onVerify?: () => void; onRefresh: () => void }) {
  const emailDone = security.emailVerified;
  const twoFactorDone = security.mfaEnabled;
  return <div className="social-security-page">
    <p className="member-page-lead">ทำสองขั้นตอนนี้ให้ครบ เพื่อแสดงสถานะโปรไฟล์ที่ปลอดภัย</p>
    <section className={`social-security-step ${emailDone?"is-done":"is-pending"}`}><span className="social-step-icon">{emailDone?"✓":"1"}</span><div><h2>ยืนยันอีเมล</h2><p>{user.email || "บัญชีที่เชื่อมต่อกับผู้ให้บริการ"}</p></div>{emailDone?<span className="social-step-status">ยืนยันแล้ว</span>:<button onClick={onVerify} disabled={!user.email||!onVerify}>ส่งอีเมลยืนยัน / ตรวจสอบอีกครั้ง</button>}</section>
    <section className={`social-security-step ${twoFactorDone?"is-done":"is-pending"}`}><span className="social-step-icon">{twoFactorDone?"✓":"2"}</span><div><h2>การยืนยันสองขั้นตอน</h2><p>ใช้แอปยืนยันตัวตนสร้างรหัสครั้งเดียว</p></div>{twoFactorDone&&<span className="social-step-status">เปิดแล้ว</span>}</section>
    <MemberTwoFactor user={authUser} emailVerified={emailDone} enabled={twoFactorDone} onUpdated={onRefresh}/>
    {security.sellerApproved&&!security.storeVerified&&<p className="social-store-review-note">ติ๊กฟ้าร้านค้าจะปรากฏหลังทีมงานตรวจสอบและยืนยันร้านค้าแล้ว</p>}
  </div>;
}
