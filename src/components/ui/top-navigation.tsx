import { useEffect, useState } from 'react';
import { LiquidNavbar, type LiquidNavItem } from './liquid-glass-navbar';

const links: LiquidNavItem[] = [
  { label: 'หน้าแรก', href: '#experience', fx: 'none' },
  { label: 'เลือกซื้อ', href: '#discover', fx: 'none' },
  { label: 'คอลเลกชัน', href: '#collections', fx: 'none' },
];

export function TopNavigation() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      let next = 0;
      links.forEach((link, i) => { const section = document.querySelector(link.href!); if (section && section.getBoundingClientRect().top <= 180) next = i; });
      setActive(next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(read); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    read();
    return () => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); cancelAnimationFrame(frame); };
  }, []);
  return <LiquidNavbar items={links} active={active} onChange={setActive} compact={false} sound={false} className="opencraft-navigation"/>;
}
