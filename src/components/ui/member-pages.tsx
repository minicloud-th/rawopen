import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, Bell, Check, Heart, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { changeCartQuantity, removeFromCart } from '@/commerce.js';
import { categories, products } from '@/lib/catalog';
import { memberPaths, memberTitles, type MemberPage, type SettingsPage } from '@/lib/member-navigation';
import type { MemberIdentity } from '@/lib/member-profile';
import type { User } from 'firebase/auth';
import type { ShowcaseSecurity } from '@/lib/showcase';
import { useShowcase } from '@/lib/showcase';
import { useMarket } from '@/lib/use-market';
import { useCartQuote } from '@/lib/marketplace-api';
import MemberTopup from './member-topup';
import { MemberProfilePage } from './member-profile-page';
import SellerApplication from './seller-application';
import { MarketProductCard } from './market-product-card';
import '@/member-pages.css';

type Props = {
  page: Exclude<MemberPage, 'dashboard' | SettingsPage>;
  user: MemberIdentity;
  onNavigate: (page: MemberPage) => void;
  authUser?: User | null;
  showcase: ReturnType<typeof useShowcase>;
  security: ShowcaseSecurity;
};
const money = (value: number) => `฿${value.toLocaleString('th-TH')}`;
const productDetails = (id: string) => document.dispatchEvent(new CustomEvent('opencraft:open-product', { detail: { id } }));

function PageLink({ page, onNavigate, children, className = '' }: { page: MemberPage; onNavigate: Props['onNavigate']; children: ReactNode; className?: string }) {
  return <a className={className} href={memberPaths[page]} onClick={event => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); onNavigate(page); }}>{children}</a>;
}
function EmptyState({ icon, title, text, onNavigate }: { icon: ReactNode; title: string; text: string; onNavigate: Props['onNavigate'] }) {
  return <div className="member-page-empty"><span aria-hidden="true">{icon}</span><h2>{title}</h2><p>{text}</p><PageLink page="dashboard" className="member-page-action" onNavigate={onNavigate}>ค้นพบสินค้า<ArrowUpRight size={16}/></PageLink></div>;
}
function SavedPage({ onNavigate }: Pick<Props, 'onNavigate'>) {
  const market = useMarket();
  const saved = products.filter(item => market.favorites.includes(item.id));
  return saved.length ? <><p className="member-page-count">เก็บไว้ {saved.length} รายการ</p><div className="member-saved-grid">{saved.map(item => <MarketProductCard key={item.id} item={item} saved/>)}</div><p className="member-page-note">รายการที่บันทึกจะเก็บไว้ในเบราว์เซอร์นี้</p></> : <EmptyState icon={<Heart size={32}/>} title="เก็บสิ่งที่ชอบไว้ตรงนี้" text="กดหัวใจบนสินค้าที่สนใจ แล้วกลับมาเลือกต่อได้ทุกเมื่อ" onNavigate={onNavigate}/>;
}
function CartPage({ onNavigate }: Pick<Props, 'onNavigate'>) {
  const market = useMarket();
  const quote = useCartQuote(market.cart);
  const lineAmount = (id: string) => { const line = quote.data?.items.find(item => item.id === id); return line ? money(line.lineSatang / 100) : '—'; };
  const items = market.cart.flatMap(entry => { const product = products.find(item => item.id === entry.id); return product ? [{ ...entry, product }] : []; });
  if (!items.length) return <EmptyState icon={<ShoppingBag size={32}/>} title="ตะกร้ายังว่างอยู่" text="เลือกสินค้า งานดิจิทัล หรือบริการที่สนใจ มาเก็บไว้ด้วยกัน" onNavigate={onNavigate}/>;
  return <div className="member-cart-layout"><div className="member-cart-lines">{items.map(({ product, qty, id }) => <article className="member-cart-line" key={id}>
    <button className="member-cart-image" aria-label={`ดู ${product.title}`} onClick={() => productDetails(id)}><img src={`/assets/${product.image}`} alt="" width="100" height="100"/></button>
    <div className="member-cart-description"><button className="member-cart-title" onClick={() => productDetails(id)}>{product.title}</button><p>{product.seller}</p><div className="member-cart-options">{product.type === 'physical' ? <div className="member-cart-quantity"><button aria-label={`ลดจำนวน ${product.title}`} disabled={qty === 1} onClick={() => changeCartQuantity(id, -1)}><Minus size={14}/></button><span aria-label={`จำนวน ${qty} ชิ้น`}>{qty}</span><button aria-label={`เพิ่มจำนวน ${product.title}`} disabled={qty === 9} onClick={() => changeCartQuantity(id, 1)}><Plus size={14}/></button></div> : <span className="member-cart-single">1 รายการ</span>}<button className="member-cart-remove" aria-label={`นำ ${product.title} ออกจากตะกร้า`} onClick={() => removeFromCart(id)}><Trash2 size={15}/></button></div></div>
    <span className="member-cart-price">{lineAmount(id)}</span>
  </article>)}</div><aside className="member-cart-summary" aria-label="สรุปตะกร้า"><h2>รายการของคุณ</h2><div><span>{market.cartCount} รายการ</span><strong aria-live="polite">{quote.loading ? 'กำลังคำนวณ…' : quote.data ? money(quote.data.totalSatang / 100) : '—'}</strong></div>{quote.error && <p role="alert">ยังตรวจสอบยอดไม่ได้ <button className="member-quote-retry" onClick={quote.retry}>ลองอีกครั้ง</button></p>}<p>รายการตัวอย่าง ยังไม่มีการสั่งซื้อหรือเรียกเก็บเงิน ตะกร้าจะถูกเก็บไว้ในเบราว์เซอร์นี้</p><PageLink page="dashboard" onNavigate={onNavigate} className="member-page-action">เลือกสินค้าเพิ่มเติม<ArrowUpRight size={15}/></PageLink></aside></div>;
}

