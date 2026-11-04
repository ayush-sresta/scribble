"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative flex h-7 w-[60px] items-center rounded-full bg-primary p-1 transition-colors cursor-pointer"
    >
      <span
        className={`absolute left-1 flex h-5 w-5 items-center justify-center rounded-full shadow-md transition-transform duration-300 ${
          isDark ? "translate-x-0" : "translate-x-8"
        }`}
      >
        <span className="text-xs">{isDark ? "🌙" : "☀️"}</span>
      </span>
    </button>
  );
}
