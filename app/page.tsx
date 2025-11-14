// 詳細: #6, #7
'use client';

import { Board } from '@/components/board/Board';
import { GameProvider } from '@/lib/context/GameContext';

export default function Home() {
  return (
    <GameProvider>
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
            将棋オンライン対戦
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-gray-600 dark:text-gray-400">
            駒の選択機能実装中（Issue #7）
          </p>
        </div>

        <Board />
      </main>
    </GameProvider>
  );
}
