import { Heart, Plus } from "lucide-react";
import { addToCart, toggleFavorite } from "@/commerce.js";

type Product = { id: string; title: string; image: string; price: number; type: string };
export function MarketProductCard({ item, publicView = false, saved = false }: { item: Product; publicView?: boolean; saved?: boolean }) {
  const open = () => document.dispatchEvent(new CustomEvent("opencraft:open-product", { detail: { id: item.id } }));
  return <article className="member-product oc-product-card reference-product">
    <header className="reference-product-heading">
      <span className="reference-product-kind">{item.type === "service" ? "บริการ" : item.type === "digital" ? "ดิจิทัล" : "สินค้า"}</span>
      <h3><button onClick={open}>{item.title}</button></h3>
      {!publicView && <button className={"reference-product-save " + (saved ? "is-saved" : "")} aria-label={(saved ? "นำออกจากรายการที่บันทึก " : "บันทึก ") + item.title} aria-pressed={saved} onClick={() => toggleFavorite(item.id)}><Heart size={20}/></button>}
    </header>
    <div className="reference-product-visual" data-oc-reveal={item.id}>
      <button aria-label={"ดู " + item.title} onClick={open}><img src={"/assets/" + item.image} alt={item.title} width="900" height="670" loading="lazy" decoding="async"/></button>
    </div>
    <footer className="reference-product-footer">
      <span>{item.type === "service" ? "เริ่ม " : ""}฿{item.price.toLocaleString("th-TH")}</span>
      {publicView ? <button className="reference-product-action" onClick={open}>ดูรายละเอียด</button> : <button className="reference-product-action" onClick={() => addToCart(item.id)} aria-label={"เพิ่ม " + item.title + " ลงตะกร้า"}><Plus size={16}/>เพิ่ม</button>}
    </footer>
  </article>;
}
