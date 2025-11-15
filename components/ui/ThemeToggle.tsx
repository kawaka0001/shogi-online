/**
 * テーマ切り替えボタンコンポーネント
 * next-themesを使用した2025年のベストプラクティス実装
 */

'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const isDark = theme === 'dark';
  const label = isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え';

  // SSRハイドレーション対策
  if (!mounted) {
    return <SkeletonButton />;
  }

  return (
    <button
      onClick={toggleTheme}
      className="group p-2 sm:p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-soft hover:shadow-medium transition-all duration-200 hover:scale-105 active:scale-95"
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 transition-transform duration-200 group-hover:rotate-12" />
      ) : (
        <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 transition-transform duration-200 group-hover:-rotate-12" />
      )}
    </button>
  );
}

// SSR中のスケルトン表示
function SkeletonButton() {
  return (
    <button
      className="p-2 sm:p-2.5 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 shadow-soft"
      aria-label="テーマ切り替え"
      disabled
    >
      <div className="w-5 h-5 sm:w-6 sm:h-6" />
    </button>
  );
}
