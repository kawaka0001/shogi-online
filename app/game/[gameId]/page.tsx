/**
 * オンライン対戦ゲーム画面
 * 詳細: オンライン対戦機能実装
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useOnlineGame } from '@/lib/hooks/useOnlineGame';
import { Board } from '@/components/board/Board';
import { CapturedPieces } from '@/components/captured/CapturedPieces';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PromotionDialog } from '@/components/game/PromotionDialog';
import { GameResult } from '@/components/game/GameResult';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { PieceType, Player } from '@/types/shogi';
import type { ConnectionStatus } from '@/types/online-game';
import Link from 'next/link';

// 動的レンダリングを強制（静的生成を無効化）
export const dynamic = 'force-dynamic';

// ========================================
// サブコンポーネント
// ========================================

/**
 * ローディング画面
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-t-4 border-b-4 border-shogi-accent-primary mx-auto mb-4"></div>
        <p className="text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-300">
          ゲームを読み込んでいます...
        </p>
      </div>
    </div>
  );
}

/**
 * エラー画面
 */
function ErrorScreen({ error }: { error: string }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-strong p-6 sm:p-8 md:p-10 max-w-md w-full text-center border border-slate-200 dark:border-slate-700">
        <div className="text-5xl sm:text-6xl mb-4">😞</div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          エラーが発生しました
        </h2>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-6">
          {error}
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-shogi-accent-primary hover:bg-shogi-accent-primary/90 text-white font-bold
                     py-3 px-6 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong
                     focus:outline-none focus:ring-2 focus:ring-shogi-accent-primary focus:ring-offset-2"
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}

/**
 * ゲームが見つからない画面
 */
function NotFoundScreen() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-strong p-6 sm:p-8 md:p-10 max-w-md w-full text-center border border-slate-200 dark:border-slate-700">
        <div className="text-5xl sm:text-6xl mb-4">🔍</div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
          ゲームが見つかりません
        </h2>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-6">
          このゲームは存在しないか、すでに終了しています。
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-shogi-accent-primary hover:bg-shogi-accent-primary/90 text-white font-bold
                     py-3 px-6 rounded-xl transition-all duration-200 shadow-medium hover:shadow-strong
                     focus:outline-none focus:ring-2 focus:ring-shogi-accent-primary focus:ring-offset-2"
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}

/**
 * 接続状態インジケーター
 */
