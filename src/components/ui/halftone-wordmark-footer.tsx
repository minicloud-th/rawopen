"use client"

// Halftone Wordmark Footer — a site footer whose wordmark is set enormous and
// cropped by the bottom edge, printed as a field of halftone dots. Each dot is
// sized by how much of the letter covers its cell, so the type keeps its edges
// at any scale. Move across it and the dots part around the pointer on springs,
// warming in colour as they are pushed off their place; click and a shock ring
// runs through the word. Above it sit the studio line, tracked link columns and
// a back-to-top, separated by a hairline, all over a fine print grain.
//
// Adapted for OpenCraft: the supplied logo is the mask, rather than a new
// typeface, and the links use the marketplace's existing actions.

import * as React from "react"
import { ArrowUp } from 'lucide-react'

export interface HalftonePalette {
  /** The footer background. */
  background: string
  /** The dots at rest, and the text. */
  ink: string
  /** The colour a dot warms toward as it is pushed off its place. */
  warm: string
}

export type HalftonePreset = "night" | "paper" | "ember" | "cobalt"

export interface FooterLink {
  label: string
  href?: string
  action?: string
  info?: string
  category?: string
}

export interface FooterColumn {
  title: string
  links: FooterLink[]
}

export interface HalftoneWordmarkFooterProps {
  /** The giant word printed in dots. Lowercase reads best. */
  wordmark?: string
  /** Optional local wordmark image and its crop in source pixels. */
  wordmarkImage?: string
  wordmarkCrop?: readonly [number, number, number, number]
  /** Optional second resting ink colour across the wordmark. */
  inkEnd?: string
  /** Top-left studio line. */
  label?: string
  /** The muted line under it. */
  meta?: string
  /** Link columns along the top. */
  columns?: FooterColumn[]
  /** Show the back-to-top link. It scrolls the window to 0. Defaults to true. */
  backToTop?: boolean
  /** Starting colours. Defaults to "night". */
  preset?: HalftonePreset
  /** Colour overrides, merged over the preset. */
  palette?: { background?: string; ink?: string; warm?: string }
  /** Distance between dot centres, in CSS px. Defaults to 6. */
  dotGap?: number
  /** How far the pointer pushes, in CSS px. Defaults to 80. */
  radius?: number
  /** How much of the word's cap height hangs below the bottom edge, 0–0.6. Defaults to 0.2. */
  crop?: number
  /** Print grain over everything, 0–1. Defaults to 0.5. */
  grain?: number
  /** Pointer and click response. Defaults to true. */
  interactive?: boolean
  /** Face for the wordmark. Heavy grotesks print best. */
  fontFamily?: string
  /** Weight of the wordmark. Defaults to 800. */
  fontWeight?: number
  /** Face for the small type. */
  monoFamily?: string
  /** Root height. A definite length, never a percentage. */
  height?: string
  /** Extra root class names. */
  className?: string
}

const PRESETS: { [K in HalftonePreset]: HalftonePalette } = {
  night: { background: "#0c0c0b", ink: "#e9e4da", warm: "#e9762b" },
  paper: { background: "#efebe3", ink: "#17150f", warm: "#c2361c" },
  ember: { background: "#160a06", ink: "#f2c48c", warm: "#ff5a1f" },
  cobalt: { background: "#0d1b4d", ink: "#dfe7ff", warm: "#ffcd3c" },
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  { title: "เลือกซื้อ", links: [{ label: "สินค้าและบริการ", href: "#discover" }, { label: "สินค้าดิจิทัล", category: "digital" }, { label: "รายการโปรด", action: "favorites" }] },
  { title: "ผู้ขาย", links: [{ label: "เปิดร้านกับเรา", action: "seller" }, { label: "คู่มือผู้ขาย", info: "seller-guide" }] },
  { title: "OpenCraft", links: [{ label: "เกี่ยวกับเรา", info: "about" }, { label: "ช่วยเหลือ", info: "faq" }, { label: "ข้อกำหนด", info: "terms" }, { label: "ความเป็นส่วนตัว", info: "privacy" }] },
]

const SANS_STACK = '"Inter Tight", "Inter Variable", "Inter", "Helvetica Neue", Arial, system-ui, sans-serif'
const MONO_STACK = '"Prompt", system-ui, sans-serif'