type StoreDraft = { name: string; category: string; type: string; description: string };
function readStoreDraft(): StoreDraft {
  const empty = { name: '', category: 'digital', type: 'digital', description: '' };
  try {
    const value = JSON.parse(localStorage.getItem('opencraft-seller-draft') || 'null');
    if (!value || typeof value !== 'object') return empty;
    return { name: typeof value.name === 'string' ? value.name : '', category: categories.some(item => item.id !== 'all' && item.id === value.category) ? value.category : 'digital', type: ['physical', 'digital', 'service'].includes(value.type) ? value.type : 'digital', description: typeof value.description === 'string' ? value.description : '' };
  } catch { return empty; }
}
function StorePage({ showcase, onNavigate }: Pick<Props, 'showcase' | 'onNavigate'>) {
  const [draft, setDraft] = useState(readStoreDraft);
  const [message, setMessage] = useState(''), [error, setError] = useState(false);
  const edit = (key: keyof StoreDraft, value: string) => { setDraft(previous => ({ ...previous, [key]: value })); setMessage(''); };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = { ...draft, name: draft.name.trim(), description: draft.description.trim() };
    if (next.name.length < 2) { setError(true); setMessage('กรุณาตั้งชื่อร้านอย่างน้อย 2 ตัวอักษร'); return; }
    try { localStorage.setItem('opencraft-seller-draft', JSON.stringify(next)); setDraft(next); setError(false); setMessage('บันทึกแบบร่างร้านแล้ว'); }
    catch { setError(true); setMessage('ยังบันทึกไม่ได้ กรุณาอนุญาตการจัดเก็บข้อมูลของเว็บไซต์แล้วลองอีกครั้ง'); }
  };
  return <div className="member-store-content"><p className="member-page-lead">เริ่มจากไอเดียร้านของคุณ แล้วค่อยเตรียมพร้อมสำหรับการขาย</p>
    <div className="member-store-profile-link"><div><strong>{showcase.data?.showcase.storeName || 'ข้อมูลร้านบนโปรไฟล์'}</strong><p>{showcase.data?.showcase.storeBio || 'ตั้งชื่อและแนะนำร้านจากโปรไฟล์ของคุณ'}</p></div><button type="button" onClick={() => onNavigate('profile')}>ดูโปรไฟล์<ArrowUpRight size={14}/></button></div>
    <form className="member-store-form" onSubmit={save}>
    <label>ชื่อร้าน<input name="shop" autoComplete="organization" value={draft.name} onChange={event => edit('name', event.target.value)} minLength={2} maxLength={80} required placeholder="ชื่อที่อยากให้ทุกคนจดจำ"/></label>
    <div className="member-store-fields"><label>หมวดหมู่<select value={draft.category} onChange={event => edit('category', event.target.value)}>{categories.filter(item => item.id !== 'all').map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>ลักษณะสินค้า<select value={draft.type} onChange={event => edit('type', event.target.value)}><option value="physical">สินค้าจัดส่ง</option><option value="digital">ไฟล์ดิจิทัล</option><option value="service">บริการ</option></select></label></div>
    <label>เกี่ยวกับร้าน<textarea value={draft.description} onChange={event => edit('description', event.target.value)} maxLength={1200} rows={5} placeholder="คุณอยากขายอะไร และอะไรที่ทำให้ร้านของคุณพิเศษ?"/></label>
    <div className="member-store-submit"><button type="submit" className="member-page-action">บันทึกแบบร่าง<Check size={16}/></button>{message && <p className={error ? 'is-error' : ''} role={error ? 'alert' : 'status'}>{message}</p>}</div>
  </form><p className="member-page-note">แบบร่างเก็บเฉพาะในเบราว์เซอร์นี้ ยังไม่เผยแพร่ร้านหรือเปิดรับคำสั่งซื้อ</p></div>;
}

