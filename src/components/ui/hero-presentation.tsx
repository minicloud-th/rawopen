import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useMotionValue } from 'framer-motion';
import { VideoRibbon } from './video-ribbon';
import ScrollMorphHero from './scroll-morph-hero';
import { clamp, graphemes, mix, out, paintBowl, span, type MotionBus } from '@/lib/presentation';

const storyLines = ['ของที่ชอบ', 'คนที่ใช่', 'ไอเดียที่ไปได้ไกลกว่า'];

function BrandIntro({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = window.setTimeout(onDone, 900); return () => clearTimeout(t); }, [onDone]);
  return <div className="brand-intro" aria-label="เปิดโลก OpenCraft">
    <div className="brand-intro-lockup"><img className="intro-symbol" src="/assets/opencraft-symbol.png" alt=""/><div className="intro-wordmark"><svg viewBox="220 170 1645 330" role="img" aria-label="OpenCraft"><image href="/assets/opencraft-wordmark.png" width="2048" height="682"/></svg></div></div>
    <button onClick={onDone} className="intro-skip">ข้ามการเปิดตัว <ArrowUpRight size={14}/></button>
  </div>;
}

export function HeroPresentation() {
  const reduced = useRef(matchMedia('(prefers-reduced-motion: reduce)').matches);
  const bus = useRef<MotionBus>({progress:0,paused:false,reduced:reduced.current,visible:true});
  const glowRef = useRef<HTMLCanvasElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const [intro, setIntro] = useState(() => !reduced.current && scrollY < 80 && !location.hash);
  const [reducedMotion, setReducedMotion] = useState(reduced.current);
  const galleryProgress = useMotionValue(0);
  const galleryReady = useRef(reduced.current);
  const revealGalleryCopy = useRef((visible: boolean) => {
    galleryReady.current = visible;
    document.body.classList.toggle('gallery-ready', visible);
  }).current;
  const finishIntro = useRef(() => setIntro(false)).current;

  useEffect(() => {
    document.body.classList.add('has-presentation');
    document.body.classList.toggle('intro-done', !intro);
  }, [intro]);

  useEffect(() => {
    const track=document.querySelector<HTMLElement>('#experience')!;
    const stage=document.querySelector<HTMLElement>('#presentation-stage')!;
    track.classList.add('has-jump-hero');
    const copy=document.querySelector<HTMLElement>('.hero-copy')!;
    const title=document.querySelector<HTMLElement>('#hero-title')!;
    const header=document.querySelector<HTMLElement>('.site-header')!;
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const oldTitle=title.innerHTML;
    const spark=title.querySelector('.hero-spark')?.outerHTML||'';
    title.setAttribute('aria-label','ทุกสิ่งที่มองหา มาเจอกันที่นี่');
    let charIndex=0;
    title.innerHTML=['ทุกสิ่งที่มองหา','มาเจอกันที่นี่'].map((line,index)=>`<span class="hero-jump-line" aria-hidden="true"><span class="hero-title-line" data-line="${index}">${graphemes(line).map(g=>`<span class="hero-glyph" style="--glyph:${charIndex++}">${g}</span>`).join('')}</span></span>`).join('')+spark;
    const lines=title.querySelectorAll<HTMLElement>('.hero-title-line');
    const chars=[...(storyRef.current?.querySelectorAll<HTMLElement>('.story-character')||[])];
    let frame=0,target=0,current=0,last=performance.now(),painted=-1,lastPaint=0,scene=-1,range=1,top=0;
    let rendered=-1,copyReady=false,stageWidth=1,stageHeight=1;
    const measure=()=>{rendered=-1;painted=-1;stageWidth=stage.clientWidth;stageHeight=stage.clientHeight;top=track.getBoundingClientRect().top+scrollY;range=Math.max(1,track.offsetHeight-stageHeight);read();};
    const read=()=>{target=clamp((scrollY-top)/range);header.classList.toggle('is-scrolled',scrollY>60);};
    const setReduced=()=>{bus.current.reduced=media.matches;setReducedMotion(media.matches);document.body.classList.toggle('reduce-motion',media.matches);if(media.matches)setIntro(false);measure();};
    const visibleObserver=new IntersectionObserver(([entry])=>{bus.current.visible=entry.isIntersecting;},{rootMargin:'100px'});visibleObserver.observe(track);
    const resizeObserver=new ResizeObserver(measure);resizeObserver.observe(stage);resizeObserver.observe(track);
    function loop(now:number){
      frame=requestAnimationFrame(loop);
      const delta=Math.min(now-last,60);last=now;
      if(!bus.current.visible||document.hidden)return;
      const still=bus.current.reduced||bus.current.paused;
      current=still?target:mix(current,target,1-Math.pow(.91,delta/16.667));
      if(Math.abs(target-current)<.00005)current=target;
      const p=bus.current.reduced?0:current;bus.current.progress=p;
      if(p===rendered&&copyReady===galleryReady.current)return;
      rendered=p;copyReady=galleryReady.current;
      galleryProgress.set(p);
      const fade=1-span(p,.265,.35),exit=out(span(p,.25,.36));
      const morph=out(span(p,0,.16));
      const copyOpacity=galleryReady.current?fade:0;
      copy.style.opacity=String(copyOpacity);
      copy.style.pointerEvents=copyOpacity>.5?'auto':'none';
      copy.inert=copyOpacity<.1;
      copy.style.transform=`translate3d(0,calc(-50% - ${morph*stageHeight*.13+exit*35}px),0)`;
      lines.forEach((line,i)=>{line.style.transform=`translate3d(${(i===0?-1:1)*exit*100}px,0,0)`;});
      const reveal=span(p,.35,.49),storyOpacity=span(p,.31,.38)*(1-span(p,.51,.59));
      stage.style.setProperty('--story-opacity',String(storyOpacity));
      stage.style.setProperty('--story-y',`${(1-out(span(p,.3,.43)))*75}px`);
      stage.style.setProperty('--ribbon-opacity',String(span(p,.55,.63)));
      stage.style.setProperty('--landing-opacity',String(span(p,.83,.91)));
      stage.style.setProperty('--progress',String(p));
      if(Math.abs(p-painted)>.001||painted===-1){
        chars.forEach((el,i)=>{const t=clamp((reveal*1.22-i/chars.length)/.22);el.style.opacity=String(clamp(t/.35));el.style.filter=`blur(${(1-span(t,0,.7))*7}px)`;el.style.color=t<.65?`rgb(${mix(205,36,span(t,.15,.65))} ${mix(228,87,span(t,.15,.65))} 255)`:`rgb(${mix(36,21,span(t,.65,1))} ${mix(87,32,span(t,.65,1))} ${mix(255,64,span(t,.65,1))})`;});
        if(glowRef.current&&now-lastPaint>32){paintBowl(glowRef.current,p,stageWidth/stageHeight);lastPaint=now;painted=p;}
      }
      const next=p<.34?0:p<.59?1:2;
      if(next!==scene){scene=next;stage.dataset.scene=String(scene);}
      const skip=stage.querySelector<HTMLElement>('.landing-link');if(skip)skip.inert=p<.83;
    }
    setReduced();measure();
    frame=requestAnimationFrame(loop);
    addEventListener('scroll',read,{passive:true});addEventListener('resize',measure);media.addEventListener('change',setReduced);
    return ()=>{cancelAnimationFrame(frame);removeEventListener('scroll',read);removeEventListener('resize',measure);media.removeEventListener('change',setReduced);visibleObserver.disconnect();resizeObserver.disconnect();track.classList.remove('has-jump-hero');title.innerHTML=oldTitle;copy.inert=false;};
  },[galleryProgress]);

  return <>
    <canvas ref={glowRef} className="bowl-atmosphere" width="96" height="60" aria-hidden="true"/>
    <ScrollMorphHero progress={galleryProgress} ready={!intro} paused={false} reduced={reducedMotion} onReveal={revealGalleryCopy}/>
    <div className="motion-statement" ref={storyRef} aria-label={storyLines.join(' ')}><h2 aria-hidden="true">{storyLines.map((line,lineIndex)=><span className="story-line" key={lineIndex}>{graphemes(line).map((char,i)=><span className="story-character" key={i}>{char}</span>)}</span>)}</h2></div>
    <VideoRibbon bus={bus}/>
    <div className="landing-copy"><h2>สินค้า บริการ และงานสร้างสรรค์</h2></div>
    <a href="#discover" className="landing-link">ดูสินค้าและบริการ <ArrowUpRight size={17}/></a>
    <div className="presentation-controls"><a className="skip-presentation" href="#discover">ข้ามไปดูสินค้า <ArrowDown size={14}/></a></div>
    {intro&&<BrandIntro onDone={finishIntro}/>}
  </>;
}
