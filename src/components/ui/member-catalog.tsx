import { useId, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, Search, X } from "lucide-react";
import { categories } from "@/lib/catalog";
import { setMarketFilters } from "@/commerce.js";
import { useCatalogResults } from "@/lib/marketplace-api";
import { useMarket } from "@/lib/use-market";
import AnimatedBackground from "./animated-tabs";
import { MarketProductCard } from "./market-product-card";

const types = [{ id: "all", label: "ทั้งหมด" }, { id: "physical", label: "สินค้า" }, { id: "digital", label: "ดิจิทัล" }, { id: "service", label: "บริการ" }];
const topics = [
  { id: "digital", title: "ไอเดียพร้อมต่อยอด", text: "ไฟล์ดิจิทัลและเครื่องมือ", image: "ui-kit.svg" },
  { id: "design", title: "สร้างแบรนด์ในแบบคุณ", text: "งานออกแบบและกราฟิก", image: "brand-design.svg" },
  { id: "gadget", title: "ของที่ใช้ ทุกวัน", text: "อุปกรณ์ทำงานและไลฟ์สไตล์", image: "headphones.jpg" },
  { id: "service", title: "ให้คนถนัดช่วยคุณ", text: "เว็บไซต์และบริการสร้างสรรค์", image: "desk.jpg" },
];
const suggestions = ["ออกแบบเว็บไซต์", "UI Kit", "หูฟัง"];

