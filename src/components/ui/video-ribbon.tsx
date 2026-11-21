import { useEffect, useRef, useState, type RefObject } from 'react';
import type * as ThreeTypes from 'three';
import { clamp, mix, out, span, type MotionBus } from '@/lib/presentation';

type RibbonItem = { id: string; title: string; image: string; video?: string };
export const ribbonItems: RibbonItem[] = [
  {id:'uikit',title:'Canvas UI Kit',image:'ui-kit.svg'},
  {id:'headphones',title:'Everyday Wireless',image:'headphones.jpg'},
  {id:'website',title:'เว็บไซต์ที่เป็นคุณ',image:'web-design.svg',video:'creative-preview.mp4'},
  {id:'sneaker',title:'Everyday Runner',image:'sneaker.jpg'},
  {id:'brand',title:'ไอเดียสู่แบรนด์',image:'brand-design.svg'},
  {id:'social',title:'Social Studio',image:'social-kit.svg'},
  {id:'controller',title:'พร้อมทุกแมตช์',image:'controller.jpg'},
  {id:'keyboard',title:'มุมทำงานที่ชอบ',image:'keyboard.jpg'},
];

/** Arc-length rail and double-sided shader adapted from the supplied Vante ribbon. */
export function VideoRibbon({ bus }: { bus: RefObject<MotionBus> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    let disposed = false, frame = 0, cleanup = () => {};
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (bus.current.reduced) { setFallback(true); return; }
    async function start() {
      const context = canvas?.getContext('webgl2', { alpha:true, antialias:true });
      if (!context) { if(!disposed) setFallback(true); return; }
      const THREE = await import('three');
      if (disposed || !canvas) return;
      let renderer: ThreeTypes.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({canvas, context, alpha:true, antialias:true, powerPreference:'low-power'});
      } catch { setFallback(true); return; }
      renderer.setClearColor(0, 0);
      renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
      canvas.dataset.renderer = 'webgl';
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35,1,.1,100);
      const pts = [];
      for (let i=0; i<=160; i++) {
        const t=i/160, ph=mix(-1.5,Math.PI*2+1.35,t), cs=Math.cos(ph), u=2*t-1;
        const depth=cs>0?7.6+16.4*cs**.9:7.6+2.2*cs;
        const edge=.84+.5*span(.14-t,0,.14)+.8*span(t,.84,1);
        pts.push(new THREE.Vector3(edge*Math.sin(ph)*depth*.561,.5*Math.sign(u)*Math.abs(u)**1.4*depth*.63,-depth));
      }
      const path = new THREE.CatmullRomCurve3(pts,false,'centripetal');
      path.arcLengthDivisions=1500;
      const length=path.getLength(), samples=800;
      const pathP=Array.from({length:samples+1},(_,i)=>path.getPointAt(i/samples));
      const pathT=Array.from({length:samples+1},(_,i)=>path.getTangentAt(i/samples));
      const at=(s:number, op:ThreeTypes.Vector3, ot:ThreeTypes.Vector3)=>{
        const f=clamp(s/length)*samples, i=Math.min(samples-1,Math.floor(f)), k=f-i;
        op.lerpVectors(pathP[i],pathP[i+1],k);ot.lerpVectors(pathT[i],pathT[i+1],k).normalize();
      };
      const CW=2.1, CH=1.32, STEP=CW+.03, NX=20, NY=2, GZ=8;
      const vertexShader='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
      const fragmentShader=`uniform sampler2D map;uniform vec2 cover;uniform float aspect,ready;varying vec2 vUv;
        void main(){float r=.028;vec2 q=(abs(vUv-.5)-.5)*vec2(aspect,1.)+r;
        float d=length(max(q,0.))+min(max(q.x,q.y),0.)-r;float px=fwidth(d);float a=1.-smoothstep(-px,px,d);
        if(a<.01)discard;vec2 uv=vUv;if(!gl_FrontFacing)uv.x=1.-uv.x;
        vec3 c=mix(vec3(.92,.94,.98),texture2D(map,(uv-.5)*cover+.5).rgb,ready);
        float edge=smoothstep(-.014-px,-.014,d);gl_FragColor=vec4(mix(c,vec3(1.),edge*.45),a);}`;
      let dirty=true;
      const loader=new THREE.TextureLoader();
      const cards=ribbonItems.map((item,i)=>{
        const geo=new THREE.PlaneGeometry(1,1,NX,NY);
        const tex=loader.load('/assets/'+item.image,texture=>{
          const img=texture.image as HTMLImageElement, a=img.width/img.height;
          mat.uniforms.cover.value.set(a>CW/CH?(CW/CH)/a:1,a>CW/CH?1:a/(CW/CH));
          mat.uniforms.ready.value=1;dirty=true;
        });
        tex.colorSpace=THREE.NoColorSpace;
        const mat=new THREE.ShaderMaterial({vertexShader,fragmentShader,transparent:true,side:THREE.DoubleSide,uniforms:{map:{value:tex},cover:{value:new THREE.Vector2(1,1)},aspect:{value:CW/CH},ready:{value:0}}});
        const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;scene.add(mesh);
        let video:HTMLVideoElement|undefined, videoTexture:ThreeTypes.VideoTexture|undefined;
        if(item.video){
          video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.preload='none';video.src='/assets/'+item.video;video.setAttribute('playsinline','');
          videoTexture=new THREE.VideoTexture(video);videoTexture.colorSpace=THREE.NoColorSpace;videoTexture.minFilter=THREE.LinearFilter;
          const vt=videoTexture;
          video.addEventListener('loadeddata',()=>{if(!disposed){mat.uniforms.map.value=vt;mat.uniforms.ready.value=1;dirty=true;}});
        }
        return {i,item,geo,tex,mat,mesh,video,videoTexture,playing:false};
      });
      let W=1,H=1,asp=1,tan=.3153,cols=3,rows=2,previous=-1,last=0;
      const grid=(i:number)=>{
        const vh=2*GZ*tan,vw=vh*asp,gw=vw*(cols===3?.72:.88),gap=gw*.023;
        const w=(gw-gap*(cols-1))/cols,h=w/(CW/CH),gh=h*rows+gap*1.6*(rows-1),c=i%cols,r=Math.floor(i/cols);
        return {x:-gw/2+w/2+c*(w+gap),y:gh/2-h/2-r*(h+gap*1.6),w,h,vw,vh,c,r};
      };
      const resize=()=>{
        const stage=canvas.parentElement!;W=stage.clientWidth;H=stage.clientHeight;asp=W/H;
        renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(W,H,false);
        camera.aspect=asp;camera.fov=asp<16/9?Math.atan(.561/asp)*360/Math.PI:35;camera.updateProjectionMatrix();tan=Math.tan(camera.fov*Math.PI/360);
        cols=asp<.9?2:3;rows=asp<.9?3:2;previous=-1;
        stage.querySelectorAll<HTMLElement>('.ribbon-hotspot').forEach((el,i)=>{const g=grid(i);el.style.left=((g.x-g.w/2)/g.vw+.5)*100+'%';el.style.top=(.5-(g.y+g.h/2)/g.vh)*100+'%';el.style.width=g.w/g.vw*100+'%';el.style.height=g.h/g.vh*100+'%';});
      };
      const observer=new ResizeObserver(resize);observer.observe(canvas.parentElement!);resize();
      const op=new THREE.Vector3(),ot=new THREE.Vector3(),up=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0),vp=new THREE.Vector3();
      const poseRibbon=(card:typeof cards[number],head:number)=>{
        const pos=card.geo.attributes.position,center=head-card.i*STEP;
        for(let iy=0;iy<=NY;iy++)for(let ix=0;ix<=NX;ix++){
          const k=iy*(NX+1)+ix;at(center+(ix/NX-.5)*CW,op,ot);up.copy(Y).addScaledVector(ot,-Y.dot(ot)).normalize();vp.copy(op).addScaledVector(up,(.5-iy/NY)*CH);pos.setXYZ(k,vp.x,vp.y,vp.z);
        }
        pos.needsUpdate=true;
      };
      const poseGrid=(card:typeof cards[number],q:number)=>{
        const g=grid(card.i),pos=card.geo.attributes.position,dx=(g.c-(cols-1)/2)*1.2,dy=g.r<rows/2?1:-1;
        const ox=dx*g.vw*.62*(1-q),oy=dy*g.vh*(g.c===1?.95:.34)*(1-q),tilt=(1-q)*.22*(g.c-1||.5)*dy,cs=Math.cos(tilt),sn=Math.sin(tilt);
        for(let iy=0;iy<=NY;iy++)for(let ix=0;ix<=NX;ix++){
          const x=(ix/NX-.5)*g.w,y=(.5-iy/NY)*g.h;
          pos.setXYZ(iy*(NX+1)+ix,g.x+ox+x*cs-y*sn,g.y+oy+x*sn+y*cs,-GZ-(1-q)*.6*Math.sin(ix/NX*Math.PI));
        }pos.needsUpdate=true;
      };
      let showHotspots=false,lastPaused=bus.current.paused;
      const loop=(now:number)=>{
        frame=requestAnimationFrame(loop);
        const b=bus.current;
        if(!b.visible||document.hidden){previous=-1;for(const c of cards){c.video?.pause();c.playing=false;}return;}
        if(lastPaused!==b.paused){previous=-1;lastPaused=b.paused;}
        const p=span(b.progress,.4,.97),hot=p>.86;
        if(hot!==showHotspots){showHotspots=hot;canvas.parentElement!.querySelectorAll<HTMLElement>('.ribbon-hotspot').forEach(el=>{el.inert=!hot;el.tabIndex=hot?0:-1;el.style.pointerEvents=hot?'auto':'none';el.style.visibility=hot?'visible':'hidden';});}
        if(now-last<1000/45)return;
        if(Math.abs(p-previous)<.00003&&!cards.some(c=>c.playing)&&!dirty)return;
        last=now;previous=p;
        const head=mix(0,length+cards.length*STEP,span(p,.14,.63));
        for(const c of cards){const s=head-c.i*STEP,end=length-CW;
          if(s<end){c.mesh.visible=s>CW;if(c.mesh.visible)poseRibbon(c,head);}
          else if(c.i<cols*rows){const st=mix(.14,.63,(end+c.i*STEP)/(length+cards.length*STEP)),q=out(span(p,st,st+.13));c.mesh.visible=q>.001;if(c.mesh.visible)poseGrid(c,q);}
          else c.mesh.visible=false;
          const shouldPlay=!!c.video&&c.mesh.visible&&!b.paused&&!b.reduced&&b.progress>.45;
          if(shouldPlay&&!c.playing){c.playing=true;c.video!.play().catch(()=>{c.playing=false;});}
          else if(!shouldPlay&&c.playing){c.video!.pause();c.playing=false;}
        }
        renderer.render(scene,camera);dirty=false;canvas.dataset.frame=String(Math.round(b.progress*1000));
      };
      frame=requestAnimationFrame(loop);
      const contextLost=(e:Event)=>{e.preventDefault();setFallback(true);};canvas.addEventListener('webglcontextlost',contextLost);
      cleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('webglcontextlost',contextLost);for(const c of cards){c.video?.pause();if(c.video){c.video.removeAttribute('src');c.video.load();}c.videoTexture?.dispose();c.tex.dispose();c.geo.dispose();c.mat.dispose();}renderer.dispose();};
    }
    start().catch(()=>{if(!disposed)setFallback(true);});
    return ()=>{disposed=true;cleanup();};
  },[bus]);
  return <div className="ribbon-scene" aria-label="คอลเลกชันสินค้า OpenCraft">
    {!fallback && <><canvas ref={canvasRef} className="ribbon-canvas" aria-hidden="true"/>{ribbonItems.slice(0,6).map(item=><button key={item.id} className="ribbon-hotspot" data-product={item.id} aria-label={`ดู ${item.title}`} tabIndex={-1}><span>{item.title} ↗</span></button>)}</>}
    {fallback && <DOMRibbon bus={bus}/>}
  </div>;
}

