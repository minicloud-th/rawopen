"use client";

// Adapted from the supplied Hyperiux Vault Split Canvas component.
// https://vault.hyperiux.com — local imagery, lazy WebGL and a Canvas 2D fallback.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type * as ThreeTypes from 'three';
import { ArrowUpRight } from 'lucide-react';

export interface SplitCanvasItem {
  image: string; title: string; description?: string; label?: string;
  category?: string; actionLabel?: string;
}
export interface SplitCanvasProps {
  items: SplitCanvasItem[]; gridSize?: number; numSlices?: number;
  canvasSize?: number; gridOpacity?: number; className?: string;
}

const VERTEX = `varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`;
const FRAGMENT = `
uniform sampler2D u_from,u_to;
uniform float u_progress,u_numSlices,u_gridSize,u_gridOpacity;
uniform vec2 u_resolution;
uniform vec3 u_gridColor;
varying vec2 vUv;
vec2 cellSize(){vec2 n=max(floor(u_resolution/u_gridSize),vec2(1.0));return u_resolution/n;}
vec2 pixelate(vec2 uv){vec2 c=cellSize();return(floor(uv*u_resolution/c)+0.5)*c/u_resolution;}
void main(){
 vec2 uv=vUv,c=cellSize(),px=uv*u_resolution;
 float line=max(step(mod(px.x,c.x),1.0),step(mod(px.y,c.y),1.0));
 vec4 grid=vec4(u_gridColor,line*u_gridOpacity),tex;
 if(u_progress<0.001)tex=texture2D(u_from,uv);
 else if(u_progress>0.999)tex=texture2D(u_to,uv);
 else{
  float delay=floor(uv.y*u_numSlices)/u_numSlices*0.6;
  float t=smoothstep(delay,delay+0.4,u_progress);
  if(fract(uv.y*u_numSlices)<t)tex=texture2D(u_to,pixelate(uv));
  else tex=texture2D(u_from,pixelate(vec2(uv.x,clamp(uv.y-t/u_numSlices,0.0,1.0))));
 }
 gl_FragColor=vec4(mix(grid.rgb,tex.rgb,tex.a),max(grid.a,tex.a));
}`;
const clamp = (n: number, low = 0, high = 1) => Math.min(high, Math.max(low, n));
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };

function imageCanvas(src: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const image = new Image(); image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
      const context = canvas.getContext('2d');
      if (!context) { reject(new Error('Canvas unavailable')); return; }
      const scale = Math.min(1024 / image.naturalWidth, 1024 / image.naturalHeight);
      const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
      context.drawImage(image, (1024 - w) / 2, (1024 - h) / 2, w, h); resolve(canvas);
    };
    image.onerror = () => reject(new Error('Image unavailable')); image.src = src;
  });
}
type Graphics = {
  renderer: ThreeTypes.WebGLRenderer; scene: ThreeTypes.Scene; camera: ThreeTypes.Camera;
  geometry: ThreeTypes.PlaneGeometry; material: ThreeTypes.ShaderMaterial; textures: ThreeTypes.CanvasTexture[];
};

