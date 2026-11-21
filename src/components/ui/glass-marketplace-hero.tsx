'use client';
import { useEffect, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Box, Code2, PenTool, Search } from 'lucide-react';
import { navigateAuth } from '@/lib/auth-navigation';

function GlassMark() {
  const id = useId().replace(/:/g, '');
  const ring = 'M211 119C229 86 267 84 286 117L402 327C421 362 398 397 360 397H127C90 397 70 360 89 327L211 119Z M234 206C241 193 252 193 260 206L327 327C333 338 328 345 315 345H177C165 345 159 337 165 326L234 206Z';
  return <div className="glass-mark-scene" aria-hidden="true">
    <svg className="glass-mark-svg" viewBox="0 0 500 540" fill="none">
      <defs>
        <linearGradient id={`${id}-volume`} x1="110" x2="395" y1="95" y2="410" gradientUnits="userSpaceOnUse"><stop stopColor="white" stopOpacity=".94"/><stop offset=".24" stopColor="#effaff" stopOpacity=".18"/><stop offset=".46" stopColor="#cbddf6" stopOpacity=".52"/><stop offset=".68" stopColor="#dbf8fc" stopOpacity=".16"/><stop offset="1" stopColor="white" stopOpacity=".96"/></linearGradient>
        <linearGradient id={`${id}-edge`} x1="120" y1="135" x2="380" y2="415" gradientUnits="userSpaceOnUse"><stop stopColor="white"/><stop offset=".32" stopColor="#c6d9ec"/><stop offset=".48" stopColor="white"/><stop offset=".72" stopColor="#8edce7"/><stop offset="1" stopColor="#f9fdff"/></linearGradient>
        <linearGradient id={`${id}-shine`}><stop stopColor="white" stopOpacity="0"/><stop offset=".43" stopColor="white" stopOpacity="0"/><stop offset=".49" stopColor="white" stopOpacity=".86"/><stop offset=".53" stopColor="white" stopOpacity=".05"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
        <linearGradient id={`${id}-fade`} x2="0" y2="1"><stop stopColor="white" stopOpacity=".55"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
        <clipPath id={`${id}-clip`}><path d={ring} fillRule="evenodd" clipRule="evenodd"/></clipPath>
        <g id={`${id}-form`}>
          <g transform="translate(37 30) rotate(27 250 275) scale(.86)">
            <path d={ring} fill={`url(#${id}-volume)`} fillRule="evenodd" stroke="#a1badd" strokeOpacity=".3" strokeWidth="12"/>
            <path d={ring} fill={`url(#${id}-volume)`} fillRule="evenodd" stroke={`url(#${id}-edge)`} strokeWidth="3"/>
          </g>
          <path d={ring} transform="translate(6 8)" fill={`url(#${id}-volume)`} fillRule="evenodd" stroke="#94b1d6" strokeWidth="6" strokeOpacity=".22"/>
          <path d={ring} fill={`url(#${id}-volume)`} fillRule="evenodd" stroke={`url(#${id}-edge)`} strokeWidth="4"/>
          <g clipPath={`url(#${id}-clip)`}><rect className="glass-mark-shine" x="-130" y="0" width="760" height="500" fill={`url(#${id}-shine)`} transform="rotate(-20 250 250)"/></g>
          <path d="M95 320 217 119C231 96 251 92 269 108M125 387H349C374 387 390 376 392 357M173 327 236 214C243 201 251 201 258 214" stroke="white" strokeWidth="3" strokeOpacity=".9" strokeLinecap="round"/>
        </g>
      </defs>
      <ellipse cx="266" cy="450" rx="157" ry="16" fill="#a4bddc" opacity=".09"/>
      <g transform="translate(0 554) scale(1 -.26)" opacity=".12" className="glass-mark-reflection"><use href={`#${id}-form`}/></g>
      <use href={`#${id}-form`}/>
    </svg>
  </div>;
}

export function GlassMarketplaceHero({ onDiscover }: { onDiscover: () => void }) {
  const reduce = !!useReducedMotion();
  useEffect(() => {
    document.body.classList.remove('has-presentation', 'intro-done', 'gallery-ready');
    document.body.classList.add('has-glass-hero');
    const header = document.querySelector('.landing-header');
    const scroll = () => header?.classList.toggle('is-scrolled', scrollY > 30);
    scroll(); addEventListener('scroll', scroll, { passive: true });
    return () => { document.body.classList.remove('has-glass-hero'); removeEventListener('scroll', scroll); };
  }, []);
  return <section id="experience" className="glass-market-hero" aria-labelledby="glass-hero-title" onPointerMove={event => {
      if (reduce || event.pointerType === 'touch') return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5, y = (event.clientY - bounds.top) / bounds.height - .5;
      event.currentTarget.style.setProperty('--glass-light-x', `${50 + x * 35}%`);
      event.currentTarget.style.setProperty('--glass-tilt-y', `${x * 9}deg`);
      event.currentTarget.style.setProperty('--glass-tilt-x', `${-y * 5}deg`);
    }} onPointerLeave={event => { event.currentTarget.style.setProperty('--glass-light-x', '50%'); event.currentTarget.style.setProperty('--glass-tilt-y', '0deg'); event.currentTarget.style.setProperty('--glass-tilt-x', '0deg'); }}>
    <div className="glass-ambient" aria-hidden="true"/>
    <div className="glass-hero-layout">
      <motion.div className="glass-hero-copy" initial={reduce ? false : { opacity: 0, y: 24, filter: 'blur(7px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: .8, ease: [.22, 1, .36, 1] }}>
        <h1 id="glass-hero-title">สินค้า งานดิจิทัล<br/>และบริการ<br/>ในที่เดียว</h1>
        <p>ทุกสิ่งที่มองหา มาเจอกันที่นี่<br/><span>เลือกของที่ชอบ หรือพบคนช่วยต่อยอดไอเดีย</span></p>
        <div className="glass-hero-actions"><button className="glass-discover" onClick={onDiscover}><Search size={17}/>ค้นพบสิ่งที่ใช่</button><button className="glass-join" onClick={() => navigateAuth('/signup')}>เริ่มต้นกับ OpenCraft<ArrowUpRight size={16}/></button></div>
      </motion.div>
      <motion.div className="glass-hero-visual" initial={reduce ? false : { opacity: 0, scale: .94, y: 22 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 1.2, ease: [.22, 1, .36, 1], delay: .1 }}>
        <div className="glass-light-ring" aria-hidden="true"/>
        <div className="glass-display-panel" aria-hidden="true"><span className="glass-display-edge"/></div>
        <GlassMark/>
        <div className="glass-category glass-category-goods"><span><Box size={18}/></span><div><strong>สินค้า</strong><small>ของดีสำหรับทุกวัน</small></div></div>
        <div className="glass-category glass-category-digital"><span><Code2 size={19}/></span><div><strong>งานดิจิทัล</strong><small>พร้อมต่อยอดไอเดีย</small></div></div>
        <div className="glass-category glass-category-services"><span><PenTool size={18}/></span><div><strong>บริการ</strong><small>จากคนที่ถนัด</small></div></div>
        <div className="glass-visual-caption" aria-hidden="true"><img src="/assets/opencraft-symbol.png" alt=""/><span>เปิดรับทุกความเป็นไปได้</span></div>
      </motion.div>
    </div>
    <button className="glass-scroll-cue" onClick={onDiscover}>สำรวจ OpenCraft<ArrowDown size={15}/></button>
  </section>;
}
export default GlassMarketplaceHero;
