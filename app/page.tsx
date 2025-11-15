// 詳細: #6, #7, #13, #18, エラーUI実装
'use client';

import { useCallback, useMemo } from 'react';
import { Board } from '@/components/board/Board';
import { CapturedPieces } from '@/components/captured/CapturedPieces';
import { GameControl } from '@/components/control/GameControl';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PromotionDialog } from '@/components/game/PromotionDialog';
import { GameProvider, useGame } from '@/lib/context/GameContext';
import type { PieceType } from '@/types/shogi';

function GameContent() {
  const { gameState, newGame, resign, clearError, selectCapturedPiece, promote, notPromote } = useGame();

  // 詳細: #18 - パフォーマンス最適化: ハンドラをuseCallbackでメモ化
  // 先手の持ち駒クリック処理（手番チェック付き）
  const handleBlackCapturedPieceClick = useCallback((pieceType: PieceType) => {
    if (gameState.currentTurn !== 'black') return;
    selectCapturedPiece(pieceType);
  }, [gameState.currentTurn, selectCapturedPiece]);

  // 後手の持ち駒クリック処理（手番チェック付き）
  const handleWhiteCapturedPieceClick = useCallback((pieceType: PieceType) => {
    if (gameState.currentTurn !== 'white') return;
    selectCapturedPiece(pieceType);
  }, [gameState.currentTurn, selectCapturedPiece]);

  // 詳細: #18 - パフォーマンス最適化: selectedPieceの計算をuseMemoでメモ化
  const blackSelectedPiece = useMemo(() => {
    return gameState.currentTurn === 'black'
      ? gameState.selectedCapturedPiece ?? undefined
      : undefined;
  }, [gameState.currentTurn, gameState.selectedCapturedPiece]);

  const whiteSelectedPiece = useMemo(() => {
    return gameState.currentTurn === 'white'
      ? gameState.selectedCapturedPiece ?? undefined
      : undefined;
  }, [gameState.currentTurn, gameState.selectedCapturedPiece]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 py-3 sm:py-4 md:py-6 lg:py-8">
      {/* エラーメッセージ表示 */}
      <ErrorMessage message={gameState.errorMessage} onClose={clearError} />

      {/* 成り判定ダイアログ (#13) */}
      <PromotionDialog
        isOpen={gameState.promotionState.isOpen}
        pieceType={gameState.promotionState.piece?.type || null}
        player={gameState.promotionState.piece?.owner || null}
        onPromote={promote}
        onNotPromote={notPromote}
      />

      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        {/* ヘッダー - 詳細: #18 レスポンシブ対応 */}
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">
            将棋
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            ローカル対戦
          </p>
        </div>

        {/* ゲームコントロール - 詳細: #18 レスポンシブ対応 */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <GameControl
            gameStatus={gameState.gameStatus}
            currentTurn={gameState.currentTurn}
            onNewGame={newGame}
            onResign={resign}
          />
        </div>

        {/* メインゲーム画面 - 詳細: #18 レスポンシブ対応 */}
        <div className="flex flex-col lg:flex-row items-start justify-center gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {/* 後手の持ち駒 - 詳細: #18 メモ化されたpropsを使用 */}
          <div className="w-full lg:w-auto order-1 lg:order-1">
            <CapturedPieces
              player="white"
              pieces={gameState.captured.white}
              selectedPiece={whiteSelectedPiece}
              onPieceClick={handleWhiteCapturedPieceClick}
            />
          </div>

          {/* 盤面 */}
          <div className="order-2 lg:order-2">
            <Board />
          </div>

          {/* 先手の持ち駒 - 詳細: #18 メモ化されたpropsを使用 */}
          <div className="w-full lg:w-auto order-3 lg:order-3">
            <CapturedPieces
              player="black"
              pieces={gameState.captured.black}
              selectedPiece={blackSelectedPiece}
              onPieceClick={handleBlackCapturedPieceClick}
            />
          </div>
        </div>

        {/* フッター（情報表示） - 詳細: #18 レスポンシブ対応 */}
        <div className="mt-6 sm:mt-7 md:mt-8 text-center text-xs sm:text-sm text-gray-600">
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
