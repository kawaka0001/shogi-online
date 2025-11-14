// 詳細: #6
'use client';

import { Board } from '@/components/board/Board';
import { createInitialBoard } from '@/lib/game/initial-state';

export default function Home() {
  const board = createInitialBoard();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
          将棋オンライン対戦
        </h1>
        <p className="text-sm sm:text-base md:text-xl text-gray-600 dark:text-gray-400">
          盤面表示実装完了（Issue #6）
        </p>
      </div>

      <Board board={board} />
    </main>
  );
}
