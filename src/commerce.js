'use strict';
import { navigateAuth } from './lib/auth-navigation';
import { getMemberPage } from './lib/member-navigation';
import { products, categories } from './lib/catalog';

const iconPaths={
  'search':'<circle cx="10.8" cy="10.8" r="7.3"/><path d="m16.2 16.2 4.4 4.4"/>',
  'arrow-right':'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  'arrow-left':'<path d="M20 12H5m6-6-6 6 6 6"/>',
  'arrow-up-right':'<path d="M6 18 18 6M6 6h12v12"/>',
  'arrow-down':'<path d="M12 4v15m-6-6 6 6 6-6"/>',
  'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  'heart':'<path d="M20.5 4.6a5.3 5.3 0 0 0-7.5 0L12 5.7l-1.1-1.1a5.3 5.3 0 0 0-7.5 7.5L12 21l8.5-8.9a5.3 5.3 0 0 0 0-7.5Z"/>',
  'shopping-bag':'<path d="M5 7h14l1.2 14H3.8L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  'user-round':'<circle cx="12" cy="8" r="4"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/>',
  'sparkles':'<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3ZM20 2v4m-2-2h4"/>',
  'package':'<path d="m12 3 9 5v9l-9 5-9-5V8l9-5Zm-9 5 9 5 9-5M12 13v9M7.5 5.5l9 5"/>',
  'download':'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  'pen-tool':'<path d="m12 3 9 9-8 8-9-2-2-9 10-6ZM2 9l6 6m4-12 1 9 8 0"/><circle cx="10" cy="14" r="2"/>',
  'grid-2x2':'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  'monitor':'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M12 17v4m-4 0h8M6 7h3m2 0h3"/>',
  'headphones':'<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><rect x="3" y="12" width="4" height="9" rx="2"/><rect x="17" y="12" width="4" height="9" rx="2"/>',
  'shirt':'<path d="m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4a4 4 0 0 1-8 0Z"/>',
  'gamepad-2':'<path d="M6 7h12c2 0 3 2 3.3 4l.7 7c.2 2-2 3-3.3 1.5L16 17H8l-2.7 2.5C4 21 1.8 20 2 18l.7-7C3 9 4 7 6 7Z"/><path d="M6 10v5m-2.5-2.5h5M15 11h.01M18 14h.01"/>',
  'palette':'<path d="M12 3a9 9 0 1 0 0 18h1.3a2.3 2.3 0 0 0 1.1-4.3 1.5 1.5 0 0 1 .8-2.7h2.6A4.2 4.2 0 0 0 22 10c0-4-4.5-7-10-7Z"/><circle cx="7" cy="10" r=".7"/><circle cx="10" cy="6.5" r=".7"/><circle cx="15" cy="6.5" r=".7"/><circle cx="18" cy="10" r=".7"/>',
  'hand':'<path d="M9 11V5a1.5 1.5 0 0 1 3 0v6-8a1.5 1.5 0 0 1 3 0v8-6a1.5 1.5 0 0 1 3 0v7-3a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1c-3 0-4.5-1.5-6-3l-4-4a1.8 1.8 0 0 1 2.5-2.5L9 16v-5Z"/>',
  'briefcase-business':'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12l9 4 9-4M12 12v4"/>',
  'sliders-horizontal':'<path d="M3 6h5m4 0h9M3 12h10m4 0h4M3 18h3m4 0h11M8 3v6m5 0v6M6 15v6"/>',
  'plus':'<path d="M12 5v14M5 12h14"/>',
  'minus':'<path d="M5 12h14"/>',
  'x':'<path d="m6 6 12 12M18 6 6 18"/>',
  'check':'<path d="m5 12 4 4L19 6"/>',
  'check-circle':'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  'message-circle':'<path d="M21 11.5a9 9 0 0 1-9 9 10 10 0 0 1-4-.9L3 21l1.4-4.9A9 9 0 1 1 21 11.5Z"/>',
  'globe':'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  'menu':'<path d="M4 6h16M4 12h16M4 18h16"/>',
  'store':'<path d="M4 10v11h16V10M3 4h18l1 6a3 3 0 0 1-5 2 3 3 0 0 1-5 0 3 3 0 0 1-5 0 3 3 0 0 1-5-2l1-6Z"/><path d="M9 21v-6h6v6"/>',
  'circle-help':'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16.5h.01"/>',
  'clock':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'file-check':'<path d="M14 2H5v20h14V7l-5-5ZM14 2v5h5M8 14l3 3 5-6"/>',
  'info':'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>'
};
function icon(name){return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||iconPaths['package']}</svg>`;}
function hydrateIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{el.outerHTML=icon(el.dataset.icon);});}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'฿'+Number(n).toLocaleString('th-TH');
const storage={get(key,fallback){try{return JSON.parse(localStorage.getItem('opencraft-'+key))??fallback;}catch{return fallback;}},set(key,value){try{localStorage.setItem('opencraft-'+key,JSON.stringify(value));return true;}catch{return false;}}};


let favorites=new Set(storage.get('favorites',[]).filter(id=>products.some(p=>p.id===id)));
let cart=storage.get('cart',[]);
if(!Array.isArray(cart))cart=[];
cart=cart.filter(i=>products.some(p=>p.id===i.id)&&Number.isInteger(i.qty)&&i.qty>0).map(i=>({id:i.id,qty:Math.min(i.qty,9)}));
const state={query:'',category:'all',filter:'all',sort:'recommended',limit:6};
let dialogMode='',toastTimer,lastBodyOverflow='',scrollLocked=false;
const mainDialog=document.querySelector('#main-dialog');
const cartDialog=document.querySelector('#cart-dialog');
const dialogContent=document.querySelector('#dialog-content');

function productCard(p){
  const saved=favorites.has(p.id);
  return `<article class="product-card" data-card="${p.id}"><div class="product-image-wrap"><button class="product-open" data-product="${p.id}" aria-label="ดู ${esc(p.title)}"><img src="/assets/${p.image}" alt="${esc(p.title)}" loading="lazy" width="900" height="670"></button><button class="favorite-button ${saved?'saved':''}" data-favorite="${p.id}" aria-pressed="${saved}" aria-label="${saved?'นำออกจาก':'เพิ่มใน'}รายการโปรด: ${esc(p.title)}">${icon('heart')}</button></div><div class="product-caption"><button class="product-title" data-product="${p.id}">${esc(p.title)}</button><div class="product-price-row"><span class="product-price">${p.type==='service'?'<span class="price-from">เริ่ม </span>':''}${money(p.price)}</span><button class="quick-add" data-add="${p.id}" aria-label="เพิ่ม ${esc(p.title)} ลงตะกร้า">${icon('plus')}</button></div></div></article>`;
}

function getResults(){
  const q=state.query.trim().toLocaleLowerCase('th');
  const result=products.filter(p=>(state.category==='all'||p.cat===state.category)&&(state.filter==='all'||p.type===state.filter)&&(!q||`${p.title} ${p.description} ${p.tags} ${p.seller}`.toLocaleLowerCase('th').includes(q)));
  if(state.sort==='price-asc')result.sort((a,b)=>a.price-b.price);
  if(state.sort==='price-desc')result.sort((a,b)=>b.price-a.price);
  if(state.sort==='newest')result.reverse();
  return result;
}
function renderProducts(){
  document.dispatchEvent(new CustomEvent('opencraft:market-change'));
}
/** @returns {{query:string,category:string,filter:string,sort:string,limit:number,favorites:string[],cart:{id:string,qty:number}[],cartCount:number}} */
export function getMarketSnapshot(){return {...state, favorites:[...favorites], cart:cart.map(({id,qty})=>({id,qty})), cartCount:cart.reduce((sum,item)=>sum+item.qty,0)};}
export function setMarketFilters(filters){Object.assign(state,filters);renderProducts();}
export { getResults, addToCart, toggleFavorite };
function updateBadges(){
  renderProducts();
  document.querySelectorAll('.cart-count').forEach(el=>{const count=String(cart.reduce((n,i)=>n+i.qty,0));const changed=el.dataset.ready&&el.textContent!==count;el.textContent=count;el.hidden=cart.length===0;el.dataset.ready='true';if(changed&&!el.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){el.getAnimations().forEach(animation=>animation.cancel());el.animate([{transform:'scale(1)'},{transform:'scale(1.22)',offset:.4},{transform:'scale(1)'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});}});
  document.querySelectorAll('.favorites-count').forEach(el=>{el.textContent=favorites.size;el.hidden=favorites.size===0;});
}
function toast(message){const el=document.querySelector('#toast');el.innerHTML=icon('check-circle')+`<span>${esc(message)}</span>`;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3100);}
function persistCart(){const ok=storage.set('cart',cart);updateBadges();return ok;}
export function removeFromCart(id){cart=cart.filter(item=>item.id!==id);persistCart();if(cartDialog.open)renderCart();}
export function changeCartQuantity(id,delta){const item=cart.find(item=>item.id===id);const product=products.find(product=>product.id===id);if(!item||product?.type!=='physical'||!Number.isInteger(delta))return;item.qty=Math.max(0,Math.min(9,item.qty+delta));cart=cart.filter(item=>item.qty>0);persistCart();if(cartDialog.open)renderCart();}
function addToCart(id){const p=products.find(p=>p.id===id);if(!p)return;const item=cart.find(i=>i.id===id);if(item){if(p.type!=='physical'){toast('รายการนี้อยู่ในตะกร้าแล้ว');return;}if(item.qty>=9){toast('เพิ่มสินค้าได้สูงสุด 9 ชิ้นต่อรายการ');return;}item.qty++;}else cart.push({id,qty:1});persistCart();if(cartDialog.open)renderCart();toast('เพิ่มลงตะกร้าแล้ว');}
function toggleFavorite(id){if(favorites.has(id)){favorites.delete(id);toast('นำออกจากรายการโปรดแล้ว');}else{favorites.add(id);toast('เก็บไว้ในรายการโปรดแล้ว');}storage.set('favorites',[...favorites]);updateBadges();renderProducts();if(dialogMode==='favorites'&&mainDialog.open)showFavorites();else if(dialogMode===`product:${id}`&&mainDialog.open)showProduct(id);}

function lockDialogScroll(){if(!scrollLocked){lastBodyOverflow=document.body.style.overflow;scrollLocked=true;}document.body.style.overflow='hidden';}
function syncDialogScroll(){if(mainDialog.open||cartDialog.open)return;if(scrollLocked){document.body.style.overflow=lastBodyOverflow;scrollLocked=false;}}
function openMain(title,body,mode='info'){
  closeMenus();
  dialogMode=mode;
  dialogContent.innerHTML=`<div class="dialog-header"><h2>${esc(title)}</h2><button class="icon-button" data-action="close-main" aria-label="ปิดหน้าต่าง">${icon('x')}</button></div>${body}`;
  if(cartDialog.open)cartDialog.close();
  if(!mainDialog.open){lockDialogScroll();mainDialog.showModal();}
  mainDialog.scrollTop=0;
}
function closeMain(){if(mainDialog.open)mainDialog.close();}
mainDialog.addEventListener('close',()=>{syncDialogScroll();if(!mainDialog.open)dialogMode='';});
cartDialog.addEventListener('close',syncDialogScroll);
for(const d of [mainDialog,cartDialog])d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});

function showProduct(id){
  const p=products.find(p=>p.id===id);if(!p)return;
  const saved=favorites.has(id);
  const typeLabel={physical:'สินค้าจัดส่ง',digital:'ไฟล์ดิจิทัล',service:'บริการ'}[p.type];
  openMain('รายละเอียด',`<div class="detail-layout"><div class="detail-visual"><img src="/assets/${p.image}" alt="${esc(p.title)}"></div><div class="detail-content"><span class="detail-category">${categories.find(c=>c.id===p.cat)?.name||''}</span><h2>${p.title}</h2><div class="detail-price">${p.type==='service'?'<small>เริ่ม </small>':''}${money(p.price)}</div><p>${p.description}</p><dl class="detail-specs"><div><dt>ผู้ขาย</dt><dd>${p.seller}</dd></div><div><dt>ประเภท</dt><dd>${typeLabel}</dd></div></dl><div class="detail-actions"><button class="button button-blue" data-add="${id}">เพิ่มลงตะกร้า</button><button class="icon-button ${saved?'saved':''}" data-favorite="${id}" aria-pressed="${saved}" aria-label="${saved?'นำออกจาก':'เพิ่มใน'}รายการโปรด" style="color:${saved?'#ee5c79':'inherit'}">${icon('heart')}</button></div><p class="detail-note">รายการตัวอย่าง ยังไม่เปิดรับคำสั่งซื้อจริง</p></div></div>`,`product:${id}`);
}

function showFavorites(){const list=products.filter(p=>favorites.has(p.id));openMain(`รายการโปรดของคุณ (${list.length})`,list.length?`<div class="dialog-body"><div class="modal-products">${list.map(productCard).join('')}</div></div>`:`<div class="dialog-body"><div class="cart-empty">${icon('heart')}<h3>เก็บของที่ชอบไว้ตรงนี้</h3><p>กดหัวใจบนสินค้าที่สนใจ<br>แล้วกลับมาเลือกต่อได้ทุกเมื่อ</p><button class="button button-blue" data-action="browse">ออกไปค้นพบ</button></div></div>`,'favorites');}
function renderCart(){
  document.querySelector('#drawer-count').textContent=`(${cart.reduce((n,i)=>n+i.qty,0)})`;
  document.querySelector('#cart-items').innerHTML=cart.length?cart.map(item=>{const p=products.find(p=>p.id===item.id);return `<article class="cart-item"><img src="/assets/${p.image}" alt="${esc(p.title)}"><div><h3>${p.title}</h3><small>${p.seller} · รายการตัวอย่าง</small><div class="cart-item-price"><strong>${money(p.price*item.qty)}</strong>${p.type==='physical'?`<div class="quantity-control"><button data-quantity="${p.id}" data-delta="-1" aria-label="ลดจำนวน ${esc(p.title)}">${icon('minus')}</button><span>${item.qty}</span><button data-quantity="${p.id}" data-delta="1" aria-label="เพิ่มจำนวน ${esc(p.title)}" ${item.qty>=9?'disabled':''}>${icon('plus')}</button></div>`:'<small>1 รายการ</small>'}</div><button class="remove-item" data-remove="${p.id}">นำออกจากตะกร้า</button></div></article>`;}).join(''):`<div class="cart-empty">${icon('shopping-bag')}<h3>ตะกร้ายังว่างอยู่</h3><p>มีของดี ๆ รอให้คุณค้นพบ<br>เลือกสิ่งที่ชอบแล้วมาเก็บไว้ด้วยกัน</p><button class="button button-blue" data-action="browse">ค้นพบสินค้า</button></div>`;
  const footer=document.querySelector('#cart-footer');
  footer.hidden=!cart.length;
  footer.innerHTML=cart.length?`<div class="cart-total"><span>ยอดรวม</span><strong>${money(cart.reduce((sum,item)=>sum+products.find(p=>p.id===item.id).price*item.qty,0))}</strong></div><button class="button button-blue" data-action="review">ตรวจสอบรายการ ${icon('arrow-right')}</button><p>บันทึกรายการไว้ในเบราว์เซอร์นี้<br>รายการตัวอย่าง ยังไม่มีการรับชำระเงินจริง</p>`:'';
}
function showCart(){closeMenus();closeMain();renderCart();lockDialogScroll();if(!cartDialog.open)cartDialog.showModal();}
function showReview(){if(!cart.length)return;const total=cart.reduce((n,i)=>n+products.find(p=>p.id===i.id).price*i.qty,0);cartDialog.close();openMain('รายการที่คุณเลือก',`<div class="dialog-body"><div class="saved-draft"><strong>รายการนี้ยังไม่มีการสั่งซื้อหรือชำระเงิน</strong>OpenCraft เวอร์ชันนี้เปิดให้สำรวจสินค้าและจัดรายการที่สนใจ ข้อมูลเป็นตัวอย่าง คุณสามารถกลับมาแก้ไขตะกร้าได้ทุกเมื่อ</div>${cart.map(i=>{const p=products.find(p=>p.id===i.id);return `<div class="cart-total"><span style="max-width:70%;font-size:11px">${p.title} × ${i.qty}</span><span>${money(p.price*i.qty)}</span></div>`;}).join('')}<hr style="border:0;border-top:1px solid var(--line);margin:22px 0"><div class="cart-total"><span>รวมทั้งหมด</span><strong>${money(total)}</strong></div><button class="button button-blue form-submit" data-action="keep-cart">เก็บรายการนี้ไว้ ${icon('check')}</button></div>`,'review');}

function goDiscover(){closeMain();if(cartDialog.open)cartDialog.close();closeMenus();renderProducts();if(location.pathname === '/dashboard'){document.dispatchEvent(new CustomEvent('opencraft:browse'));}else if(getMemberPage(location.pathname)){navigateAuth('/dashboard#discover');}else{navigateAuth('/#discover');requestAnimationFrame(()=>document.querySelector('#discover')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));}}
function resetFilters(){Object.assign(state,{query:'',category:'all',filter:'all',sort:'recommended',limit:6});renderProducts();}
function applyCategory(id){state.category=id;state.filter='all';state.query='';state.limit=products.length;goDiscover();}
function searchFor(value){state.query=String(value).trim();state.category='all';state.filter='all';state.limit=products.length;goDiscover();}
function closeMenus(){const menu=document.querySelector('.mobile-menu');if(menu)menu.hidden=true;document.querySelector('.mobile-menu-button')?.setAttribute('aria-expanded','false');}
function showSearch(){openMain('ค้นหาสิ่งที่คุณชอบ',`<div class="dialog-body"><form id="modal-search" class="search-modal-form" role="search"><input name="q" type="search" aria-label="คำค้นหา" placeholder="สินค้า บริการ หรือไอเดียที่คุณกำลังมองหา" value="${esc(state.query)}" autofocus required><button class="button button-blue">ค้นหา</button></form><div class="modal-chips"><button data-search="ออกแบบ">ออกแบบโลโก้</button><button data-search="UI Kit">UI Kit</button><button data-search="หูฟัง">หูฟัง</button><button data-search="เว็บไซต์">เว็บไซต์</button><button data-search="กระเป๋า">กระเป๋า</button></div></div>`,'search');}
function showAccount(){closeMenus();closeMain();navigateAuth('/dashboard');}
function showSeller(){closeMenus();closeMain();navigateAuth('/sell');}

const infoPages={
  about:{title:'ทุกความชอบ มาเจอกันที่ OpenCraft',body:'<h3>All things, one place.</h3><p>OpenCraft คือแนวคิดตลาดซื้อขายที่รวมสินค้าไลฟ์สไตล์ ไฟล์ดิจิทัล และบริการจากคนสร้างสรรค์ไว้ในพื้นที่เดียว ให้คุณเริ่มจากความสนใจและออกไปเจอสิ่งใหม่ ๆ</p><p>เว็บไซต์เวอร์ชันนี้เป็นหน้าสำรวจพร้อมรายการตัวอย่าง ยังไม่มีผู้ขายจริง ระบบคำสั่งซื้อ การจัดส่ง หรือการรับชำระเงิน</p>'},
  guide:{title:'เริ่มต้นกับ OpenCraft',body:'<h3>ค้นพบสิ่งที่ชอบ</h3><p>พิมพ์คำค้นหาจากหน้าหลัก หรือเลือกหมวดหมู่ที่สนใจ คุณสามารถกรองประเภทสินค้าและเรียงตามราคาได้</p><h3>เก็บไว้ แล้วค่อยเลือก</h3><p>กดหัวใจเพื่อเก็บสินค้าในรายการโปรด หรือเพิ่มลงตะกร้าเพื่อรวมรายการที่สนใจ ข้อมูลจะอยู่ในเบราว์เซอร์นี้</p><h3>ดูให้ครบก่อนตัดสินใจ</h3><p>เปิดดูรายละเอียด ราคา และขอบเขตสิ่งที่ได้รับ รายการทั้งหมดในเวอร์ชันนี้เป็นตัวอย่าง ยังไม่มีการสั่งซื้อจริง</p>'},
  'seller-guide':{title:'จากไอเดีย สู่ร้านของคุณ',body:'<h3>เริ่มด้วยสิ่งที่คุณอยากขาย</h3><p>เลือกหมวดหมู่และเล่าให้ชัดว่าสินค้าหรือบริการของคุณช่วยใคร สิ่งที่ผู้ซื้อได้รับมีอะไรบ้าง และอะไรที่ทำให้ร้านของคุณมีเอกลักษณ์</p><h3>เตรียมรายละเอียดให้พร้อม</h3><p>เตรียมรูปสินค้าที่คุณมีสิทธิ์ใช้ ชื่อและคำอธิบาย ราคา สต็อก ขอบเขตงาน ระยะเวลาส่งมอบ และเงื่อนไขการเปลี่ยนหรือคืน</p><h3>ลองสร้างแบบร่างร้าน</h3><p>กด “เริ่มขาย” เพื่อบันทึกไอเดียร้านไว้ในเบราว์เซอร์ แบบร่างจะยังไม่ถูกเผยแพร่หรือส่งให้ใคร</p>'},
  fees:{title:'ค่าธรรมเนียม',body:'<h3>ยังไม่มีการเรียกเก็บเงิน</h3><p>OpenCraft เวอร์ชันนี้เปิดให้สำรวจและจัดรายการสินค้า ยังไม่ได้เปิดรับคำสั่งซื้อ การสมัครแพ็กเกจ หรือชำระเงิน จึงไม่มีการเรียกเก็บค่าธรรมเนียม</p><p>อัตราสำหรับการเปิดขายจริงจะต้องประกาศให้ผู้ซื้อและผู้ขายทราบก่อนเริ่มใช้งาน</p>'},
  standards:{title:'แนวทางการลงสินค้า',body:'<h3>รายละเอียดตรงกับสิ่งที่ขาย</h3><p>ใช้ภาพและข้อความที่แสดงสภาพและคุณสมบัติจริง ระบุขนาด วัสดุ รุ่น และสิ่งที่รวมในราคาให้ชัดเจน</p><h3>ใช้ผลงานที่คุณมีสิทธิ์</h3><p>ลงขายสินค้าหรือผลงานที่คุณมีสิทธิ์จำหน่าย และอธิบายสิทธิ์การใช้งานของไฟล์ดิจิทัลให้ครบถ้วน</p><h3>ตกลงขอบเขตให้เข้าใจตรงกัน</h3><p>สำหรับบริการ ควรระบุสิ่งที่จะได้รับ ระยะเวลาทำงาน จำนวนรอบแก้ไข และเงื่อนไขที่เกี่ยวข้อง</p>'},
  contact:{title:'ติดต่อ OpenCraft',body:'<h3>อยู่ในช่วงพัฒนาแนวคิด</h3><p>ขณะนี้ยังไม่มีศูนย์บริการหรือช่องทางติดต่อผู้ขายจริงบนเว็บไซต์นี้ หากต้องการแก้ไขไอเดียร้าน ให้กลับไปที่ “เริ่มขาย” เพื่อเปิดแบบร่างที่บันทึกไว้</p><p>คุณสามารถส่งข้อเสนอแนะเกี่ยวกับหน้าเว็บไซต์ผ่านบทสนทนาที่ใช้สร้าง OpenCraft ได้</p>'},
  safety:{title:'ซื้อขายอย่างเข้าใจ',body:'<h3>ตรวจสอบก่อนซื้อ</h3><p>อ่านรายละเอียดสินค้า สภาพ ขนาด สิ่งที่ได้รับ และเงื่อนไขการส่งมอบ เปรียบเทียบข้อมูลกับความต้องการของคุณ</p><h3>ตกลงรายละเอียดให้ชัด</h3><p>สำหรับงานบริการ ให้ยืนยันขอบเขต ราคา วันส่งมอบ และการแก้ไขงานก่อนเริ่ม</p><h3>เวอร์ชันสำรวจนี้ยังไม่มีการซื้อขาย</h3><p>ยังไม่มีระบบชำระเงิน ผู้ขายจริง หรือการคุ้มครองธุรกรรม อย่าโอนเงินโดยอ้างอิงรายการตัวอย่างบนเว็บไซต์นี้</p>'},
  privacy:{title:'ข้อมูลและความเป็นส่วนตัว',body:'<h3>ข้อมูลที่บันทึกในเบราว์เซอร์</h3><p>รายการโปรด ตะกร้า และแบบร่างร้านถูกเก็บด้วย localStorage ในอุปกรณ์และเบราว์เซอร์ที่คุณใช้งาน คุณสามารถลบได้จากการตั้งค่าข้อมูลเว็บไซต์ของเบราว์เซอร์</p><h3>บัญชีและการเข้าสู่ระบบ</h3><p>ระบบสมาชิกใช้ Firebase Authentication ของ Google เพื่อจัดการอีเมล รหัสผ่าน และเซสชัน เมื่อเชื่อมต่อบัญชีภายนอก ระบบจะใช้รหัสประจำตัวและชื่อที่แสดงจากผู้ให้บริการเพื่อสร้างบัญชี OpenCraft รหัสผ่านถูกจัดการโดย Firebase ไม่บันทึกไว้ในโค้ดเว็บไซต์หรือแบบร่างร้าน</p><h3>คำตอบเริ่มต้นใช้งาน</h3><p>ชื่อที่แสดง รูปแบบการใช้งาน และหมวดที่สนใจถูกบันทึกในระบบแยกตามบัญชี เพื่อใช้จัดพื้นที่เริ่มต้นเมื่อกลับมาใช้งาน ข้อมูลนี้ไม่ใช้แทนการยืนยันตัวตนผู้ขาย</p><h3>ข้อมูลการซื้อขาย</h3><p>ยังไม่มีการเก็บข้อมูลบัตรหรือรับชำระเงิน แบบร่างร้านยังอยู่ในเบราว์เซอร์และไม่ส่งไปยังระบบหลังบ้าน การสมัครสมาชิกไม่ได้สร้างคำสั่งซื้อหรือเปิดร้านจริง</p><h3>ภาพประกอบ</h3><p>ภาพสินค้าบางส่วนมาจาก Unsplash และใช้เป็นภาพประกอบเท่านั้น ภาพกราฟิกใช้สาธิตแนวทางงานสร้างสรรค์</p>'},
  terms:{title:'ข้อกำหนดสำหรับเวอร์ชันสำรวจ',body:'<h3>รายการทั้งหมดเป็นตัวอย่าง</h3><p>รูปภาพ ชื่อร้าน ราคา และรายละเอียดสินค้ามีไว้แสดงประสบการณ์ของตลาด OpenCraft ไม่ใช่ข้อเสนอขายจากผู้ขายจริง</p><h3>ยังไม่มีการทำธุรกรรม</h3><p>การเพิ่มลงตะกร้าหรือกดตรวจสอบรายการจะไม่สร้างคำสั่งซื้อ ไม่เรียกเก็บเงิน และไม่จองสินค้า</p><h3>แบบร่างร้าน</h3><p>การบันทึกแบบร่างไม่ได้เปิดร้านจริงหรือทำข้อตกลงเป็นผู้ขาย ข้อมูลถูกเก็บเฉพาะในเบราว์เซอร์ที่คุณใช้งาน</p>'},
  faq:{title:'คำถามที่พบบ่อย',body:'<details open><summary>ตอนนี้สั่งซื้อสินค้าได้เลยไหม?</summary><p>ยังไม่ได้ รายการนี้เป็นตัวอย่างสำหรับสำรวจหน้าร้าน ระบบสั่งซื้อและชำระเงินจริงยังไม่เปิดใช้งาน</p></details><details><summary>รายการโปรดและตะกร้าหายไหมเมื่อปิดเว็บ?</summary><p>ข้อมูลจะยังอยู่เมื่อกลับมาใช้เบราว์เซอร์และอุปกรณ์เดิม หากลบข้อมูลเว็บไซต์หรือใช้โหมดไม่ระบุตัวตน ข้อมูลอาจไม่ถูกเก็บต่อ</p></details><details><summary>จะเริ่มขายได้อย่างไร?</summary><p>ไปหน้าสมัครผู้ขาย อ่านข้อกำหนดและส่งคำขอ ร้านจะยังไม่แสดงจนผ่านการอนุมัติ</p></details><details><summary>มีสินค้าประเภทไหนบ้าง?</summary><p>หน้าเว็บไซต์นี้แสดงตัวอย่างสินค้าไลฟ์สไตล์ ไฟล์ดิจิทัล งานออกแบบ แก็ดเจ็ต และบริการสร้างสรรค์</p></details>'}
};
function showInfo(key){if(['privacy','terms','seller-guide'].includes(key)){closeMain();navigateAuth(key==='privacy'?'/privacy':key==='terms'?'/terms':'/sell');return;}const page=infoPages[key]||infoPages.about;openMain(page.title,`<div class="dialog-body info-copy">${page.body}</div>`,'info');}

document.addEventListener('click',e=>{
  const btn=e.target.closest('button,a');if(!btn)return;
  if(btn.matches('.brand')){e.preventDefault();resetFilters();closeMenus();closeMain();if(cartDialog.open)cartDialog.close();history.replaceState(null,'',location.pathname);window.scrollTo({top:0,behavior:'smooth'});return;}
  if(btn.dataset.product){showProduct(btn.dataset.product);return;}
  if(btn.dataset.favorite){toggleFavorite(btn.dataset.favorite);return;}
  if(btn.dataset.add){addToCart(btn.dataset.add);return;}
  if(btn.dataset.category){applyCategory(btn.dataset.category);return;}
  if(btn.dataset.search){searchFor(btn.dataset.search);return;}
  if(btn.dataset.filter){state.filter=btn.dataset.filter;state.category='all';state.limit=products.length;renderProducts();return;}
  if(btn.dataset.info){showInfo(btn.dataset.info);return;}
  if(btn.dataset.remove){removeFromCart(btn.dataset.remove);return;}
  if(btn.dataset.quantity){changeCartQuantity(btn.dataset.quantity,Number(btn.dataset.delta));return;}
  const action=btn.dataset.action;
  if(action==='close-main')closeMain();
  if(action==='close-cart')cartDialog.close();
  if(action==='cart')showCart();
  if(action==='favorites')showFavorites();
  if(action==='seller')showSeller();
  if(action==='search')showSearch();
  if(action==='account')showAccount();
  if(action==='review')showReview();
  if(action==='keep-cart'){const ok=persistCart();closeMain();toast(ok?'เก็บรายการไว้ในตะกร้าแล้ว':'ยังเก็บไว้ได้ในหน้านี้ แต่เบราว์เซอร์ไม่อนุญาตให้บันทึก');}
  if(action==='browse'){goDiscover();}
  if(action==='reset'||action==='view-all'){resetFilters();state.limit=products.length;goDiscover();}
  if(action==='all-categories'){openMain('เลือกหมวดหมู่ที่คุณสนใจ',`<div class="dialog-body"><div class="categories-grid" style="grid-template-columns:repeat(4,1fr)">${categories.map(c=>`<button class="category-tile" data-category="${c.id}"><span class="category-icon" style="--category-color:${c.color}">${icon(c.icon)}</span><span>${c.name}</span></button>`).join('')}</div></div>`,'categories');}
  if(action==='mobile-menu'){const menu=document.querySelector('.mobile-menu');menu.hidden=!menu.hidden;btn.setAttribute('aria-expanded',String(!menu.hidden));}
  if(action==='collection-next'||action==='collection-prev'){const collection=document.querySelector('#collection-grid');if(collection.scrollWidth>collection.clientWidth){collection.scrollBy({left:(action==='collection-next'?1:-1)*collection.clientWidth*.88,behavior:'smooth'});}else{const buttons=[...collection.children];const target=action==='collection-next'?buttons[1]:buttons[0];target?.focus();}}
});

document.addEventListener('submit',e=>{
  if(e.target.id==='modal-search'){e.preventDefault();searchFor(new FormData(e.target).get('q'));}
  if(e.target.id==='seller-form'){
    e.preventDefault();const data=new FormData(e.target);const draft={name:String(data.get('shop')).trim(),category:data.get('category'),type:data.get('type'),description:String(data.get('description')).trim()};
    if(draft.name.length<2){e.target.elements.shop.setCustomValidity('กรุณาตั้งชื่อร้านอย่างน้อย 2 ตัวอักษร');e.target.elements.shop.reportValidity();e.target.elements.shop.addEventListener('input',()=>e.target.elements.shop.setCustomValidity(''),{once:true});return;}
    const ok=storage.set('seller-draft',draft);
    if(!ok){toast('เบราว์เซอร์ไม่อนุญาตให้บันทึกแบบร่าง');return;}
    openMain('แบบร่างร้านของคุณ',`<div class="dialog-body"><div class="success-panel"><div class="success-icon">${icon('check')}</div><h3>ไอเดียร้าน ${esc(draft.name)} พร้อมแล้ว</h3><p>บันทึกแบบร่างไว้ในเบราว์เซอร์นี้แล้ว<br>คุณสามารถกลับมาแก้ไขได้จาก “เริ่มขาย”<br>ร้านนี้ยังไม่ได้ถูกเผยแพร่หรือเปิดรับคำสั่งซื้อ</p><button class="button button-blue" data-action="close-main">เสร็จเรียบร้อย ${icon('check')}</button></div></div>`,'seller-success');
  }
});

hydrateIcons();
renderProducts();
updateBadges();

document.addEventListener('opencraft:open-product',event=>{const id=event.detail?.id;if(typeof id==='string')showProduct(id);});

export { products, categories };

document.addEventListener('opencraft:action',event=>{if(event.detail?.action==='favorites')showFavorites();if(event.detail?.action==='cart')showCart();if(event.detail?.action==='seller')showSeller();if(event.detail?.action==='help')showInfo('faq');});
