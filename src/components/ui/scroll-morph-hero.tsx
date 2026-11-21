"use client";

import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { clamp, mix, out, span } from '@/lib/presentation';

type GalleryItem = { id: string; image: string; name: string; position?: string };
type Size = { width: number; height: number };
type Pose = { x: number; y: number; z: number; rotation: number; scale: number; opacity: number; blur: number };
type GalleryProps = {
  progress: MotionValue<number>;
  ready: boolean;
  paused: boolean;
  reduced: boolean;
  onReveal: (visible: boolean) => void;
};

// Jump from a compact stack into OpenCraft's ring, then morph into the existing
// arc on native page scroll. No wheel or touch events are intercepted.
const images: GalleryItem[] = [
  { id: 'headphones', image: 'headphones.jpg', name: 'หูฟังไร้สาย' },
  { id: 'uikit', image: 'ui-kit.svg', name: 'Canvas UI Kit' },
  { id: 'camera', image: 'camera.jpg', name: 'กล้องดิจิทัล' },
  { id: 'sneaker', image: 'sneaker.jpg', name: 'สนีกเกอร์' },
  { id: 'brand', image: 'brand-design.svg', name: 'ออกแบบแบรนด์' },
  { id: 'keyboard', image: 'keyboard.jpg', name: 'คีย์บอร์ด' },
  { id: 'website', image: 'web-design.svg', name: 'ออกแบบเว็บไซต์' },
  { id: 'bag', image: 'bag.jpg', name: 'กระเป๋า Everyday' },
  { id: 'social', image: 'social-kit.svg', name: 'Social Studio' },
  { id: 'controller', image: 'controller.jpg', name: 'จอยเกมไร้สาย' },
  { id: 'watch', image: 'watch.jpg', name: 'นาฬิกา Classic' },
  { id: 'workspace', image: 'desk.jpg', name: 'ออกแบบมุมทำงาน' },
  { id: 'sneaker', image: 'sneaker.jpg', name: 'สนีกเกอร์', position: '30% 50%' },
  { id: 'website', image: 'web-design.svg', name: 'ออกแบบเว็บไซต์' },
  { id: 'headphones', image: 'headphones.jpg', name: 'หูฟังไร้สาย', position: '35% 50%' },
  { id: 'brand', image: 'brand-design.svg', name: 'ออกแบบแบรนด์' },
  { id: 'camera', image: 'camera.jpg', name: 'กล้องดิจิทัล', position: '65% 50%' },
  { id: 'social', image: 'social-kit.svg', name: 'Social Studio' },
  { id: 'controller', image: 'controller.jpg', name: 'จอยเกมไร้สาย' },
  { id: 'bag', image: 'bag.jpg', name: 'กระเป๋า Everyday' },
];

function poseFor(index: number, total: number, size: Size, intro: number, scroll: number, parallax: number): Pose {
  const { width: w, height: h } = size;
  const mobile = w < 760;
  const theta = index / total * Math.PI * 2 - Math.PI / 2;
  const circle = {
    x: Math.cos(theta) * Math.min(w * (mobile ? .51 : .405), 550),
    y: Math.sin(theta) * Math.min(h * (mobile ? .37 : .35), mobile ? 350 : 315) + h * .02,
    rotation: theta * 180 / Math.PI + 90,
  };
  const morph = out(span(scroll, 0, .16));
  const sweep = span(scroll, .16, .27) * .22;
  const spread = mobile ? 1.0 : .98;
  const angle = (index / (total - 1) - .5 - sweep) * spread;
  const radius = w * (mobile ? 1.08 : 1.07);
  const arc = {
    x: Math.sin(angle) * radius + parallax * morph,
    y: h * (mobile ? .245 : .235) + radius * (1 - Math.cos(angle)),
    rotation: angle * 180 / Math.PI,
  };
  // A small central stack fans out from depth. The last part settles its
  // overshoot, so this reads as one arrival rather than a looping carousel.
  const seed = Math.sin((index + 1) * 74.31);
  const flight = clamp(intro / 2);
  const ring = out(span(flight, .05, .82));
  const lift = Math.sin(span(flight, .55, 1) * Math.PI) * (mobile ? 8 : 13);
  const arriveScale = flight < .8 ? mix(.18, 1.1, out(span(flight, .05, .8))) : mix(1.1, 1, span(flight, .8, 1));
  const destinationX = mix(circle.x, arc.x, morph);
  const destinationY = mix(circle.y, arc.y, morph);
  const destinationRotation = mix(circle.rotation, arc.rotation, morph);
  return {
    x: mix(seed * 38, destinationX, ring),
    y: mix(60 + Math.cos(index * 2.4) * 18, destinationY, ring) - lift,
    z: mix(-680 - index % 3 * 70, 0, out(span(flight, .04, .82))),
    rotation: mix(seed * 28, destinationRotation, ring),
    scale: arriveScale * mix(1, mobile ? 1.12 : 1.18, morph),
    opacity: span(flight, .02, .19) * (1 - span(scroll, .265, .345)),
    blur: (1 - span(flight, .12, .8)) * 11,
  };
}

