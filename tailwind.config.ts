import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // クラスベースのダークモード
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // モダンボードゲームUI カラーパレット
        shogi: {
          board: {
            light: '#e2e8f0', // slate-200
            dark: '#cbd5e1',  // slate-300
            bg: '#f1f5f9',    // slate-100
          },
          piece: {
            black: '#0f172a', // slate-900
            white: '#0f172a',
          },
          accent: {
            primary: '#3b82f6',   // blue-500
            success: '#10b981',   // emerald-500
            warning: '#f59e0b',   // amber-500
            danger: '#ef4444',    // red-500
            info: '#06b6d4',      // cyan-500
          },
          status: {
            selected: '#3b82f6',     // blue-500
            valid: '#10b981',        // emerald-500
            check: '#ef4444',        // red-500
            lastMove: '#f59e0b',     // amber-500
          },
        },
      },
      // カスタムアニメーション
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in-out',
        slideInDown: 'slideInDown 0.3s ease-out',
        scaleIn: 'scaleIn 0.3s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        pulseSubtle: 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shake: 'shake 0.3s ease-in-out',
        glow: 'glow 2s ease-in-out infinite',
      },
      transitionDuration: {
        '400': '400ms',
      },
      // カスタムボックスシャドウ
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.12)',
        'strong': '0 8px 24px rgba(0, 0, 0, 0.16)',
        'glow-blue': '0 0 16px rgba(59, 130, 246, 0.4)',
        'glow-green': '0 0 16px rgba(16, 185, 129, 0.4)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      // フォントファミリー
      fontFamily: {
        sans: ['var(--font-noto-sans-jp)', 'sans-serif'],
        serif: ['var(--font-noto-serif-jp)', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