const questions = [
  ['เติมเงินได้เลยไหม?', 'หน้าเติมเงินให้เลือกจำนวนและช่องทางเพื่อตรวจสอบรายการได้ ขณะนี้ยังไม่เปิดรับชำระเงินจริง ยังไม่สร้างคำสั่งเติมเงินหรือเพิ่มยอดในกระเป๋า'],
  ['ตอนนี้สั่งซื้อสินค้าได้เลยไหม?', 'ยังไม่ได้ สินค้า ราคา และร้านในหน้านี้เป็นตัวอย่างสำหรับสำรวจ ระบบสั่งซื้อและชำระเงินจริงยังอยู่ระหว่างพัฒนา'],
  ['รายการที่บันทึกและตะกร้าเก็บไว้ที่ไหน?', 'ข้อมูลจะอยู่ในเบราว์เซอร์และอุปกรณ์ที่คุณใช้ หากลบข้อมูลเว็บไซต์หรือใช้โหมดไม่ระบุตัวตน ข้อมูลอาจไม่ถูกเก็บต่อ'],
  ['จะเริ่มขายได้อย่างไร?', 'ไปหน้าสมัครผู้ขายจากท้ายเว็บไซต์หรือหน้าเริ่มขาย แล้วอ่านเงื่อนไขและส่งคำขอ ร้านและผลงานจะเปิดหลังผ่านอนุมัติเท่านั้น'],
  ['หาสินค้าและบริการได้จากที่ไหน?', 'เลือกหน้าหลัก แล้วใช้ช่องค้นหา ประเภทสินค้า และหมวดหมู่ เพื่อค้นหาสิ่งที่สนใจ'],
  ['จัดการบัญชีได้จากที่ไหน?', 'กดรูปโปรไฟล์ใต้แถบเมนู แล้วเลือกตั้งค่าบัญชี เพื่อดูข้อมูลบัญชีและยืนยันอีเมล'],
];
export default function MemberPages(props: Props) {
  const { page, user, onNavigate, authUser, showcase, security } = props;
  const heading = useRef<HTMLHeadingElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [page]);
  return <motion.section className="member-route-page" data-page={page} aria-labelledby="member-page-heading" initial={reduce ? false : { opacity: 0, y: 5, filter: 'blur(3px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: reduce ? 0 : .24 }}>
    <PageLink page="dashboard" onNavigate={onNavigate} className="member-page-back"><ArrowLeft size={15}/>หน้าหลัก</PageLink>
    <header className="member-page-header"><h1 id="member-page-heading" ref={heading} tabIndex={-1}>{memberTitles[page]}</h1></header>
    {page === 'favorites' && <SavedPage onNavigate={onNavigate}/>}
    {page === 'cart' && <CartPage onNavigate={onNavigate}/>}
    {page === 'topup' && <MemberTopup/>}
    {page === 'seller' && (security.sellerApproved?<StorePage showcase={showcase} onNavigate={onNavigate}/>:<div className="seller-apply-status"><h2>ยังไม่มีร้านค้าที่เปิดใช้งาน</h2><p>สมัครผู้ขายและผ่านการตรวจสอบก่อนเริ่มใช้พื้นที่ร้าน</p><PageLink page="sellerApply" onNavigate={onNavigate}>ไปหน้าสมัครผู้ขาย</PageLink></div>)}
    {page === 'sellerApply' && <SellerApplication user={authUser}/>}
    {page === 'profile' && <MemberProfilePage user={user} data={showcase.data} loading={showcase.loading} error={showcase.error} security={security} onNavigate={onNavigate} onRetry={() => void showcase.reload()}/>}
    {page === 'notifications' && <><EmptyState icon={<Bell size={32}/>} title="ยังไม่มีการแจ้งเตือน" text="ระบบแจ้งเตือนคำสั่งซื้ออยู่ระหว่างพัฒนา ระหว่างนี้คุณสามารถสำรวจสินค้าและเตรียมร้านได้" onNavigate={onNavigate}/>{(!security.emailVerified || !security.mfaEnabled) && <div className="member-account-line"><span>ตั้งค่าความปลอดภัยให้ครบ</span><PageLink page="security" onNavigate={onNavigate}>ไปที่ความปลอดภัย<ArrowUpRight size={15}/></PageLink></div>}</>}
    {page === 'help' && <div className="member-faq">{questions.map(([question, answer]) => <details key={question}><summary>{question}<Plus size={16}/></summary><p>{answer}</p></details>)}</div>}
  </motion.section>;
}
