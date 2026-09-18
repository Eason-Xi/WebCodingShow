"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "ai-interview-theme";

/** 首屏防闪烁：在 body 最开始同步执行，避免浅色主题下先闪一下深色 */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"){document.documentElement.dataset.theme="light"}}catch(e){}`;

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "light" ? "light" : "dark");
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* 隐私模式下 localStorage 不可用，忽略即可 */
    }
  };

  const isDark = theme === "dark";
  const label = isDark ? "切换到浅色主题" : "切换到深色主题";

  return (
    <button
      onClick={toggle}
      title={label}
      aria-label={label}
      className="btn btn-ghost btn-sm h-9 w-9 p-0"
    >
      {mounted && !isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