// #region halftone
// Pure helpers from the supplied halftone component.

/** Hex → [r, g, b] in 0–255, or null for anything that isn't #rgb / #rrggbb. */
export function hwfHex(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Dot radius for a cell coverage in [0, 1]: area-true, so tone stays even. */
export function hwfRadius(coverage: number, gap: number) {
  const c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage
  return Math.sqrt(c) * gap * 0.56
}

/**
 * One step of a dot's spring back to home, plus the push from a pointer at
 * (px, py) within radius r. Returns [x, y, vx, vy]. Away from the pointer a
 * displaced dot always heads home and comes to rest.
 */
export function hwfStep(
  x: number, y: number, vx: number, vy: number,
  hx: number, hy: number, px: number, py: number, r: number,
) {
  const dx = x - px
  const dy = y - py
  const d2 = dx * dx + dy * dy
  if (r > 0 && d2 < r * r) {
    const d = Math.sqrt(d2) + 0.001
    const f = (1 - d / r) * 2.6
    vx += (dx / d) * f
    vy += (dy / d) * f
  }
  vx = (vx + (hx - x) * 0.05) * 0.84
  vy = (vy + (hy - y) * 0.05) * 0.84
  return [x + vx, y + vy, vx, vy]
}

/** How warm a dot is drawn: 0 at home, 1 once it is `span` px or more away. */
export function hwfWarmth(x: number, y: number, hx: number, hy: number, span: number) {
  const d = Math.hypot(x - hx, y - hy)
  return span > 0 ? Math.min(1, d / span) : 0
}

/** Font size that sets `measured` (width at 100px) to fill `width` exactly. */
export function hwfFitSize(measured: number, width: number) {
  return measured > 0 ? (width / measured) * 100 : 0
}
// #endregion

const HWF_CSS = `
.hwf-root {
  position: relative; width: 100%; overflow: hidden; isolation: isolate;
  background: var(--hwf-bg); color: #233b61; -webkit-font-smoothing: antialiased;
}
.hwf-root canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; pointer-events: none; }
.hwf-top {
  position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1.8fr) repeat(3, minmax(0, 1fr));
  gap: 32px; max-width: 1256px; margin: auto; padding: 48px 28px 0;
  font-family: var(--hwf-mono); font-size: 14px; letter-spacing: 0; line-height: 1.8;
}
.hwf-brandmark { width: 168px; display: block; margin-bottom: 19px; }
.hwf-brandmark svg { width: 100%; display: block; height: auto; }
.hwf-brand strong { display: block; font-size: 14px; font-weight: 400; line-height: 1.8; }
.hwf-brand>span { display: block; margin-top: 12px; font-size: 12px; color: #5e718e; }
.hwf-col h3 { margin: 0 0 13px; font: inherit; color: #344c72; font-weight: 500; }
.hwf-col ul { list-style: none; margin: 0; padding: 0; }
.hwf-col a, .hwf-col button, .hwf-up {
  color: #5e718e; text-decoration: none; background: none; border: 0; padding: 0;
  font: inherit; letter-spacing: inherit; cursor: pointer;
  background-image: linear-gradient(currentColor, currentColor); background-size: 0% 1px;
  background-repeat: no-repeat; background-position: 0 100%; transition: opacity .25s ease, background-size .35s cubic-bezier(.2,.7,.1,1);
}
.hwf-col a,.hwf-col button { display: inline-flex; align-items: center; min-height: 34px; text-align: left; }
.hwf-col a:hover,.hwf-col button:hover,.hwf-up:hover { color: #2457ff; background-size: 100% 1px; }
.hwf-col a:focus-visible,.hwf-col button:focus-visible,.hwf-up:focus-visible,.hwf-brandmark:focus-visible { outline: 2px solid #2457ff; outline-offset: 5px; border-radius: 2px; }
.hwf-rule {
  position: relative; z-index: 1; display: flex; justify-content: flex-end; align-items: center; gap: 16px;
  max-width: 1200px; margin: 30px auto 0; padding-top: 16px;
  border-top: 1px solid #dce7f5;
  font-family: var(--hwf-mono); font-size: 13px; letter-spacing: 0;
}
.hwf-up { display: inline-flex; gap: 13px; align-items: center; min-height: 34px; }
.hwf-fallback { position: absolute; width: 102%; left: -1%; bottom: -1.5%; pointer-events: none; }
.hwf-fallback svg { display: block; width: 100%; height: auto; }
.hwf-root[data-painted=true] .hwf-fallback { visibility: hidden; }
.hwf-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 1256px) { .hwf-rule { margin-left: 28px; margin-right: 28px; } }
@media (max-width: 720px) {
  .hwf-top { grid-template-columns: repeat(3,minmax(0,1fr)); gap: 24px 16px; padding: 29px 24px 0; font-size: 12px; }
  .hwf-brand { grid-column: 1 / -1; }
  .hwf-brandmark { width: 150px; margin-bottom: 13px; }
  .hwf-brand strong { font-size: 13px; }
  .hwf-brand>span { margin-top: 7px; font-size: 11px; }
  .hwf-col h3 { font-size: 12px; margin-bottom: 8px; }
  .hwf-col a,.hwf-col button { min-height: 36px; }
  .hwf-rule { margin: 22px 24px 0; padding-top: 10px; font-size: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .hwf-col a,.hwf-col button,.hwf-up { transition: none; }
}
`

export default function HalftoneWordmarkFooter({
  wordmark = "opencraft",
  wordmarkImage,
  wordmarkCrop,
  inkEnd,
  label = "สินค้าและบริการ ในที่เดียว",
  meta = "© 2026 OpenCraft",
  columns = DEFAULT_COLUMNS,
  backToTop = true,
  preset = "night",
  palette,
  dotGap = 6,
  radius = 80,
  crop = 0.2,
  grain = 0.5,
  interactive = true,
  fontFamily = SANS_STACK,
  fontWeight = 800,
  monoFamily = MONO_STACK,
  height = "560px",
  className = "",
}: HalftoneWordmarkFooterProps) {
  const colors = { ...(PRESETS[preset] || PRESETS.night), ...(palette || {}) }
  const rootRef = React.useRef(null as HTMLElement | null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const opts = React.useRef({ colors, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, wordmark, wordmarkImage, wordmarkCrop, inkEnd })
  opts.current = { colors, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, wordmark, wordmarkImage, wordmarkCrop, inkEnd }
  const key = [wordmark, wordmarkImage, wordmarkCrop?.join(','), dotGap, crop, grain, fontFamily, fontWeight, colors.background, colors.ink, colors.warm, inkEnd].join("|")

  React.useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    let reduced = media.matches
    let w = 0
    let h = 0
    let dpr = 1
    let px = -1e5
    let py = -1e5
    let raf = 0
    let visible = false
    let awake = true
    let ring = { x: 0, y: 0, t: -1 }
    // Flat arrays: x, y, vx, vy, hx, hy, r per dot.
    let dots = new Float32Array(0)
    let count = 0
    let wordTop = 0
    let alive = true
    let homeColors: string[] = []
    let homeRgb = new Float32Array(0)
    let logo: HTMLImageElement | null = null
    let grainTile = null as HTMLCanvasElement | null
    const ink = hwfHex(opts.current.colors.ink) || [233, 228, 218]
    const warm = hwfHex(opts.current.colors.warm) || [233, 118, 43]
    const endInk = hwfHex(opts.current.inkEnd || '') || ink

    const layout = () => {
      const o = opts.current
      const rect = root.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)

      // Set the word once, at a size that fills the width, on a 1x mask.
      const mask = document.createElement("canvas")
      mask.width = w
      mask.height = h
      const m = mask.getContext("2d", { willReadFrequently: true })
      if (!m) return
      const c = Math.max(0, Math.min(0.6, o.crop))
      if (logo?.complete && logo.naturalWidth) {
        const [sx, sy, sw, sh] = o.wordmarkCrop || [0, 0, logo.naturalWidth, logo.naturalHeight]
        const dw = w * 1.02, dh = dw * sh / sw
        wordTop = h - dh * (1 - c)
        m.drawImage(logo, sx, sy, sw, sh, (w - dw) / 2, wordTop, dw, dh)
      } else {
        m.font = o.fontWeight + " 100px " + o.fontFamily
        const word = o.wordmark || " "
        const fit = hwfFitSize(m.measureText(word).width, w * 1.02)
        m.font = o.fontWeight + " " + fit + "px " + o.fontFamily
        const box = m.measureText(word)
        const cap = box.actualBoundingBoxAscent || fit * 0.72
        wordTop = h - cap * (1 - c)
        m.fillStyle = "#000"
        m.textBaseline = "alphabetic"
        m.fillText(word, (w - box.width) / 2, h + cap * c)
      }
      const img = m.getImageData(0, 0, w, h).data

      const gap = Math.max(3, o.dotGap)
      const cols = Math.ceil(w / gap)
      const rows = Math.ceil(h / gap)
      const tmp = []
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          // Coverage: average alpha over a 3×3 sample of the cell.
          let sum = 0
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3))
              const y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3))
              sum += img[(y * w + x) * 4 + 3]
            }
          }
          const cov = sum / (9 * 255)
          if (cov < 0.06) continue
          const hx = gx * gap + gap / 2
          const hy = gy * gap + gap / 2
          tmp.push(hx, hy, 0, 0, hx, hy, hwfRadius(cov, gap))
        }
      }
      dots = new Float32Array(tmp)
      count = tmp.length / 7
      homeRgb = new Float32Array(count * 3)
      homeColors = Array.from({ length: count }, (_, i) => {
        const t = Math.min(1, dots[i * 7 + 4] / w)
        const rgb = ink.map((channel, j) => Math.round(channel + (endInk[j] - channel) * t))
        homeRgb.set(rgb, i * 3)
        return `rgb(${rgb.join(',')})`
      })

      // A fixed tile of print grain, drawn once and laid over every frame.
      grainTile = document.createElement("canvas")
      grainTile.width = 256
      grainTile.height = 256
      const g = grainTile.getContext("2d")
      if (g) {
        const id = g.createImageData(256, 256)
        for (let i = 0; i < id.data.length; i += 4) {
          const v = Math.random() * 255
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v
          id.data[i + 3] = Math.random() < 0.5 ? 0 : 255
        }
        g.putImageData(id, 0, 0)
      }
      awake = true
      root.dataset.dots = String(count)
    }

    const draw = (now: number) => {
      const o = opts.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = o.colors.background
      ctx.fillRect(0, 0, w, h)

      const r = o.interactive && !reduced ? Math.max(0, o.radius) : 0
      const ringAge = ring.t < 0 ? 1e9 : now - ring.t
      const ringR = ringAge * 0.9
      let moving = false
      for (let i = 0; i < count; i++) {
        const j = i * 7
        let x = dots[j]
        let y = dots[j + 1]
        let vx = dots[j + 2]
        let vy = dots[j + 3]
        const hx = dots[j + 4]
        const hy = dots[j + 5]
        if (!reduced) {
          if (ringAge < 900) {
            const dx = hx - ring.x
            const dy = hy - ring.y
            const d = Math.sqrt(dx * dx + dy * dy) + 0.001
            const band = 1 - Math.min(1, Math.abs(d - ringR) / 26)
            if (band > 0) {
              const f = band * 3.2 * (1 - ringAge / 900)
              vx += (dx / d) * f
              vy += (dy / d) * f
            }
          }
          const s = hwfStep(x, y, vx, vy, hx, hy, px, py, r)
          x = s[0]
          y = s[1]
          vx = s[2]
          vy = s[3]
          if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) moving = true
          else {
            x = hx
            y = hy
            vx = 0
            vy = 0
          }
          dots[j] = x
          dots[j + 1] = y
          dots[j + 2] = vx
          dots[j + 3] = vy
        }
        const k = hwfWarmth(x, y, hx, hy, 28)
        ctx.fillStyle =
          k > 0.02
            ? "rgb(" +
              Math.round(homeRgb[i * 3] + (warm[0] - homeRgb[i * 3]) * k) + "," +
              Math.round(homeRgb[i * 3 + 1] + (warm[1] - homeRgb[i * 3 + 1]) * k) + "," +
              Math.round(homeRgb[i * 3 + 2] + (warm[2] - homeRgb[i * 3 + 2]) * k) + ")"
            : homeColors[i]
        ctx.beginPath()
        ctx.arc(x, y, dots[j + 6], 0, 6.2832)
        ctx.fill()
      }

      if (grainTile && o.grain > 0) {
        ctx.globalAlpha = Math.min(1, o.grain) * 0.09
        ctx.globalCompositeOperation = "overlay"
        const pattern = ctx.createPattern(grainTile, "repeat")
        if (pattern) {
          ctx.fillStyle = pattern
          ctx.fillRect(0, 0, w, h)
        }
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = "source-over"
      }
      // Sleep once everything is home and nothing is pushing.
      awake = moving || ringAge < 900 || px > -1e4
      root.dataset.painted = 'true'
    }

    const loop = (now: number) => {
      raf = 0
      if (!visible || document.hidden) return
      draw(now)
      if (awake) raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      awake = true
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop)
    }

    const toLocal = (e: PointerEv) => {
      const b = canvas.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top]
    }
    const onMove = (e: PointerEv) => {
      if (!opts.current.interactive || reduced || e.pointerType === 'touch') return
      const p = toLocal(e)
      if (p[1] < wordTop - 12) { onLeave(); return }
      px = p[0]
      py = p[1]
      wake()
    }
    const onLeave = () => {
      px = -1e5
      py = -1e5
      wake()
    }
    const onDown = (e: PointerEv) => {
      if (!opts.current.interactive || reduced) return
      if ((e.target as HTMLElement).closest("a,button")) return
      const p = toLocal(e)
      if (p[1] < wordTop - 12) return
      ring = { x: p[0], y: p[1], t: performance.now() }
      wake()
    }

    layout()
    draw(performance.now())
    wake()

    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", onLeave)
    root.addEventListener("pointerdown", onDown)
    const ro = new ResizeObserver(() => {
      layout()
      wake()
    })
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true
      if (visible) wake()
    })
    io.observe(root)
    const onReduced = () => {
      reduced = media.matches
      ring.t = -1
      px = py = -1e5
      layout()
      wake()
    }
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0 }
      else wake()
    }
    media.addEventListener('change', onReduced)
    document.addEventListener('visibilitychange', onVisibility)
    if (wordmarkImage) {
      logo = new Image()
      logo.onload = () => { if (alive) { layout(); wake() } }
      logo.src = wordmarkImage
    }
    // A web font that lands late re-sets the word in its real face.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!alive) return
        layout()
        wake()
      })
    }

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      media.removeEventListener('change', onReduced)
      document.removeEventListener('visibilitychange', onVisibility)
      if (logo) logo.onload = null
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("pointerdown", onDown)
    }
  }, [key])

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  return (
    <footer
      ref={rootRef}
      className={"hwf-root " + className}
      style={
        {
          height,
          "--hwf-bg": colors.background,
          "--hwf-ink": colors.ink,
          "--hwf-mono": monoFamily,
        } as React.CSSProperties
      }
    >
      <style>{HWF_CSS}</style>
      <canvas ref={canvasRef} aria-hidden="true" />
      {wordmarkImage ? <div className="hwf-fallback" aria-hidden="true"><svg viewBox={(wordmarkCrop || [0, 0, 2048, 682]).join(' ')}><image href={wordmarkImage} width="2048" height="682"/></svg></div> : null}
      <span className="hwf-sr">{wordmark}</span>
      <div className="hwf-top">
        <div className="hwf-brand">
          <a className="hwf-brandmark" href="#experience" aria-label="OpenCraft หน้าแรก"><svg viewBox="220 170 1645 330" role="img" aria-label="OpenCraft"><image href="/assets/opencraft-wordmark.png" width="2048" height="682"/></svg></a>
          <strong>{label}</strong>
          <span>{meta}</span>
        </div>
        {columns.map((col) => (
          <nav className="hwf-col" key={col.title} aria-label={col.title}>
            <h3>{col.title}</h3>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href ? <a href={l.href}>{l.label}</a> : <button type="button" data-action={l.action} data-info={l.info} data-category={l.category}>{l.label}</button>}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="hwf-rule">
        {backToTop ? (
          <button type="button" className="hwf-up" onClick={toTop}>
            กลับด้านบน <ArrowUp size={15}/>
          </button>
        ) : null}
      </div>
    </footer>
  )
}

type PointerEv = PointerEvent
