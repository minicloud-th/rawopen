import type { User } from 'firebase/auth';
export { POLICY_VERSION, SELLER_TERMS_VERSION, ageOn } from '../../shared/policy.js';
export type AccountAccess = {current:boolean;age:number|null;guardianRequired:boolean;guardianApproved:boolean;eligible:boolean;sellerApproved:boolean;storeVerified:boolean};
export type AgreementResponse = {access:AccountAccess;version:string;acceptedAt:string|null};
export async function legalRequest<T>(user:User,path:string,method='GET',body?:unknown,signal?:AbortSignal):Promise<T> {
  const token=await user.getIdToken();
  const response=await fetch(path,{method,headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal,cache:'no-store'});
  const value=await response.json();
  if (!response.ok) {
    const messages:Record<string,string>={'verified-email-required':'ยืนยันอีเมลก่อนส่งคำขอสมัครผู้ขาย','account-approval-required':'ต้องผ่านขั้นตอนอายุและความยินยอมก่อน','age-change-requires-review':'วันเกิดถูกบันทึกแล้ว หากกรอกผิดให้ขอแก้ไขผ่านหน้าติดต่อเรา','invalid-agreement':'ตรวจสอบอายุขั้นต่ำ 13 ปี และอ่านเงื่อนไขให้ครบ','invalid-application':'ตรวจสอบข้อมูลร้านและอายุขั้นต่ำสำหรับบริการเกม 15 ปี','daily-limit':'ส่งคำขอครบจำนวนสำหรับวันนี้แล้ว กรุณาลองวันถัดไป'};
    throw new Error(messages[value.error]||'ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง');
  }
  return value as T;
}
