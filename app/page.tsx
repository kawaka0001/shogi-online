// 詳細: #6, #7, #18, エラーUI実装
'use client';

import { Board } from '@/components/board/Board';
import { CapturedPieces } from '@/components/captured/CapturedPieces';
import { GameControl } from '@/components/control/GameControl';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { GameProvider, useGame } from '@/lib/context/GameContext';

function GameContent() {
  const { gameState, newGame, resign, clearError } = useGame();

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 py-4 sm:py-8">
      {/* エラーメッセージ表示 */}
      <ErrorMessage message={gameState.errorMessage} onClose={clearError} />

      <div className="container mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            将棋
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            ローカル対戦
          </p>
        </div>

        {/* ゲームコントロール */}
        <div className="mb-6 sm:mb-8">
          <GameControl
            gameStatus={gameState.gameStatus}
            currentTurn={gameState.currentTurn}
            onNewGame={newGame}
            onResign={resign}
          />
        </div>

        {/* メインゲーム画面 */}
        <div className="flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8">
          {/* 後手の持ち駒 */}
          <div className="w-full lg:w-auto order-1 lg:order-1">
            <CapturedPieces
              player="white"
              pieces={gameState.captured.white}
            />
          </div>

          {/* 盤面 */}
          <div className="order-2 lg:order-2">
            <Board />
          </div>

          {/* 先手の持ち駒 */}
          <div className="w-full lg:w-auto order-3 lg:order-3">
            <CapturedPieces
              player="black"
              pieces={gameState.captured.black}
            />
          </div>
        </div>

        {/* フッター（情報表示） */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>手数: {gameState.moveHistory.length}</p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
