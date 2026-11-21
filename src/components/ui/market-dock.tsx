const categories = [
  {id:'all',label:'ทั้งหมด'}, {id:'digital',label:'ดิจิทัล'},
  {id:'gadget',label:'ไอทีและแก็ดเจ็ต'}, {id:'design',label:'งานออกแบบ'},
  {id:'fashion',label:'แฟชั่น'}, {id:'gaming',label:'เกม'},
  {id:'handmade',label:'แฮนด์เมด'}, {id:'service',label:'บริการ'},
];
export function MarketDock() {
  return <nav className="category-links" aria-label="หมวดหมู่สินค้า">{categories.map(category =>
    <button key={category.id} className={`category-tile category-link${category.id==='all'?' active':''}`} data-category={category.id} aria-pressed={category.id==='all'}>{category.label}</button>
  )}</nav>;
}