function FlipCard({ item, index, total, size, intro, progress, mouseX, reduced }: {
  item: GalleryItem; index: number; total: number; size: Size;
  intro: MotionValue<number>; progress: MotionValue<number>;
  mouseX: MotionValue<number>; reduced: boolean;
}) {
  const pose = useTransform(() => poseFor(index, total, size, reduced ? 2 : intro.get(), reduced ? 0 : progress.get(), reduced ? 0 : mouseX.get()));
  const x = useTransform(pose, p => p.x);
  const y = useTransform(pose, p => p.y);
  const z = useTransform(pose, p => p.z);
  const rotation = useTransform(pose, p => p.rotation);
  const scale = useTransform(pose, p => p.scale);
  const opacity = useTransform(pose, p => p.opacity);
  const filter = useTransform(pose, p => `blur(${p.blur}px)`);
  const spring = { stiffness: 115, damping: 19, mass: .75 };
  const smoothX = useSpring(x, spring);
  const smoothY = useSpring(y, spring);
  const smoothRotation = useSpring(rotation, spring);
  return <motion.button
    type="button"
    className="scroll-morph-card"
    data-product={item.id}
    aria-label={`ดู${item.name}`}
    style={{ x: reduced ? x : smoothX, y: reduced ? y : smoothY, z, rotate: reduced ? rotation : smoothRotation, scale, opacity, filter }}
  >
    <span className="morph-flip">
      <span className="morph-card-front"><img src={'/assets/' + item.image} alt="" width="120" height="164" style={{ objectPosition: item.position }} draggable={false}/></span>
      <span className="morph-card-back" aria-hidden="true"><ArrowUpRight size={24}/></span>
    </span>
  </motion.button>;
}

export default function ScrollMorphHero({ progress, ready, paused, reduced, onReveal }: GalleryProps) {
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const intro = useMotionValue(reduced ? 2 : 0);
  const pointer = useMotionValue(0);
  const mouseX = useSpring(pointer, { stiffness: 35, damping: 20 });
  const playback = useRef<ReturnType<typeof animate<number>> | null>(null);
  const items = size.width < 760 ? images.slice(0, 12) : images;

  useEffect(() => {
    const node = root.current!;
    const measure = () => setSize({ width: node.clientWidth, height: node.clientHeight });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || progress.get() > .015) { intro.set(2); onReveal(true); return; }
    onReveal(false);
    if (!ready) { intro.set(0); return; }
    let revealed = false;
    const reveal = () => { if (!revealed) { revealed = true; onReveal(true); } };
    const animation = animate(intro, [0, 1.55, 2], {
      duration: 1.45, times: [0, .78, 1], ease: [.2, .8, .2, 1],
      onUpdate: value => { if (value > 1.15) reveal(); },
    });
    playback.current = animation;
    // Scrolling during the intro moves straight into the gallery, so the page
    // never traps a fast scroller behind a timer.
    const unsubscribe = progress.on('change', value => {
      if (value > .015) { animation.stop(); intro.set(2); reveal(); }
    });
    return () => { animation.stop(); playback.current = null; unsubscribe(); };
  }, [ready, reduced, progress, intro, onReveal]);

  useEffect(() => {
    if (paused) { playback.current?.pause(); pointer.set(0); }
    else playback.current?.play();
  }, [paused, pointer, ready]);

  useEffect(() => {
    const node = root.current!;
    return progress.on('change', value => { node.inert = value > .31; });
  }, [progress]);

  return <div ref={root} className="scroll-morph-gallery" aria-label="สำรวจสินค้าและงานสร้างสรรค์"
    onPointerMove={event => {
      if (paused || reduced || event.pointerType !== 'mouse') return;
      const rect = event.currentTarget.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width - .5) * 35);
    }}
    onPointerLeave={() => pointer.set(0)}
  >{size.width > 0 && items.map((item, index) => <FlipCard key={index} item={item} index={index} total={items.length} size={size} intro={intro} progress={progress} mouseX={mouseX} reduced={reduced}/>)}</div>;
}
