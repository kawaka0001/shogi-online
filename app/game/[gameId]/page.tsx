/**
 * オンラインゲーム画面（アダプターパターン使用）
 * 詳細: #21
 */

'use client';

import { useCallback, useMemo } from 'react';
import { Board } from '@/components/board/Board';
import { CapturedPieces } from '@/components/captured/CapturedPieces';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PromotionDialog } from '@/components/game/PromotionDialog';
import { GameResult } from '@/components/game/GameResult';
import { DrawOfferDialog } from '@/components/game/DrawOfferDialog';
import { OnlineGameAdapter } from '@/lib/adapters/OnlineGameAdapter';
import { useGame } from '@/lib/context/GameContext'; // 元のGameContextからインポート
import { useOnlineGame } from '@/lib/hooks/useOnlineGame'; // ページレベルでのみ使用
import type { PieceType } from '@/types/shogi';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

/**
 * 接続状態インジケーター
 */
function ConnectionStatusIndicator({ status }: { status: string }) {
  const statusConfig = {
    connecting: { label: '接続中...', color: 'bg-yellow-500', pulse: true },
    connected: { label: '接続済み', color: 'bg-green-500', pulse: false },
    reconnecting: { label: '再接続中...', color: 'bg-orange-500', pulse: true },
    disconnected: { label: '切断', color: 'bg-red-500', pulse: false },
    error: { label: 'エラー', color: 'bg-red-600', pulse: true },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected;

  return (
    <div className="fixed top-4 left-4 z-40 flex items-center gap-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-medium">
      <div className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
        {config.label}
      </span>
    </div>
  );
}

/**
 * ローディング画面
 */
function LoadingScreen() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-shogi-accent-primary mb-4" />
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">
          ゲームを読み込んでいます...
        </p>
      </div>
    </main>
  );
}

/**
 * エラー画面
 */
function ErrorScreen({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-strong p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          エラーが発生しました
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {message}
        </p>
        <Link
          href="/matchmaking"
          className="inline-block px-6 py-3 bg-shogi-accent-primary hover:bg-shogi-accent-primary/90 text-white rounded-lg transition-colors font-medium"
        >
          マッチング画面に戻る
        </Link>
      </div>
    </main>
  );
}

/**
 * オンラインゲームコンテンツ（アダプター内で使用）
 */