/** Same depth rail in the DOM for browsers with WebGL disabled. */
function DOMRibbon({bus}:{bus:RefObject<MotionBus>}) {
  const root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const node=root.current!;
    const elements=[...node.querySelectorAll<HTMLButtonElement>('.dom-ribbon-card')];
    const media=elements.map(el=>el.querySelector<HTMLElement>('.dom-ribbon-media')!);
    const videos=elements.map(el=>el.querySelector('video'));
    const points=Array.from({length:801},(_,i)=>{
      const t=i/800,ph=mix(-1.5,Math.PI*2+1.35,t),cs=Math.cos(ph),u=2*t-1;
      const depth=cs>0?7.6+16.4*cs**.9:7.6+2.2*cs;
      const edge=.84+.5*span(.14-t,0,.14)+.8*span(t,.84,1);
      return {x:edge*Math.sin(ph)*depth*.561,y:.5*Math.sign(u)*Math.abs(u)**1.4*depth*.63,z:-depth};
    });
    const lengths=[0];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];lengths.push(lengths[i-1]+Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z));}
    const length=lengths[lengths.length-1];
    function sample(s:number){
      const value=clamp(s,0,length);let lo=0,hi=lengths.length-2;
      while(lo<hi){const mid=(lo+hi+1)>>1;if(lengths[mid]>value)hi=mid-1;else lo=mid;}
      const a=points[lo],b=points[lo+1],f=clamp((value-lengths[lo])/(lengths[lo+1]-lengths[lo]));
      const vx=b.x-a.x,vy=b.y-a.y,vz=b.z-a.z,n=Math.hypot(vx,vy,vz);
      return {x:mix(a.x,b.x,f),y:mix(a.y,b.y,f),z:mix(a.z,b.z,f),tx:vx/n,ty:vy/n,tz:vz/n};
    }
    let W=1,H=1,asp=1,tan=.3153,P=1000,scale=100,cols=3,rows=2,previous=-1,frame=0,lastPaused=bus.current.paused;
    const resize=()=>{W=node.clientWidth;H=node.clientHeight;asp=W/H;const fov=asp<16/9?Math.atan(.561/asp)*2:35*Math.PI/180;tan=Math.tan(fov/2);P=H/(2*tan);scale=P/8;node.style.perspective=P+'px';cols=asp<.9?2:3;rows=asp<.9?3:2;previous=-1;};
    const observer=new ResizeObserver(resize);observer.observe(node);resize();
    function grid(i:number){const vh=16*tan,vw=vh*asp,gw=vw*(cols===3?.72:.88),gap=gw*.023,w=(gw-gap*(cols-1))/cols,h=w/(2.1/1.32),gh=h*rows+gap*1.6*(rows-1),c=i%cols,r=Math.floor(i/cols);return{x:-gw/2+w/2+c*(w+gap),y:gh/2-h/2-r*(h+gap*1.6),w,h,vw,vh,c,r};}
    function loop(){
      frame=requestAnimationFrame(loop);
      const b=bus.current;
      if(!b.visible||document.hidden||b.reduced){previous=-1;videos.forEach(v=>v?.pause());return;}
      if(lastPaused!==b.paused){previous=-1;lastPaused=b.paused;}
      const p=span(b.progress,.4,.97),changed=Math.abs(p-previous)>.00002;
      if(!changed){if(b.paused)videos.forEach(v=>v?.pause());return;}
      previous=p;node.dataset.progress=String(Math.round(p*1000));
      const head=mix(0,length+elements.length*2.13,span(p,.14,.63));
      elements.forEach((el,i)=>{
        const s=head-i*2.13,end=length-2.1,video=videos[i];let visible=false;
        if(s<end){
          visible=s>2.1;
          if(visible){const c=sample(s),dot=c.ty;let ux=-c.tx*dot,uy=1-c.ty*dot,uz=-c.tz*dot;const n=Math.hypot(ux,uy,uz);ux/=n;uy/=n;uz/=n;
            const xx=c.tx,xy=-c.ty,xz=c.tz,yx=-ux,yy=uy,yz=-uz,nx=xy*yz-xz*yy,ny=xz*yx-xx*yz,nz=xx*yy-xy*yx;
            el.style.width=2.1*scale+'px';el.style.height=1.32*scale+'px';el.style.marginLeft=-2.1*scale/2+'px';el.style.marginTop=-1.32*scale/2+'px';
            el.style.transform=`matrix3d(${xx},${xy},${xz},0,${yx},${yy},${yz},0,${nx},${ny},${nz},0,${c.x*scale},${-c.y*scale},${P+c.z*scale},1)`;
            media[i].style.transform=nz<0?'scaleX(-1)':'none';
          }
        }else if(i<6){
          const st=mix(.14,.63,(end+i*2.13)/(length+elements.length*2.13)),q=out(span(p,st,st+.13)),g=grid(i),dy=g.r<rows/2?1:-1,dx=(g.c-(cols-1)/2)*1.2;
          visible=q>.001;const x=g.x+dx*g.vw*.62*(1-q),y=g.y+dy*g.vh*(g.c===1?.95:.34)*(1-q),tilt=(1-q)*.22*(g.c-1||.5)*dy;
          el.style.width=g.w*scale+'px';el.style.height=g.h*scale+'px';el.style.marginLeft=-g.w*scale/2+'px';el.style.marginTop=-g.h*scale/2+'px';el.style.transform=`translate3d(${x*scale}px,${-y*scale}px,0) rotateZ(${-tilt}rad)`;media[i].style.transform='none';
        }
        el.style.visibility=visible?'visible':'hidden';el.inert=p<.86;el.style.pointerEvents=p>.86?'auto':'none';el.tabIndex=p>.86?0:-1;
        if(video){if(visible&&!b.paused&&b.progress>.45){if(video.paused)video.play().catch(()=>{});}else video.pause();}
      });
    }
    frame=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(frame);observer.disconnect();videos.forEach(v=>v?.pause());};
  },[bus]);
  return <div ref={root} className="dom-ribbon" data-renderer="css-3d">{ribbonItems.map(item=><button key={item.id} className="dom-ribbon-card" data-product={item.id} aria-label={`ดู ${item.title}`} tabIndex={-1}><div className="dom-ribbon-media">{item.video?<video poster={'/assets/'+item.image} src={'/assets/'+item.video} muted loop playsInline preload="none"/>:<img src={'/assets/'+item.image} alt=""/>}<span>{item.title} ↗</span></div></button>)}</div>;
}
