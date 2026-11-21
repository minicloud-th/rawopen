"use client";
import { useRef } from "react";
import { useSoftReveals } from "@/lib/use-soft-reveals";
import { ArrowRight, ArrowUpRight, Menu, Search } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navigateAuth } from "@/lib/auth-navigation";
import { BrandWordmark } from "./brand-wordmark";
import MemberCatalog from "./member-catalog";

function jumpToSearch() {
  document.querySelector("#public-catalog")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  document.querySelector<HTMLInputElement>("#public-catalog input[type=search]")?.focus({ preventScroll: true });
}
const questions = [
  ["ค้นหาได้โดยไม่สมัครไหม?", "ค้นหา เลือกหมวด และเปิดดูรายละเอียดได้เลย สมัครเมื่ออยากบันทึกรายการหรือใช้พื้นที่สมาชิก"],
  ["ตอนนี้ซื้อหรือจ้างงานได้จริงหรือยัง?", "รายการและราคาเป็นตัวอย่างสำหรับสำรวจ ยังไม่เปิดรับคำสั่งซื้อหรือชำระเงินจริง"],
  ["อยากเปิดร้าน ต้องเริ่มตรงไหน?", "อ่านเงื่อนไขที่หน้าสมัครผู้ขาย แล้วส่งคำขอจากบัญชีสมาชิก ร้านและผลงานจะแสดงหลังผ่านการอนุมัติเท่านั้น"],
  ["บัญชีที่ปลอดภัยกับร้านยืนยันแล้วต่างกันอย่างไร?", "ขอบโปรไฟล์สีเขียวหมายถึงยืนยันอีเมลและเปิด 2FA แล้ว ป้ายสีฟ้าแสดงเฉพาะร้านที่ผ่านการอนุมัติ ส่วน OpenCraft Protect ยังไม่เปิดใช้งาน"],
];
export function CommerceHero() {
  const root = useRef<HTMLDivElement>(null);
  useSoftReveals(root);
  return <div ref={root} className="landing-site oc-redesign">
    <header className="oc-public-header">
      <a href="/" className="oc-brand-link" aria-label="OpenCraft หน้าแรก"><BrandWordmark/></a>
      <nav aria-label="เมนูหน้าแรก"><a href="#discover">ค้นพบ</a><a href="#how-it-works">วิธีใช้งาน</a><a href="/sell">สำหรับผู้ขาย</a></nav>
      <div className="oc-header-actions"><button className="oc-header-search" onClick={jumpToSearch} aria-label="ค้นหาสินค้า"><Search size={20}/></button><a className="oc-button oc-button-outline oc-header-sell" href="/sell">เปิดร้านของคุณ</a><a className="oc-button oc-button-dark" href="/signup" onClick={event => { event.preventDefault(); navigateAuth("/signup"); }}>สมัครสมาชิก</a><a className="oc-header-login" href="/login" onClick={event => { event.preventDefault(); navigateAuth("/login"); }}>เข้าสู่ระบบ</a>
        <Sheet><SheetTrigger asChild><button className="oc-mobile-menu" aria-label="เปิดเมนู"><Menu size={23}/></button></SheetTrigger><SheetContent className="portfolio-sheet oc-mobile-sheet" side="right"><SheetHeader><SheetTitle>OpenCraft</SheetTitle><SheetDescription>สินค้า งานดิจิทัล และบริการ ในที่เดียว</SheetDescription></SheetHeader><nav className="oc-mobile-links" aria-label="เมนูมือถือ"><SheetClose asChild><a href="#discover">ค้นพบสินค้า</a></SheetClose><SheetClose asChild><a href="#how-it-works">วิธีใช้งาน</a></SheetClose><SheetClose asChild><a href="/sell">สมัครผู้ขาย</a></SheetClose><SheetClose asChild><a href="/login">เข้าสู่ระบบ</a></SheetClose><SheetClose asChild><a href="/contact">ติดต่อเรา</a></SheetClose></nav></SheetContent></Sheet>
      </div>
    </header>
    <main className="oc-public-content" id="discover">
      <MemberCatalog publicView/>
      <section className="oc-join-banner"><div><h2>เก็บทุกสิ่งที่ชอบไว้ด้วยกัน</h2><p>สร้างบัญชีเพื่อบันทึกรายการและจัดพื้นที่ให้ตรงกับคุณ</p></div><a className="oc-button oc-button-dark" href="/signup">เริ่มต้นกับ OpenCraft<ArrowRight size={16}/></a></section>
      <section className="oc-seller-feature" id="sell"><div className="oc-seller-photo" data-oc-reveal="seller-photo"><img src="/assets/desk.jpg" alt="มุมทำงานสำหรับสร้างสรรค์สินค้าและบริการ" width="900" height="670" loading="lazy"/></div><div data-oc-reveal="seller-copy"><h2>เปลี่ยนสิ่งที่ถนัด<br/>ให้คนค้นพบ</h2><p>งานที่คุณสร้าง ไฟล์ที่คุณออกแบบ หรือสินค้าที่คุณตั้งใจเลือกมา มีพื้นที่ให้เริ่มต้นได้ที่ OpenCraft</p><a className="oc-button oc-button-dark" href="/sell">ทำความรู้จักการเปิดร้าน<ArrowUpRight size={16}/></a><small>สมัครและผ่านการตรวจสอบก่อนเปิดพื้นที่ร้าน</small></div></section>
      <section className="oc-how-section" id="how-it-works"><div className="oc-section-title" data-oc-reveal="how-heading"><h2>เริ่มง่าย ๆ ในแบบของคุณ</h2><p>เลือกสิ่งที่ใช่ แล้วไปต่อจากตรงนั้น</p></div><div className="oc-how-grid"><article><span>ค้นพบ</span><h3>เริ่มจากสิ่งที่กำลังมองหา</h3><p>ค้นหา เลือกหมวด และเปรียบเทียบสินค้า ไฟล์ดิจิทัล หรือบริการได้ก่อนสมัคร</p></article><article><span>เลือก</span><h3>ดูรายละเอียดให้ครบ</h3><p>อ่านสิ่งที่ได้รับ ขอบเขตงาน และเงื่อนไข แล้วเก็บรายการที่สนใจไว้ในบัญชี</p></article><article><span>สร้าง</span><h3>เตรียมพื้นที่สำหรับร้านคุณ</h3><p>ทำความเข้าใจเงื่อนไขผู้ขาย ส่งคำขอ และรอการตรวจสอบก่อนเริ่มเปิดร้าน</p></article></div></section>
      <section className="oc-faq-section"><div className="oc-section-title" data-oc-reveal="faq-heading"><h2>ก่อนเริ่ม มีอะไรควรรู้?</h2><a href="/contact">ยังมีคำถาม? ติดต่อเรา<ArrowUpRight size={15}/></a></div><div>{questions.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>
    </main>
    <footer className="oc-public-footer"><div className="oc-footer-brand"><a href="/" aria-label="OpenCraft หน้าแรก"><BrandWordmark/></a><p>สินค้า งานดิจิทัล และบริการ<br/>ในที่เดียว</p></div><div><h2>ค้นพบ</h2><a href="#discover">สินค้าและบริการ</a><a href="/signup">สร้างบัญชี</a><a href="/sell">สมัครผู้ขาย</a></div><div><h2>ช่วยเหลือ</h2><a href="/contact">ติดต่อเรา</a><a href="/legal/guardians">ผู้เยาว์และผู้ปกครอง</a><button data-info="fees">ค่าธรรมเนียม</button></div><div><h2>ข้อมูลและเงื่อนไข</h2><a href="/privacy">ความเป็นส่วนตัว</a><a href="/terms">ข้อกำหนดการใช้บริการ</a><a href="/seller-terms">ข้อกำหนดผู้ขาย</a></div><p className="oc-footer-bottom">© {new Date().getFullYear()} OpenCraft<span>One Marketplace. Endless Possibilities.</span></p></footer>
  </div>;
}
export default CommerceHero;
