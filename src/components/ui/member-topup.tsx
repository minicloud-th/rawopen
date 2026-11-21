import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CreditCard, History, QrCode, Wallet } from 'lucide-react';
import { MarketplaceError, previewTopup } from '@/lib/marketplace-api';
import '@/member-topup.css';

const amounts = [100, 300, 500, 1000];
const methods = [
  { id: 'promptpay', label: 'PromptPay', description: 'สแกนคิวอาร์โค้ด', icon: QrCode },
  { id: 'card', label: 'บัตรเครดิต / เดบิต', description: 'ชำระด้วยบัตร', icon: CreditCard },
] as const;
type Method = typeof methods[number]['id'];
type Review = { cents: number; method: Method };
const formatAmount = (cents: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2 }).format(cents / 100);

export default function MemberTopup() {
  const [amount, setAmount] = useState('500'), [method, setMethod] = useState<Method>('promptpay');
  const [issue, setIssue] = useState(''), [review, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null), reviewPanel = useRef<HTMLDivElement>(null);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => { if (issue && !busy) input.current?.focus(); }, [issue, busy]);
  useEffect(() => { if (review) reviewPanel.current?.focus(); }, [review]);
  const changeAmount = (value: string) => { setAmount(value); setIssue(''); setReview(null); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    setBusy(true); setIssue(''); setReview(null);
    try {
      const result = await previewTopup(amount, method, controller.signal);
      if (!controller.signal.aborted) setReview({ cents: result.amountSatang, method: result.method });
    } catch (error) {
      if (!controller.signal.aborted) setIssue(error instanceof MarketplaceError && error.code === 'invalid-amount' ? 'ระบุจำนวนเงินมากกว่า 0 และทศนิยมไม่เกิน 2 ตำแหน่ง' : 'ยังตรวจสอบรายการไม่ได้ กรุณาลองอีกครั้ง');
    } finally { if (!controller.signal.aborted) setBusy(false); }
  };
  return <div className="member-topup">
    <p className="topup-availability"><span aria-hidden="true"/>ระบบเติมเงินยังไม่เปิดรับชำระเงินจริง</p>
    <div className="topup-layout"><form className="topup-form" onSubmit={submit} noValidate aria-busy={busy}>
      <fieldset disabled={busy}><legend>เลือกจำนวนเงิน</legend><div className="topup-amounts">{amounts.map(value => <button type="button" key={value} aria-pressed={amount === String(value)} onClick={() => changeAmount(String(value))}><span>฿</span>{value.toLocaleString('th-TH')}</button>)}</div></fieldset>
      <label className="topup-custom" htmlFor="topup-amount">หรือระบุจำนวนเอง<span className={`topup-amount-input ${issue ? 'has-error' : ''}`}><span aria-hidden="true">฿</span><input ref={input} id="topup-amount" name="amount" disabled={busy} inputMode="decimal" autoComplete="off" maxLength={12} value={amount} onChange={event => changeAmount(event.target.value)} aria-invalid={!!issue} aria-describedby={issue ? 'topup-amount-error' : 'topup-amount-hint'}/><span aria-hidden="true">บาท</span></span></label>
      {issue ? <p id="topup-amount-error" className="topup-field-error" role="alert">{issue}</p> : <p id="topup-amount-hint" className="topup-field-hint">จำนวนเงินบาท ระบุทศนิยมได้ 2 ตำแหน่ง</p>}
      <fieldset className="topup-methods" disabled={busy}><legend>ช่องทางชำระเงิน</legend>{methods.map(({ id, label, description, icon: Icon }) => <label className={method === id ? 'is-selected' : ''} key={id}><Icon size={23} strokeWidth={1.4}/><span><strong>{label}</strong><small>{description}</small></span><input type="radio" name="topup-method" value={id} checked={method === id} onChange={() => { setMethod(id); setReview(null); }}/></label>)}</fieldset>
      <button className="member-page-action topup-review-button" type="submit" disabled={busy}>{busy ? 'กำลังตรวจสอบ…' : 'ตรวจสอบรายการ'}<ArrowRight size={16}/></button>
      {review && <div className="topup-review" ref={reviewPanel} tabIndex={-1} role="region" aria-labelledby="topup-review-title"><h2 id="topup-review-title">ตรวจสอบรายการเติมเงิน</h2><dl><div><dt>จำนวนเงินที่เลือก</dt><dd>{formatAmount(review.cents)}</dd></div><div><dt>ช่องทาง</dt><dd>{methods.find(item => item.id === review.method)?.label}</dd></div></dl><p>ยังไม่เปิดรับชำระเงิน รายการนี้ยังไม่ได้สร้างคำสั่งเติมเงินหรือเพิ่มยอดเข้ากระเป๋า</p><button type="button" className="member-page-action" disabled>ยังไม่เปิดรับชำระเงิน</button></div>}
    </form><aside className="topup-wallet" aria-label="สถานะกระเป๋าเงิน"><Wallet size={25} strokeWidth={1.3}/><h2>กระเป๋าเงินของคุณ</h2><span className="topup-wallet-status">ยังไม่เปิดใช้งาน</span><p>ยอดเงินจะแสดงเมื่อระบบเติมเงินพร้อมใช้งาน</p><div className="topup-history"><h3><History size={17}/>ประวัติการเติมเงิน</h3><p>ยังไม่เชื่อมต่อประวัติการเติมเงิน</p></div></aside></div>
  </div>;
}