export default function MemberCatalog({ publicView = false, preferredCategories = [], memberName }: { publicView?: boolean; preferredCategories?: string[]; memberName?: string | null }) {
  const market = useMarket(), unique = useId();
  const query = useCatalogResults(market);
  const results = [...(query.data?.products || [])];
  if (market.sort === "recommended" && preferredCategories.length) results.sort((a, b) => Number(preferredCategories.includes(b.cat)) - Number(preferredCategories.includes(a.cat)));
  const shown = publicView ? results.slice(0, market.limit) : results;
  const filtered = !!(market.query || market.category !== "all" || market.filter !== "all");
  const id = publicView ? "public-catalog" : "member-catalog";
  const showResults = () => {
    const heading = document.getElementById(id + "-results-heading");
    heading?.focus({ preventScroll: true });
    heading?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  };
  const search = (event: FormEvent) => { event.preventDefault(); showResults(); };
  const chooseTopic = (category: string) => { setMarketFilters({ category, query: "", filter: "all", limit: 24 }); showResults(); };
  return <section id={id} className={"member-catalog market-gallery oc-discovery " + (publicView ? "is-public" : "is-member")} aria-labelledby={id + "-title"}>
    <header className="oc-discovery-hero">
      <div className="oc-hero-grid" aria-hidden="true"/>
      {!publicView && memberName && <p className="oc-welcome-name">สวัสดี {memberName}</p>}
      <h1 id={id + "-title"}>ทุกสิ่งที่มองหา<br className="oc-mobile-break"/> มาเจอกันที่นี่</h1>
      <p>สินค้า งานดิจิทัล และบริการ ในที่เดียว</p>
      <form className="oc-search-composer" role="search" onSubmit={search}>
        <Search size={21} strokeWidth={1.5} aria-hidden="true"/>
        <input type="search" maxLength={200} placeholder="วันนี้คุณกำลังมองหาอะไร?" aria-label="ค้นหาสินค้าและบริการ" value={market.query} onChange={event => setMarketFilters({ query: event.target.value, limit: 24 })}/>
        {market.query && <button className="oc-clear-search" type="button" onClick={() => setMarketFilters({ query: "" })} aria-label="ล้างคำค้นหา"><X size={17}/></button>}
        <button type="submit" className="oc-search-submit">ค้นหา<ArrowRight size={17}/></button>
      </form>
      <div className="oc-search-suggestions" aria-label="ลองค้นหา">{suggestions.map(text => <button key={text} onClick={() => { setMarketFilters({ query: text, category: "all", filter: "all", limit: 24 }); showResults(); }}>{text}<ArrowUpRight size={13}/></button>)}</div>
    </header>
    <div className="oc-topics-heading"><h2>เริ่มจากสิ่งที่คุณสนใจ</h2><button onClick={showResults}>สำรวจทั้งหมด<ArrowUpRight size={15}/></button></div>
    <div className="oc-topic-rail" aria-label="หมวดน่าค้นพบ">{topics.map(topic => <button key={topic.id} className="oc-topic-card" onClick={() => chooseTopic(topic.id)} aria-label={"ค้นหา " + topic.text}>
      <img src={"/assets/" + topic.image} alt="" width="600" height="400" loading="lazy"/>
      <span><strong>{topic.title}</strong><small>{topic.text}</small></span><ArrowUpRight size={19}/>
    </button>)}</div>
    <div className="market-catalog-tools">
      <div className="catalog-type-tabs" role="tablist" aria-label="ประเภทที่ต้องการค้นหา" onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const nodes = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")], index = nodes.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? nodes.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + nodes.length) % nodes.length;
        nodes[next]?.click(); nodes[next]?.focus();
      }}>
        <AnimatedBackground value={market.filter} onValueChange={value => { if (value) setMarketFilters({ filter: value, limit: 24 }); }} className="catalog-tab-background" transition={{ type: "spring", bounce: .1, duration: .3 }}>{types.map(type => <button key={type.id} data-id={type.id} role="tab" id={unique + "-" + type.id} aria-controls={id + "-results"} tabIndex={market.filter === type.id ? 0 : -1}>{type.label}</button>)}</AnimatedBackground>
      </div>
      <div className="member-category-list" aria-label="หมวดหมู่สินค้า">{[categories[categories.length - 1], ...categories.slice(0, -1)].map(category => <button key={category.id} aria-pressed={market.category === category.id} onClick={() => setMarketFilters({ category: category.id, limit: 24 })}>{category.id === "all" ? "แนะนำ" : category.name}</button>)}</div>
    </div>
    <div className="market-results-heading" id={id + "-results-heading"} tabIndex={-1}>
      <div><h2>{market.query ? "ผลการค้นหา “" + market.query + "”" : "ค้นพบสิ่งที่ใช่สำหรับคุณ"}</h2><p>{filtered ? "เลือกหมวดหรือเปลี่ยนคำค้นหาได้ตามต้องการ" : "ของที่ชอบ งานที่ใช่ และไอเดียสำหรับสิ่งต่อไป"}</p></div>
      <label className="member-sort"><span className="visually-hidden">เรียงสินค้า</span><select aria-label="เรียงสินค้า" value={market.sort} onChange={event => setMarketFilters({ sort: event.target.value })}><option value="recommended">แนะนำ</option><option value="newest">มาใหม่</option><option value="price-asc">ราคาต่ำไปสูง</option><option value="price-desc">ราคาสูงไปต่ำ</option></select></label>
    </div>
    {filtered && !query.loading && !query.error && <div className="member-filter-status" role="status"><span>พบ {results.length} รายการ</span><button onClick={() => setMarketFilters({ query: "", category: "all", filter: "all" })}>ล้างตัวกรอง<X size={13}/></button></div>}
    <div id={id + "-results"} className="reference-catalog-shelf" role="tabpanel" aria-labelledby={unique + "-" + market.filter} tabIndex={0}>
      {query.loading ? <div className="oc-product-skeletons" role="status" aria-label="กำลังค้นหาสินค้า">{[0,1,2].map(n => <div key={n}><span/><i/></div>)}</div>
        : query.error ? <div className="member-empty" role="alert"><Search size={26}/><h3>ยังโหลดสินค้าไม่ได้</h3><p>ลองเชื่อมต่ออีกครั้งเพื่อดูรายการ</p><button onClick={query.retry}>ลองโหลดสินค้าอีกครั้ง</button></div>
        : shown.length ? <div className="member-product-grid">{shown.map(item => <MarketProductCard item={item} publicView={publicView} saved={market.favorites.includes(item.id)} key={item.id}/>)}</div>
        : <div className="member-empty"><Search size={26}/><h3>ลองค้นหาอีกแบบดูไหม?</h3><p>ยังไม่พบรายการ ลองเปลี่ยนคำค้นหาหรือเลือกหมวดอื่น</p><button onClick={() => setMarketFilters({ query: "", category: "all", filter: "all" })}>ดูสินค้าทั้งหมด</button></div>}
    </div>
    {publicView && results.length > shown.length && <button className="landing-catalog-more" onClick={() => setMarketFilters({ limit: 24 })}>ค้นพบเพิ่มเติม<ArrowRight size={16}/></button>}
    <p className="member-catalog-note">รายการและราคาเป็นตัวอย่างสำหรับสำรวจ ยังไม่เปิดรับคำสั่งซื้อจริง</p>
  </section>;
}