function OnlineGameContent({ gameId }: { gameId: string }) {
  // アダプターが提供するGameContext経由でゲーム状態を取得
  const { gameState, resign, clearError, selectCapturedPiece, promote, notPromote, onlineInfo, acceptDraw, declineDraw, offerDraw } = useGame();

  // オンラインゲーム情報を直接取得（drawOfferFrom等のため）
  const { gameState: onlineGameState } = useOnlineGame(gameId);

  // 持ち駒クリック処理（手番チェック付き）
  const handleBlackCapturedPieceClick = useCallback((pieceType: PieceType) => {
    if (!onlineInfo || onlineInfo.myPlayer !== 'black') return;
    if (gameState.currentTurn !== 'black') return;
    selectCapturedPiece(pieceType);
  }, [gameState.currentTurn, selectCapturedPiece, onlineInfo]);

  const handleWhiteCapturedPieceClick = useCallback((pieceType: PieceType) => {
    if (!onlineInfo || onlineInfo.myPlayer !== 'white') return;
    if (gameState.currentTurn !== 'white') return;
    selectCapturedPiece(pieceType);
  }, [gameState.currentTurn, selectCapturedPiece, onlineInfo]);

  // 選択中の持ち駒（自分の手番のみ）
  const blackSelectedPiece = useMemo(() => {
    if (!onlineInfo || onlineInfo.myPlayer !== 'black') return undefined;
    return gameState.currentTurn === 'black'
      ? gameState.selectedCapturedPiece ?? undefined
      : undefined;
  }, [gameState.currentTurn, gameState.selectedCapturedPiece, onlineInfo]);

  const whiteSelectedPiece = useMemo(() => {
    if (!onlineInfo || onlineInfo.myPlayer !== 'white') return undefined;
    return gameState.currentTurn === 'white'
      ? gameState.selectedCapturedPiece ?? undefined
      : undefined;
  }, [gameState.currentTurn, gameState.selectedCapturedPiece, onlineInfo]);

  // 投了ハンドラ（確認付き）
  const handleResign = useCallback(() => {
    if (!onlineInfo) return;
    const confirmMessage = onlineInfo.myPlayer === 'black'
      ? '先手として投了しますか？'
      : '後手として投了しますか？';

    if (window.confirm(confirmMessage)) {
      resign();
    }
  }, [resign, onlineInfo]);

  // 手番表示
  const getTurnMessage = () => {
    if (!onlineInfo) return '';
    const isMyTurn = gameState.currentTurn === onlineInfo.myPlayer;
    const turnPlayerName = gameState.currentTurn === 'black' ? '先手' : '後手';
    return isMyTurn ? `あなたの手番（${turnPlayerName}）` : `相手の手番（${turnPlayerName}）`;
  };

  // 後手プレイヤーの場合は盤面を180度回転 (#61)
  const isRotated = onlineInfo?.myPlayer === 'white';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-3 sm:py-4 md:py-6 lg:py-8">
      {/* 接続状態インジケーター */}
      {onlineInfo && (
        <ConnectionStatusIndicator status={onlineInfo.connectionStatus} />
      )}

      {/* ヘッダーナビゲーション - 右上固定 */}
      <div className="fixed top-4 right-4 z-40 flex gap-2">
        <Link
          href="/matchmaking"
          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          マッチング画面
        </Link>
        <Link
          href="/profile"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          プロフィール
        </Link>
        <ThemeToggle />
      </div>

      {/* エラーメッセージ表示 */}
      <ErrorMessage message={gameState.errorMessage} onClose={clearError} />

      {/* 成り判定ダイアログ */}
      <PromotionDialog
        isOpen={gameState.promotionState.isOpen}
        pieceType={gameState.promotionState.piece?.type || null}
        player={gameState.promotionState.piece?.owner || null}
        onPromote={promote}
        onNotPromote={notPromote}
      />

      {/* 引き分け提案ダイアログ（#58） */}
      {onlineGameState?.drawOfferFrom && acceptDraw && declineDraw && (
        <DrawOfferDialog
          isOpen={true}
          offerFrom={onlineGameState.drawOfferFrom}
          onAccept={acceptDraw}
          onDecline={declineDraw}
        />
      )}

      <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl">
        {/* ヘッダー */}
        <div className="text-center mb-5 sm:mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-2 sm:mb-3 tracking-tight">
            オンライン対戦
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium">
            {onlineInfo && `あなた: ${onlineInfo.myPlayer === 'black' ? '先手' : '後手'}`}
          </p>
        </div>

        {/* 手番表示とコントロール */}
        <div className="mb-5 sm:mb-6 md:mb-8 flex flex-col items-center gap-3">
          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-6 py-3 rounded-full shadow-soft">
            <span className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">
              {getTurnMessage()}
            </span>
          </div>

          {/* コントロールボタン */}
          {onlineInfo && gameState.gameStatus === 'playing' && (
            <div className="flex gap-3">
              <button
                onClick={handleResign}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium shadow-soft hover:shadow-medium"
              >
                投了する
              </button>
              {offerDraw && (
                <button
                  onClick={offerDraw}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-soft hover:shadow-medium"
                >
                  引き分け提案
                </button>
              )}
            </div>
          )}
        </div>

        {/* メインゲーム画面 */}
        {/* 後手視点の場合は全体を180度回転 (#61) */}
        <div className={isRotated ? 'rotate-180' : ''}>
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10">
            {/* 後手の持ち駒 */}
            <div className="w-full lg:w-auto order-1 lg:order-1">
              <CapturedPieces
                player="white"
                pieces={gameState.captured.white}
                selectedPiece={whiteSelectedPiece}
                onPieceClick={handleWhiteCapturedPieceClick}
                isRotated={isRotated}
              />
            </div>

            {/* 盤面（内部で二重回転処理） */}
            <div className="order-2 lg:order-2">
              <Board isRotated={isRotated} />
            </div>

            {/* 先手の持ち駒 */}
            <div className="w-full lg:w-auto order-3 lg:order-3">
              <CapturedPieces
                player="black"
                pieces={gameState.captured.black}
                selectedPiece={blackSelectedPiece}
                onPieceClick={handleBlackCapturedPieceClick}
                isRotated={isRotated}
              />
            </div>
          </div>
        </div>

        {/* フッター（情報表示） */}
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

      {/* ゲーム結果モーダル（投了・詰み時に表示） */}
      {/* オンラインゲームでは新規ゲーム開始ではなくマッチング画面に戻る */}
      <GameResult
        gameStatus={gameState.gameStatus}
        currentTurn={gameState.currentTurn}
        onNewGame={() => window.location.href = '/matchmaking'}
      />
    </main>
  );
}

/**
 * オンラインゲームページ
 */
export default function OnlineGamePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  // オンラインゲーム情報の取得（アダプター外で使用）
  const { isLoading, error } = useOnlineGame(gameId);

  // ローディング中
  if (isLoading) {
    return <LoadingScreen />;
  }

  // エラー発生時
  if (error) {
    return <ErrorScreen message={error.message} />;
  }

  // アダプターでGameContextを提供し、既存コンポーネントを再利用
  return (
    <OnlineGameAdapter gameId={gameId}>
      <OnlineGameContent gameId={gameId} />
    </OnlineGameAdapter>
  );
}
