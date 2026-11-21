import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
export default function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return <div className="theme-switch" role="group" aria-label="ธีมเว็บไซต์">
    <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Sun size={15}/>สว่าง</button>
    <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Moon size={15}/>มืด</button>
  </div>;
}
