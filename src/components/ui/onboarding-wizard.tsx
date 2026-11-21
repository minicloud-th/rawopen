import { BrandWordmark } from "./brand-wordmark";
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2, ShoppingBag, Store, Layers } from 'lucide-react';
import { categories } from '@/lib/catalog';
import type { ProfileAnswers } from '@/lib/member-profile';

type Props = { defaultName?: string | null; onComplete: (answers: ProfileAnswers) => Promise<void>; onSignOut: () => void };
const goals = [{ id: 'buyer', title: 'ค้นหาและเลือกซื้อ', text: 'สินค้า งานดิจิทัล และบริการ', icon: ShoppingBag }, { id: 'seller', title: 'ขายสินค้าและรับงาน', text: 'เตรียมพื้นที่สำหรับร้านของคุณ', icon: Store }, { id: 'both', title: 'ทั้งซื้อและขาย', text: 'เปิดรับทุกความเป็นไปได้', icon: Layers }] as const;

export default function OnboardingWizard({ defaultName, onComplete, onSignOut }: Props) {
  const [step, setStep] = useState(0), [name, setName] = useState(defaultName || ''), [goal, setGoal] = useState<ProfileAnswers['goal'] | ''>('');
  const [interests, setInterests] = useState<string[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null), reduce = useReducedMotion();
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [step]);
  const titles = ['ให้เราเรียกคุณว่าอะไร?', 'คุณอยากเริ่มจากอะไร?', 'สนใจเรื่องไหนเป็นพิเศษ?'];
  async function next(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setError('');
    if (step === 0 && (name.trim().length < 2 || name.trim().length > 60)) { setError('ใช้ชื่อที่แสดง 2–60 ตัวอักษร'); return; }
    if (step === 1 && !goal) { setError('เลือกรูปแบบการใช้งานก่อนดำเนินการต่อ'); return; }
    if (step < 2) { setStep(value => value + 1); return; }
    if (!goal || !interests.length) { setError('เลือกอย่างน้อย 1 หมวดที่สนใจ'); return; }
    setBusy(true);
    try { await onComplete({ displayName: name.trim(), goal, interests }); }
    catch (issue) { setError(issue instanceof Error ? issue.message : 'ยังบันทึกข้อมูลไม่ได้ กรุณาลองอีกครั้ง'); }
    finally { setBusy(false); }
  }
  return <div className="welcome-shell oc-redesign">
    <header className="welcome-header"><a href="/" aria-label="OpenCraft หน้าแรก"><BrandWordmark/></a><button disabled={busy} onClick={onSignOut}>ออกจากระบบ</button></header>
    <main className="welcome-main"><div className="welcome-progress" aria-label={`ขั้นตอน ${step + 1} จาก 3`}>{[0, 1, 2].map(index => <span key={index} className={index <= step ? 'is-done' : ''}/>)}</div>
      <p className="welcome-step">เริ่มต้นกับ OpenCraft · {step + 1} / 3</p>
      <h1 ref={heading} tabIndex={-1}>{titles[step]}</h1><p className="welcome-intro">{step === 0 ? 'ชื่อนี้จะแสดงในบัญชีและพื้นที่ของคุณ' : step === 1 ? 'เลือกสิ่งที่เหมาะกับการเริ่มต้นของคุณ' : 'เลือกได้ 1–5 หมวด เพื่อจัดพื้นที่เริ่มต้นให้ตรงกับคุณ'}</p>
      <form onSubmit={event => void next(event)}>
        <motion.div key={step} className="welcome-fields" initial={reduce ? false : { opacity: 0, x: 14, filter: 'blur(4px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : .2 }}>
          {step === 0 && <label className="welcome-name" htmlFor="welcome-name">ชื่อที่แสดง<input id="welcome-name" autoComplete="nickname" value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={60} required disabled={busy} placeholder="ชื่อที่คุณอยากให้เราเรียก"/></label>}
          {step === 1 && <fieldset className="welcome-goals"><legend className="visually-hidden">รูปแบบการใช้งาน</legend>{goals.map(item => <label key={item.id} className={goal === item.id ? 'is-selected' : ''}><input type="radio" name="goal" value={item.id} checked={goal === item.id} onChange={() => setGoal(item.id)} required disabled={busy}/><item.icon size={23}/><span><strong>{item.title}</strong><small>{item.text}</small></span><i>{goal === item.id && <Check size={14}/>}</i></label>)}</fieldset>}
          {step === 2 && <fieldset className="welcome-interests"><legend className="visually-hidden">หมวดที่สนใจ</legend>{categories.filter(category => category.id !== 'all').map(category => <label key={category.id} className={interests.includes(category.id) ? 'is-selected' : ''}><input type="checkbox" name="interests" value={category.id} checked={interests.includes(category.id)} disabled={busy || (!interests.includes(category.id) && interests.length >= 5)} onChange={() => setInterests(current => current.includes(category.id) ? current.filter(id => id !== category.id) : [...current, category.id])}/><span>{category.name}</span>{interests.includes(category.id) && <Check size={15}/>}</label>)}</fieldset>}
        </motion.div>
        {error && <p className="welcome-error" role="alert">{error}</p>}
        <div className="welcome-actions">{step > 0 && <button className="welcome-back" type="button" disabled={busy} onClick={() => { setStep(value => value - 1); setError(''); }}><ArrowLeft size={16}/>ย้อนกลับ</button>}<button className="welcome-next" type="submit" disabled={busy || (step === 1 && !goal) || (step === 2 && !interests.length)}>{busy ? <><Loader2 className="auth-spinner" size={17}/>กำลังบันทึก…</> : <>{step === 2 ? 'เริ่มใช้งาน OpenCraft' : 'ต่อไป'}<ArrowRight size={16}/></>}</button></div>
      </form><p className="welcome-note">คำตอบนี้ใช้จัดพื้นที่เริ่มต้นให้คุณ การเลือกขายยังไม่เปิดร้านจริง</p>
    </main>
  </div>;
}
