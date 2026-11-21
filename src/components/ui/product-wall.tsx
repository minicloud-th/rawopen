import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Marquee } from './3d-testimonails';
const wallItems=[
  {id:'brand',image:'brand-design.svg',name:'ให้ไอเดียมีตัวตน',type:'งานออกแบบ'},
  {id:'headphones',image:'headphones.jpg',name:'ของที่ชอบในทุกวัน',type:'ไลฟ์สไตล์'},
  {id:'social',image:'social-kit.svg',name:'เล่าเรื่องในแบบของคุณ',type:'ไฟล์ดิจิทัล'},
  {id:'uikit',image:'ui-kit.svg',name:'เริ่มต้นสิ่งใหม่',type:'ดีไซน์ & ดิจิทัล'},
  {id:'website',image:'web-design.svg',name:'พื้นที่ของไอเดีย',type:'บริการสร้างสรรค์'},
  {id:'sneaker',image:'sneaker.jpg',name:'สไตล์ที่เป็นคุณ',type:'แฟชั่น'},
];
export function ProductWall(){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const observer=new IntersectionObserver(([entry])=>ref.current?.classList.toggle('is-visible',entry.isIntersecting));if(ref.current)observer.observe(ref.current);return()=>observer.disconnect();},[]);
  return <div className="product-wall" ref={ref} aria-label="ตัวอย่างสินค้าและผลงานใน OpenCraft"><div className="product-wall-perspective">{[0,1,2].map(column=><Marquee key={column} vertical reverse={column===1} pauseOnHover repeat={2} className="product-wall-column" ariaLabel={`สินค้าและผลงาน คอลัมน์ ${column+1}`}><div className="wall-column-content">{[...wallItems.slice(column*2),...wallItems.slice(0,column*2)].map(item=><button key={item.id} className="wall-card" data-product={item.id}><img src={'/assets/'+item.image} alt="" loading="lazy"/><span><small>{item.type}</small><strong>{item.name}</strong><ArrowUpRight size={13}/></span></button>)}</div></Marquee>)}</div></div>;
}
