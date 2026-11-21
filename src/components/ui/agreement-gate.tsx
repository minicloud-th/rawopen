import { BrandWordmark } from "./brand-wordmark";
import { useEffect,useState,type FormEvent,type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { POLICY_VERSION,ageOn,legalRequest,type AgreementResponse } from '@/lib/legal';
import '@/legal.css';

export default function AgreementGate({user,onSignOut,children}:{user:User;onSignOut:()=>void;children:ReactNode}) {
  const [data,setData]=useState<AgreementResponse|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false),[attempt,setAttempt]=useState(0);
  const [birthDate,setBirthDate]=useState(''),[accepted,setAccepted]=useState(false),[notice,setNotice]=useState(false);
  useEffect(()=>{const update=()=>setAttempt(value=>value+1);addEventListener('opencraft:agreement-updated',update);return()=>removeEventListener('opencraft:agreement-updated',update)},[]);
  useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');void legalRequest<AgreementResponse>(user,'/api/agreements','GET',undefined,controller.signal).then(setData).catch(error=>{if(!controller.signal.aborted)setError(error.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return()=>controller.abort()},[user,attempt]);
  async function submit(event:FormEvent){event.preventDefault();if(busy)return;setBusy(true);setError('');try{setData(await legalRequest<AgreementResponse>(user,'/api/agreements','PUT',{birthDate,acceptedTerms:accepted,acknowledgedPrivacy:notice,termsVersion:POLICY_VERSION,privacyVersion:POLICY_VERSION}));}catch(reason){setError(reason instanceof Error?reason.message:'บันทึกไม่สำเร็จ')}finally{setBusy(false)}}
  if(loading)return <div className="member-gate-wait" role="status">กำลังตรวจสอบข้อมูลการสมัคร…</div>;
  if(data?.access.eligible)return children;
  const age=ageOn(birthDate);
  return <div className="legal-gate oc-redesign"><a href="/" className="legal-brand" aria-label="OpenCraft หน้าแรก"><BrandWordmark/></a><main>
    <h1>{data?.access.current?'รอความยินยอมจากผู้ปกครอง':'ก่อนเริ่มใช้งาน'}</h1>
    {data?.access.current?<><p>บัญชีอายุ 13–19 ปีต้องผ่านการตรวจความยินยอมผู้แทนโดยชอบธรรมตามนโยบาย OpenCraft ก่อนเปิดใช้งาน การกดรับทราบของผู้สมัครไม่ใช่การอนุมัติจากผู้ปกครอง</p><p>ขณะนี้ยังไม่เปิดอัปโหลดเอกสารยืนยันตัวตน กรุณาอย่าส่งบัตรประชาชน ภาพใบหน้า หรือข้อมูลธนาคารผ่านข้อความทั่วไป</p><div className="legal-actions"><a href="/legal/guardians">อ่านขั้นตอนสำหรับผู้ปกครอง</a><a href="/contact">ติดต่อเรื่องความยินยอม</a><button type="button" onClick={()=>{void user.getIdToken(true).then(()=>setAttempt(v=>v+1)).catch(()=>setError('ตรวจสอบสถานะไม่สำเร็จ กรุณาลองอีกครั้ง'))}}>ตรวจสอบสถานะอีกครั้ง</button></div></>:<form onSubmit={submit}>
      <p>สมัครได้เมื่ออายุครบ 13 ปี ผู้สมัครอายุ 13–19 ปีจะอยู่ในสถานะรอตรวจความยินยอมผู้ปกครองก่อนใช้งาน การสมัครสมาชิกไม่ได้เปิดร้านค้า</p>
      <label className="legal-field">วันเดือนปีเกิด<input type="date" value={birthDate} max={new Date().toISOString().slice(0,10)} required onChange={event=>setBirthDate(event.target.value)}/></label>
      {birthDate&&age!==null&&age<13&&<p role="alert">ยังไม่สามารถสมัครได้ ต้องอายุครบ 13 ปี</p>}
      <label className="legal-check"><input type="checkbox" checked={accepted} onChange={event=>setAccepted(event.target.checked)} required/><span>ฉันอ่านและยอมรับ <a href="/terms" target="_blank" rel="noopener">ข้อกำหนดการใช้บริการ</a> รุ่น {POLICY_VERSION}</span></label>
      <label className="legal-check"><input type="checkbox" checked={notice} onChange={event=>setNotice(event.target.checked)} required/><span>ฉันอ่าน <a href="/privacy" target="_blank" rel="noopener">ประกาศความเป็นส่วนตัว</a> แล้ว การรับทราบนี้ไม่ใช่ความยินยอมเพื่อการตลาด</span></label>
      <button className="member-page-action" disabled={busy||!accepted||!notice||age===null||age<13}>{busy?'กำลังบันทึก…':'บันทึกและตรวจสอบสิทธิ์'}</button>
    </form>}
    {error&&<p className="legal-error" role="alert">{error}<button type="button" onClick={()=>setAttempt(v=>v+1)}>ลองโหลดอีกครั้ง</button></p>}
    <button className="legal-signout" onClick={onSignOut}>ออกจากระบบ</button>
  </main></div>;
}
