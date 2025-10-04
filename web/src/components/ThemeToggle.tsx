"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme !== 'light';

  return (
    <button
      aria-label="Toggle theme"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-[var(--muted)] text-[var(--foreground)] hover:opacity-90"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light' : 'Switch to dark'}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}


