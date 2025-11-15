// 詳細: #6, #7, #13, #18, #19, エラーUI実装
'use client';

import { useCallback, useMemo } from 'react';
import { Board } from '@/components/board/Board';
import { CapturedPieces } from '@/components/captured/CapturedPieces';
import { GameControl } from '@/components/control/GameControl';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PromotionDialog } from '@/components/game/PromotionDialog';
import { GameProvider, useGame } from '@/lib/context/GameContext';
import { useAuth } from '@/lib/context/AuthContext';
import type { PieceType } from '@/types/shogi';
import Link from 'next/link';

// 動的レンダリングを強制（静的生成を無効化）
export const dynamic = 'force-dynamic';

function GameContent() {
  const { gameState, newGame, resign, clearError, selectCapturedPiece, promote, notPromote } = useGame();
  const { user } = useAuth();

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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-3 sm:py-4 md:py-6 lg:py-8">
      {/* ヘッダーナビゲーション - 右上固定 */}
      <div className="fixed top-4 right-4 z-40 flex gap-2">
        {user ? (
          <Link
            href="/profile"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            プロフィール
          </Link>
        ) : (
          <Link
            href="/auth/signin"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            ログイン
          </Link>
        )}
        <ThemeToggle />
      </div>

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

      <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl">
        {/* ヘッダー - モダンデザイン */}
        <div className="text-center mb-5 sm:mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-2 sm:mb-3 tracking-tight">
            将棋
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium">
            ローカル対戦モード
          </p>
        </div>

        {/* ゲームコントロール - モダンデザイン */}
        <div className="mb-5 sm:mb-6 md:mb-8">
          <GameControl
            gameStatus={gameState.gameStatus}
            currentTurn={gameState.currentTurn}
            onNewGame={newGame}
            onResign={resign}
          />
        </div>

        {/* メインゲーム画面 - モダンデザイン */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10">
          {/* 後手の持ち駒 */}
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

          {/* 先手の持ち駒 */}
          <div className="w-full lg:w-auto order-3 lg:order-3">
            <CapturedPieces
              player="black"
              pieces={gameState.captured.black}
              selectedPiece={blackSelectedPiece}
              onPieceClick={handleBlackCapturedPieceClick}
            />
          </div>
        </div>

        {/* フッター（情報表示） - モダンデザイン */}
        <div className="mt-6 sm:mt-7 md:mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft">
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              手数
            </span>
            <span className="text-sm sm:text-base font-bold text-shogi-accent-primary">
              {gameState.moveHistory.length}
            </span>
          </div>
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