export default function SplitCanvas({ items, gridSize = 16, numSlices = 24, canvasSize = 520, gridOpacity = .12, className = '' }: SplitCanvasProps) {
  const rootRef = useRef<HTMLElement>(null), wrapRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLCanvasElement>(null), posterRef = useRef<HTMLImageElement>(null);
  const sections = useRef<(HTMLElement | null)[]>([]), requestDraw = useRef(() => {});
  const settings = useRef({ gridSize, numSlices, gridOpacity }); settings.current = { gridSize, numSlices, gridOpacity };
  const [staticLayout, setStaticLayout] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(max-width: 900px) and (max-height: 600px)').matches);
  const imagesKey = items.map(item => item.image).join('|');

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'), shortScreen = matchMedia('(max-width: 900px) and (max-height: 600px)');
    const change = () => setStaticLayout(media.matches || shortScreen.matches);
    media.addEventListener('change', change); shortScreen.addEventListener('change', change);
    return () => { media.removeEventListener('change', change); shortScreen.removeEventListener('change', change); };
  }, []);

  useEffect(() => {
    const root = rootRef.current, wrap = wrapRef.current, fallback = fallbackRef.current, poster = posterRef.current;
    if (!root || !wrap || !fallback || !poster || !items.length || staticLayout) return;
    // Start each graphics session with a visible image while its canvases load.
    poster.style.display = 'block'; fallback.style.display = 'none'; wrap.dataset.renderer = 'image';
    const context = fallback.getContext('2d');
    let disposed = false, visible = false, started = false, frame = 0, size = 1, dpr = 1, glLost = false;
    let graphics: Graphics | null = null, glCanvas: HTMLCanvasElement | null = null;
    let sources: HTMLCanvasElement[] = [], small: HTMLCanvasElement[] = [], smallKey = '';
    const colorCanvas = document.createElement('canvas'); colorCanvas.width = colorCanvas.height = 1;
    const colorContext = colorCanvas.getContext('2d'); let color = [93, 122, 162];
    const syncColor = () => {
      if (!colorContext) return;
      colorContext.clearRect(0, 0, 1, 1); colorContext.fillStyle = getComputedStyle(wrap).color; colorContext.fillRect(0, 0, 1, 1);
      color = [...colorContext.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const syncSize = () => {
      size = Math.max(1, Math.round(wrap.clientWidth)); dpr = Math.min(devicePixelRatio || 1, 2);
      const pixels = Math.round(size * dpr);
      if (fallback.width !== pixels || fallback.height !== pixels) fallback.width = fallback.height = pixels;
      if (graphics) { graphics.renderer.setPixelRatio(dpr); graphics.renderer.setSize(size, size, false); }
      smallKey = '';
    };
    const pixelSources = () => {
      const count = Math.max(1, Math.floor(size / Math.max(2, settings.current.gridSize))), key = `${count}:${sources.length}`;
      if (key === smallKey) return;
      small.forEach(canvas => { canvas.width = canvas.height = 0; });
      small = sources.map(source => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = count; canvas.getContext('2d')?.drawImage(source, 0, 0, count, count); return canvas; });
      smallKey = key;
    };
    const paint2D = (from: number, progress: number) => {
      if (!context || !sources.length) return false;
      context.setTransform(dpr, 0, 0, dpr, 0, 0); context.clearRect(0, 0, size, size);
      const gap = size / Math.max(1, Math.floor(size / Math.max(2, settings.current.gridSize)));
      context.strokeStyle = `rgba(${color.join(',')},${clamp(settings.current.gridOpacity)})`; context.lineWidth = 1; context.beginPath();
      for (let p = 0; p <= size; p += gap) { context.moveTo(p + .5, 0); context.lineTo(p + .5, size); context.moveTo(0, p + .5); context.lineTo(size, p + .5); }
      context.stroke(); const to = Math.min(from + 1, sources.length - 1);
      if (progress < .001 || progress > .999) { context.imageSmoothingEnabled = true; context.drawImage(sources[progress > .999 ? to : from], 0, 0, size, size); }
      else {
        pixelSources(); const slices = Math.max(1, Math.round(settings.current.numSlices)), stripe = size / slices;
        const part = (source: HTMLCanvasElement, sy: number, dy: number, height: number) => {
          if (height < .01) return; const f = source.width / size;
          context.save(); context.beginPath(); context.rect(0, dy, size, height + .5); context.clip(); context.imageSmoothingEnabled = false;
          context.drawImage(source, 0, sy * f, source.width, height * f, 0, dy, size, height); context.restore();
        };
        for (let row = 0; row < slices; row++) {
          const delay = (slices - 1 - row) / slices * .6, t = smooth((progress - delay) / .4), y = row * stripe, cut = t * stripe;
          part(small[from], y + cut, y, stripe - cut); part(small[to], y + stripe - cut, y + stripe - cut, cut);
        }
      }
      return true;
    };
    const draw = () => {
      frame = 0; if (disposed || !visible || document.hidden) return;
      const bounds = wrap.getBoundingClientRect(); let from = 0, progress = 0;
      for (let i = 1; i < items.length; i++) {
        const edge = sections.current[i]?.getBoundingClientRect().top ?? Infinity;
        if (edge <= bounds.top) from = i;
        else { if (edge < bounds.bottom) progress = clamp((bounds.bottom - edge) / bounds.height); break; }
      }
      root.dataset.active = String(from); root.dataset.transition = progress.toFixed(3);
      if (graphics && !glLost) {
        const u = graphics.material.uniforms;
        u.u_from.value = graphics.textures[from]; u.u_to.value = graphics.textures[Math.min(from + 1, items.length - 1)]; u.u_progress.value = progress;
        u.u_gridSize.value = Math.max(2, settings.current.gridSize); u.u_numSlices.value = Math.max(1, Math.round(settings.current.numSlices));
        u.u_gridOpacity.value = clamp(settings.current.gridOpacity); u.u_resolution.value.set(size, size); u.u_gridColor.value.setRGB(color[0] / 255, color[1] / 255, color[2] / 255);
        try { graphics.renderer.render(graphics.scene, graphics.camera); graphics.renderer.domElement.style.display = 'block'; fallback.style.display = poster.style.display = 'none'; wrap.dataset.renderer = 'webgl'; return; }
        catch { glLost = true; graphics.renderer.domElement.style.display = 'none'; }
      }
      if (paint2D(from, progress)) { fallback.style.display = 'block'; poster.style.display = 'none'; wrap.dataset.renderer = 'canvas-2d'; }
      else { const image = items[progress > .5 ? Math.min(from + 1, items.length - 1) : from].image; if (poster.getAttribute('src') !== image) poster.src = image; poster.style.display = 'block'; wrap.dataset.renderer = 'image'; }
    };
    const schedule = () => { if (!frame && visible && !document.hidden && !disposed) frame = requestAnimationFrame(draw); };
    const onContextLost = (event: Event) => { event.preventDefault(); glLost = true; if (glCanvas) glCanvas.style.display = 'none'; schedule(); };
    const start = async () => {
      try {
        const loaded = await Promise.all(items.map(item => imageCanvas(item.image)));
        if (disposed) { loaded.forEach(canvas => { canvas.width = canvas.height = 0; }); return; }
        sources = loaded; schedule(); const canvas = document.createElement('canvas');
        const glContext = canvas.getContext('webgl2', { alpha: true, antialias: false }); if (!glContext) return;
        glCanvas = canvas; const THREE = await import('three'); if (disposed) return;
        const renderer = new THREE.WebGLRenderer({ canvas, context: glContext, alpha: true, antialias: false });
        renderer.setClearColor(0x000000, 0); renderer.setPixelRatio(dpr); renderer.setSize(size, size, false);
        renderer.domElement.className = 'sc-webgl'; renderer.domElement.style.display = 'none'; wrap.appendChild(renderer.domElement);
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, transparent: true, uniforms: {
          u_from: { value: null }, u_to: { value: null }, u_progress: { value: 0 }, u_numSlices: { value: 24 }, u_gridSize: { value: 16 },
          u_resolution: { value: new THREE.Vector2(size, size) }, u_gridColor: { value: new THREE.Color() }, u_gridOpacity: { value: .12 },
        } });
        const textures = sources.map(source => { const texture = new THREE.CanvasTexture(source); texture.minFilter = texture.magFilter = THREE.NearestFilter; texture.generateMipmaps = false; texture.colorSpace = THREE.NoColorSpace; return texture; });
        const scene = new THREE.Scene(), camera = new THREE.Camera(); scene.add(new THREE.Mesh(geometry, material));
        graphics = { renderer, scene, camera, geometry, material, textures }; renderer.domElement.addEventListener('webglcontextlost', onContextLost); schedule();
      } catch { schedule(); }
    };
    requestDraw.current = schedule; syncColor(); syncSize();
    const resize = new ResizeObserver(() => { syncSize(); schedule(); }); resize.observe(wrap);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting; if (visible && !started) { started = true; void start(); }
      if (visible) schedule(); else { cancelAnimationFrame(frame); frame = 0; }
    }, { rootMargin: '200px' }); visibility.observe(root);
    const theme = new MutationObserver(() => { syncColor(); schedule(); }); theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
    const onVisibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else schedule(); };
    window.addEventListener('scroll', schedule, { passive: true }); document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true; requestDraw.current = () => {}; cancelAnimationFrame(frame); resize.disconnect(); visibility.disconnect(); theme.disconnect();
      window.removeEventListener('scroll', schedule); document.removeEventListener('visibilitychange', onVisibility);
      if (graphics) { graphics.renderer.domElement.removeEventListener('webglcontextlost', onContextLost); graphics.textures.forEach(texture => texture.dispose()); graphics.geometry.dispose(); graphics.material.dispose(); graphics.renderer.dispose(); graphics.renderer.domElement.remove(); }
      sources.forEach(canvas => { canvas.width = canvas.height = 0; }); small.forEach(canvas => { canvas.width = canvas.height = 0; }); fallback.width = fallback.height = 1;
    };
  }, [imagesKey, staticLayout]);

  useEffect(() => { requestDraw.current(); }, [gridSize, numSlices, gridOpacity]);
  if (!items.length) return null;
  return <section ref={rootRef} id="collections" className={`split-canvas-story ${staticLayout ? 'sc-static' : ''} ${className}`} aria-label="สินค้า งานดิจิทัล และบริการ" style={{ '--sc-count': items.length, '--sc-max': `${Math.max(160, canvasSize)}px` } as CSSProperties}>
    <div className="sc-sticky" aria-hidden="true"><div key={staticLayout ? 'static' : 'animated'} ref={wrapRef} className="sc-canvas-wrap"><img ref={posterRef} className="sc-poster" src={items[0].image} alt="" loading="lazy"/><canvas ref={fallbackRef} className="sc-fallback"/></div></div>
    <div className="sc-chapters">{items.map((item, index) => <article key={`${item.image}-${index}`} ref={node => { sections.current[index] = node; }} className="sc-chapter" data-sc-key={index}>
      <div className="sc-title-group">{item.label ? <span className="sc-label">{item.label}</span> : null}<h2>{item.title}</h2></div>
      <img className="sc-static-image" src={item.image} alt={item.title} loading="lazy" width="900" height="670"/>
      <div className="sc-description">{item.description ? <p>{item.description}</p> : null}{item.category ? <button type="button" className="sc-action" data-category={item.category}>{item.actionLabel || 'ดูคอลเลกชัน'}<ArrowUpRight size={18}/></button> : null}</div>
    </article>)}</div>
  </section>;
}
