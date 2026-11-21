export type MotionBus = { progress: number; paused: boolean; reduced: boolean; visible: boolean };
export const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
export const smooth = (p: number) => p * p * (3 - 2 * p);
export const out = (p: number) => 1 - (1 - p) ** 3;
export function graphemes(text: string) {
  return [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text)].map(s => s.segment);
}

// The tiny canvas is enlarged by the browser, retaining the soft bowl edge
// from the supplied scroll reference without a full-screen bitmap asset.
export function paintBowl(canvas: HTMLCanvasElement, progress: number, aspect: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width, h = canvas.height, pixels = ctx.createImageData(w, h);
  const q = progress * 1.85;
  const keys = [0, .18, .4, .66, .87, 1.15, 1.43, 1.8];
  const tips = [.24, .8, .95, 1.05, 1.05, 1.1, 1.3, 2.4];
  const halves = [.32, .38, .38, .46, .66, .9, 1.6, 3];
  const softs = [.22, .22, .19, .16, .13, .1, .1, .1];
  let k = 0;
  while (k < keys.length - 2 && q > keys[k + 1]) k++;
  const t = span(q, keys[k], keys[k + 1]);
  const tip = mix(tips[k], tips[k + 1], t), half = mix(halves[k], halves[k + 1], t), soft = mix(softs[k], softs[k + 1], t);
  const points = Array.from({length: 33}, (_, i) => {
    const y = mix(-.3, tip, i / 32);
    return {x: half * aspect * Math.max(0, 1 - y / tip) ** .72, y};
  });
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = Math.abs((x + .5) / w - .5) * aspect, py = (y + .5) / h;
    let d = Infinity;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1], vx = b.x - a.x, vy = b.y - a.y;
      const f = clamp(((px - a.x) * vx + (py - a.y) * vy) / (vx * vx + vy * vy));
      d = Math.min(d, Math.hypot(px - a.x - vx * f, py - a.y - vy * f));
    }
    if (py < tip && px < half * aspect * Math.max(0, 1 - py / tip) ** .72) d = -d;
    const fill = 1 - smooth(clamp((d - .22 + soft) / (2 * soft)));
    const fade = 1 - span(progress, .66, .84);
    const blend = fill < .38 ? smooth(fill / .38) : smooth((fill - .38) / .62);
    const from = fill < .38 ? [255,255,255] : [225,232,255];
    const to = fill < .38 ? [225,232,255] : [151,218,251];
    const offset = (y * w + x) * 4;
    for (let c = 0; c < 3; c++) pixels.data[offset + c] = mix(255, mix(from[c], to[c], blend), fade * .7);
    pixels.data[offset + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
}
