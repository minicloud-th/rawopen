import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export type ThemeMode = Theme | "system";

export const themeColors = [
  { color: "#4a8dff", label: "ฟ้า OpenCraft", ink: "#0b1b3b" },
  { color: "#2f6df0", label: "น้ำเงิน", ink: "#fff" },
  { color: "#1fa3e8", label: "ฟ้าสด", ink: "#0b1b3b" },
  { color: "#a855f7", label: "ม่วง", ink: "#120c24" },
  { color: "#ec4899", label: "ชมพู", ink: "#23081a" },
  { color: "#f59e0b", label: "ส้ม", ink: "#241705" },
  { color: "#84cc16", label: "เขียว", ink: "#142000" },
  { color: "#8b8b92", label: "เทา", ink: "#141416" },
] as const;

type Color = typeof themeColors[number]["color"];
type Appearance = { mode: ThemeMode; theme: Theme; accent: Color };
const themeKey = "opencraft-theme";
const accentKey = "opencraft-accent";
const darkMedia = typeof window === "undefined" ? null : window.matchMedia("(prefers-color-scheme: dark)");
const defaultAppearance: Appearance = { mode: "dark", theme: "dark", accent: themeColors[0].color };
const listeners = new Set<() => void>();

function readPreference(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function writePreference(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Apply in memory when storage is unavailable. */ }
}

function readMode(value: string | null): ThemeMode {
  return value === "light" || value === "system" ? value : "dark";
}

function readAccent(value: string | null): Color {
  return themeColors.find(item => item.color === value)?.color ?? defaultAppearance.accent;
}

let appearance = defaultAppearance;

function updateAppearance(mode: ThemeMode, accent: Color) {
  const theme = mode === "system" ? (darkMedia?.matches ? "dark" : "light") : mode;
  const { style, dataset, classList } = document.documentElement;
  const swatch = themeColors.find(item => item.color === accent) ?? themeColors[0];

  dataset.theme = theme;
  classList.toggle("dark", theme === "dark");
  style.setProperty("--oc-accent", swatch.color);
  style.setProperty("--oc-accent-ink", swatch.ink);
  style.setProperty("--oc-focus", swatch.color);

  if (appearance.mode === mode && appearance.theme === theme && appearance.accent === accent) return;
  appearance = { mode, theme, accent };
  listeners.forEach(listener => listener());
}

function syncSystemTheme() {
  if (appearance.mode === "system") updateAppearance(appearance.mode, appearance.accent);
}

function syncPreferences(event: StorageEvent) {
  if (event.key === themeKey || event.key === null) {
    updateAppearance(readMode(readPreference(themeKey)), appearance.accent);
  }
  if (event.key === accentKey || event.key === null) {
    updateAppearance(appearance.mode, readAccent(readPreference(accentKey)));
  }
}

if (typeof window !== "undefined") {
  updateAppearance(readMode(readPreference(themeKey)), readAccent(readPreference(accentKey)));
  darkMedia?.addEventListener("change", syncSystemTheme);
  window.addEventListener("storage", syncPreferences);
}
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    darkMedia?.removeEventListener("change", syncSystemTheme);
    window.removeEventListener("storage", syncPreferences);
  });
}

export function applyTheme(mode: ThemeMode) {
  writePreference(themeKey, mode);
  updateAppearance(mode, appearance.accent);
}

function applyAccent(accent: Color) {
  writePreference(accentKey, accent);
  updateAppearance(appearance.mode, accent);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => appearance, () => defaultAppearance);
  return { ...current, setTheme: applyTheme, setAccent: applyAccent };
}