function ConnectionStatusIndicator({ status }: { status: ConnectionStatus }) {
  const statusConfig = {
    connecting: {
      label: '接続中...',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700 dark:text-yellow-300',
    },
    connected: {
      label: '接続済み',
      color: 'bg-green-500',
      textColor: 'text-green-700 dark:text-green-300',
    },
    reconnecting: {
      label: '再接続中...',
      color: 'bg-orange-500',
      textColor: 'text-orange-700 dark:text-orange-300',
    },
    disconnected: {
      label: '切断',
      color: 'bg-red-500',
      textColor: 'text-red-700 dark:text-red-300',
    },
    error: {
      label: 'エラー',
      color: 'bg-red-500',
      textColor: 'text-red-700 dark:text-red-300',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${config.color} ${status === 'connecting' || status === 'reconnecting' ? 'animate-pulse' : ''}`}></div>
      <span className={`text-sm font-medium ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
}

/**
 * 対戦相手情報
 */
function OpponentInfo({
  opponentName,
  myPlayer,
}: {
  opponentName: string;
  myPlayer: Player;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-medium p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
      <div className="text-center">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1">
          あなた: {myPlayer === 'black' ? '☗ 先手' : '☖ 後手'}
        </p>
        <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
          対戦相手: {opponentName}
        </p>
      </div>
    </div>
  );
}

/**
 * オンラインゲームコントロール
 */
function OnlineGameControl({
  gameStatus,
  currentTurn,
  myPlayer,
  onResign,
  onOfferDraw,
}: {
  gameStatus: string;
  currentTurn: Player;
  myPlayer: Player;
  onResign: () => void;
  onOfferDraw: () => void;
}) {
  const isMyTurn = currentTurn === myPlayer;
  const isGameActive = gameStatus === 'playing' || gameStatus === 'check';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-medium p-4 sm:p-5 border border-slate-200 dark:border-slate-700">
      {/* ゲーム状態表示 */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full">
          <span className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
            {isMyTurn ? '🟢 あなたの手番です' : '⏳ 相手の手番です'}
          </span>
        </div>
      </div>

      {/* コントロールボタン */}
      {isGameActive && (
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onOfferDraw}
            className="flex-1 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500
                       text-slate-800 dark:text-slate-100 font-semibold py-2 px-4 rounded-lg
                       transition-all duration-200 shadow-soft hover:shadow-medium
                       focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
                       text-sm sm:text-base"
          >
            引き分け提案
          </button>
          <button
            onClick={onResign}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold
                       py-2 px-4 rounded-lg transition-all duration-200
                       shadow-soft hover:shadow-medium
                       focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2
                       text-sm sm:text-base"
          >
            投了する
          </button>
        </div>
      )}
    </div>
  );
}

// ========================================
// メインコンポーネント
// ========================================

export default function OnlineGamePage() {
  const params = useParams();
  const gameId = params.gameId as string;

  const {
    gameState,
    isLoading,
    error,
    resign,
    offerDraw,
  } = useOnlineGame(gameId);

  // エラーメッセージのクリア用
  const handleErrorClose = useCallback(() => {
    // TODO: エラークリア機能を追加
  }, []);

  // 先手の持ち駒クリック処理（手番チェック付き）
  const handleBlackCapturedPieceClick = useCallback((pieceType: PieceType) => {
    if (!gameState) return;
    if (gameState.currentTurn !== 'black') return;
    if (gameState.myPlayer !== 'black') return;
    // TODO: 持ち駒選択処理を実装
  }, [gameState]);

  // 後手の持ち駒クリック処理（手番チェック付き）
  const handleWhiteCapturedPieceClick = useCallback((pieceType: PieceType) => {
    if (!gameState) return;
    if (gameState.currentTurn !== 'white') return;
    if (gameState.myPlayer !== 'white') return;
    // TODO: 持ち駒選択処理を実装
  }, [gameState]);

  // selectedPieceの計算をuseMemoでメモ化
  const blackSelectedPiece = useMemo(() => {
    if (!gameState) return undefined;
    return gameState.currentTurn === 'black' && gameState.myPlayer === 'black'
      ? gameState.selectedCapturedPiece ?? undefined
      : undefined;
  }, [gameState]);

  const whiteSelectedPiece = useMemo(() => {
    if (!gameState) return undefined;
    return gameState.currentTurn === 'white' && gameState.myPlayer === 'white'
      ? gameState.selectedCapturedPiece ?? undefined
      : undefined;
  }, [gameState]);

  // ローディング状態
  if (isLoading) {
    return <LoadingScreen />;
  }

  // エラー状態
  if (error) {
    return <ErrorScreen error={error.message} />;
  }

  // ゲームが見つからない
  if (!gameState) {
    return <NotFoundScreen />;
  }

  // 新しいゲームボタンのハンドラ（オンラインゲームでは使用しない）
  const handleNewGame = () => {
    // オンラインゲームでは新しいゲームを開始しない
    // マッチング画面に戻る
    window.location.href = '/matchmaking';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-3 sm:py-4 md:py-6 lg:py-8">
      {/* ヘッダーナビゲーション - 右上固定 */}
      <div className="fixed top-4 right-4 z-40 flex gap-2">
        <Link
          href="/"
          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          ローカルゲーム
        </Link>
        <ThemeToggle />
      </div>

      {/* エラーメッセージ表示 */}
      <ErrorMessage message={gameState.errorMessage} onClose={handleErrorClose} />

      {/* 成り判定ダイアログ */}
      <PromotionDialog
        isOpen={gameState.promotionState.isOpen}
        pieceType={gameState.promotionState.piece?.type || null}
        player={gameState.promotionState.piece?.owner || null}
        onPromote={() => {/* TODO: 成り処理を実装 */}}
        onNotPromote={() => {/* TODO: 成らない処理を実装 */}}
      />

      <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl">
        {/* ヘッダー - モダンデザイン */}
        <div className="text-center mb-5 sm:mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-2 sm:mb-3 tracking-tight">
            将棋
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 font-medium mb-2">
            オンライン対戦モード
          </p>
          {/* 接続状態 */}
          <div className="flex justify-center">
            <ConnectionStatusIndicator status={gameState.connectionStatus} />
          </div>
        </div>

        {/* 対戦相手情報 */}
        <div className="mb-5 sm:mb-6 md:mb-8 max-w-md mx-auto">
          <OpponentInfo
            opponentName={gameState.opponentName}
            myPlayer={gameState.myPlayer}
          />
        </div>

        {/* ゲームコントロール */}
        <div className="mb-5 sm:mb-6 md:mb-8 max-w-2xl mx-auto">
          <OnlineGameControl
            gameStatus={gameState.gameStatus}
            currentTurn={gameState.currentTurn}
            myPlayer={gameState.myPlayer}
            onResign={resign}
            onOfferDraw={offerDraw}
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

      {/* ゲーム結果モーダル */}
      <GameResult
        gameStatus={gameState.gameStatus}
        currentTurn={gameState.currentTurn}
        onNewGame={handleNewGame}
      />
    </main>
  );
}
