/**
 * オンライン対戦ゲーム画面
 * GameContextに依存しない完全独立実装
 * 詳細: オンライン対戦機能実装
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useOnlineGame } from '@/lib/hooks/useOnlineGame';
import { Piece as PieceComponent } from '@/components/piece/Piece';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PromotionDialog } from '@/components/game/PromotionDialog';
import { GameResult } from '@/components/game/GameResult';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { PieceType, Player, Position, Piece } from '@/types/shogi';
import type { ConnectionStatus } from '@/types/online-game';
import { getPieceName } from '@/lib/utils/piece';
import { BOARD_SIZE } from '@/lib/game/constants';
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

/**
 * オンライン専用マスコンポーネント（GameContext非依存）
 */
function OnlineSquare({
  position,
  piece,
  isSelected,
  isValidMove,
  isCheck,
  isLastMove,
  onClick,
}: {
  position: Position;
  piece: Piece | null;
  isSelected: boolean;
  isValidMove: boolean;
  isCheck: boolean;
  isLastMove: boolean;
  onClick: () => void;
}) {
  // 筋のラベル（9-1の右から左）
  const getFileLabel = (file: number): string => String(9 - file);

  // 段のラベル（一-九の上から下）
  const getRankLabel = (rank: number): string => {
    const labels = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return labels[rank];
  };

  // 座標表記（例: 7六）
  const coordinateLabel = `${getFileLabel(position.file)}${getRankLabel(position.rank)}`;

  // 背景色の決定
  let bgColorClass = 'bg-shogi-board-square hover:bg-shogi-board-square-hover';
  if (isCheck) {
    bgColorClass = 'bg-red-200 dark:bg-red-900 hover:bg-red-300 dark:hover:bg-red-800';
  } else if (isSelected) {
    bgColorClass = 'bg-shogi-accent-secondary hover:bg-shogi-accent-secondary/80';
  } else if (isValidMove) {
    bgColorClass = 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50';
  } else if (isLastMove) {
    bgColorClass = 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50';
  }

  return (
    <button
      onClick={onClick}
      className={`
        w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-13 lg:h-13 xl:w-14 xl:h-14
        border border-slate-400 dark:border-slate-600
        relative flex items-center justify-center
        transition-all duration-150 ease-out
        focus:outline-none focus:ring-2 focus:ring-shogi-accent-primary focus:ring-offset-1
        ${bgColorClass}
        ${isSelected ? 'ring-2 ring-shogi-accent-primary ring-offset-1' : ''}
      `}
      aria-label={`${coordinateLabel}のマス${piece ? `, ${getPieceName(piece)}` : ''}`}
    >
      {/* 駒を表示 */}
      {piece && <PieceComponent piece={piece} size="medium" />}

      {/* 移動可能マーカー */}
      {isValidMove && !piece && (
        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 dark:bg-green-400 opacity-70"></div>
      )}
    </button>
  );
}

/**
 * オンライン専用盤面コンポーネント（GameContext非依存）
 */
function OnlineBoard({
  board,
  selectedPosition,
  validMoves,
  isCheck,
  lastMove,
  currentTurn,
  onSquareClick,
}: {
  board: (Piece | null)[][];
  selectedPosition: Position | null;
  validMoves: Position[];
  isCheck: boolean;
  lastMove: { from: Position | null; to: Position } | null;
  currentTurn: Player;
  onSquareClick: (position: Position) => void;
}) {
  // 筋のラベル（9-1）
  const getFileLabel = (file: number): string => String(9 - file);

  // 段のラベル（一-九）
  const getRankLabel = (rank: number): string => {
    const labels = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return labels[rank];
  };

  // マスの状態判定関数をメモ化
  const isSquareSelected = useCallback((rank: number, file: number): boolean => {
    if (!selectedPosition) return false;
    return selectedPosition.rank === rank && selectedPosition.file === file;
  }, [selectedPosition]);

  const isSquareValidMove = useCallback((rank: number, file: number): boolean => {
    return validMoves.some((move) => move.rank === rank && move.file === file);
  }, [validMoves]);

  const isSquareCheck = useCallback((rank: number, file: number): boolean => {
    if (!isCheck) return false;
    const piece = board[rank][file];
    if (!piece || piece.type !== 'king') return false;
    return piece.owner === currentTurn;
  }, [isCheck, board, currentTurn]);

  const isSquareLastMove = useCallback((rank: number, file: number): boolean => {
    if (!lastMove) return false;
    return (
      (lastMove.from && lastMove.from.rank === rank && lastMove.from.file === file) ||
      (lastMove.to.rank === rank && lastMove.to.file === file)
    );
  }, [lastMove]);

  // positionオブジェクトをメモ化
  const boardPositions = useMemo(() => {
    const positions: Position[][] = [];
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
      positions[rank] = [];
      for (let file = 0; file < BOARD_SIZE; file++) {
        positions[rank][file] = { rank, file };
      }
    }
    return positions;
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
      {/* 筋のラベル（横軸: 9-1） */}
      <div className="flex">
        <div className="w-6 sm:w-7 md:w-8 lg:w-9" /> {/* 段ラベル用のスペース */}
        {Array.from({ length: BOARD_SIZE }).map((_, file) => (
          <div
            key={file}
            className="w-10 h-6 sm:w-11 sm:h-7 md:w-12 md:h-8 lg:w-13 lg:h-9 xl:w-14 xl:h-9 flex items-center justify-center text-xs sm:text-sm md:text-base font-semibold text-slate-600 dark:text-slate-400"
          >
            {getFileLabel(file)}
          </div>
        ))}
      </div>

      {/* 盤面本体 */}
      <div className="flex">
        {/* 段のラベル（縦軸: 一-九） */}
        <div className="flex flex-col">
          {Array.from({ length: BOARD_SIZE }).map((_, rank) => (
            <div
              key={rank}
              className="w-6 h-10 sm:w-7 sm:h-11 md:w-8 md:h-12 lg:w-9 lg:h-13 xl:w-9 xl:h-14 flex items-center justify-center text-xs sm:text-sm md:text-base font-semibold text-slate-600 dark:text-slate-400"
            >
              {getRankLabel(rank)}
            </div>
          ))}
        </div>

        {/* 9x9のマス */}
        <div className="inline-block rounded-md shadow-strong bg-shogi-board-bg border-2 border-slate-300 dark:border-slate-600 overflow-hidden">
          {board.map((row, rank) => (
            <div key={rank} className="flex">
              {row.map((piece, file) => {
                const position = boardPositions[rank][file];
                return (
                  <OnlineSquare
                    key={`${rank}-${file}`}
                    position={position}
                    piece={piece}
                    isSelected={isSquareSelected(rank, file)}
                    isValidMove={isSquareValidMove(rank, file)}
                    isCheck={isSquareCheck(rank, file)}
                    isLastMove={isSquareLastMove(rank, file)}
                    onClick={() => onSquareClick(position)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * オンライン専用持ち駒コンポーネント（GameContext非依存）
 */
function OnlineCapturedPieces({
  player,
  pieces,
  selectedPiece,
  onPieceClick,
}: {
  player: Player;
  pieces: Record<string, number>;
  selectedPiece?: PieceType;
  onPieceClick?: (pieceType: PieceType) => void;
}) {
  // 持ち駒の表示順序
  const pieceOrder: PieceType[] = ['rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'];

  // 持ち駒があるかチェック
  const hasPieces = pieceOrder.some((type) => pieces[type] > 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-medium p-3 sm:p-4 border border-slate-200 dark:border-slate-700 min-w-[280px] sm:min-w-[320px]">
      <h3 className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 mb-3 text-center">
        {player === 'black' ? '☗ 先手の持ち駒' : '☖ 後手の持ち駒'}
      </h3>

      {!hasPieces ? (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          持ち駒なし
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {pieceOrder.map((type) => {
            const count = pieces[type] || 0;
            if (count === 0) return null;

            const isSelected = selectedPiece === type;
            const piece: Piece = { type, owner: player, isPromoted: false };

            return (
              <button
                key={type}
                onClick={() => onPieceClick?.(type)}
                className={`
                  relative p-2 rounded-lg border-2 transition-all duration-150
                  ${isSelected
                    ? 'border-shogi-accent-primary bg-shogi-accent-secondary shadow-medium'
                    : 'border-slate-300 dark:border-slate-600 hover:border-shogi-accent-primary hover:bg-slate-50 dark:hover:bg-slate-700'
                  }
                  focus:outline-none focus:ring-2 focus:ring-shogi-accent-primary focus:ring-offset-2
                `}
                aria-label={`${getPieceName(piece)} x ${count}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <PieceComponent piece={piece} size="small" />
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    x {count}
                  </span>
                </div>
              </button>
            );
          })}
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

  // ローカルUI状態（盤面の選択など）
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [selectedCapturedPiece, setSelectedCapturedPiece] = useState<PieceType | null>(null);

  // マスクリック処理（TODO: ゲームロジックと連携）
  const handleSquareClick = useCallback((position: Position) => {
    if (!gameState) return;

    // 自分の手番でない場合は何もしない
    if (gameState.myPlayer !== gameState.currentTurn) {
      console.log('相手の手番です');
      return;
    }

    // TODO: 実際のゲームロジック実装
    console.log('Square clicked:', position);

    // 暫定的な選択処理
    if (selectedPosition) {
      // 選択解除
      setSelectedPosition(null);
      setValidMoves([]);
    } else {
      // 選択
      setSelectedPosition(position);
      // TODO: 実際の合法手計算
      setValidMoves([]);
    }
  }, [gameState, selectedPosition]);

  // 持ち駒クリック処理（TODO: ゲームロジックと連携）
  const handleCapturedPieceClick = useCallback((pieceType: PieceType) => {
    if (!gameState) return;

    // 自分の手番でない場合は何もしない
    if (gameState.myPlayer !== gameState.currentTurn) {
      console.log('相手の手番です');
      return;
    }

    // TODO: 実際のゲームロジック実装
    console.log('Captured piece clicked:', pieceType);

    if (selectedCapturedPiece === pieceType) {
      setSelectedCapturedPiece(null);
      setValidMoves([]);
    } else {
      setSelectedCapturedPiece(pieceType);
      setSelectedPosition(null);
      // TODO: 実際の打てる位置計算
      setValidMoves([]);
    }
  }, [gameState, selectedCapturedPiece]);

  // エラーメッセージのクリア
  const handleErrorClose = useCallback(() => {
    // TODO: エラークリア機能を追加
  }, []);

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

  // 新しいゲームボタンのハンドラ
  const handleNewGame = () => {
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
        {/* ヘッダー */}
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

        {/* メインゲーム画面 */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10">
          {/* 後手の持ち駒 */}
          <div className="w-full lg:w-auto order-1 lg:order-1">
            <OnlineCapturedPieces
              player="white"
              pieces={gameState.captured.white}
              selectedPiece={gameState.myPlayer === 'white' ? selectedCapturedPiece || undefined : undefined}
              onPieceClick={gameState.myPlayer === 'white' ? handleCapturedPieceClick : undefined}
            />
          </div>

          {/* 盤面 */}
          <div className="order-2 lg:order-2">
            <OnlineBoard
              board={gameState.board}
              selectedPosition={selectedPosition}
              validMoves={validMoves}
              isCheck={gameState.isCheck}
              lastMove={gameState.lastMove}
              currentTurn={gameState.currentTurn}
              onSquareClick={handleSquareClick}
            />
          </div>

          {/* 先手の持ち駒 */}
          <div className="w-full lg:w-auto order-3 lg:order-3">
            <OnlineCapturedPieces
              player="black"
              pieces={gameState.captured.black}
              selectedPiece={gameState.myPlayer === 'black' ? selectedCapturedPiece || undefined : undefined}
              onPieceClick={gameState.myPlayer === 'black' ? handleCapturedPieceClick : undefined}
            />
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

      {/* ゲーム結果モーダル */}
      <GameResult
        gameStatus={gameState.gameStatus}
        currentTurn={gameState.currentTurn}
        onNewGame={handleNewGame}
      />
    </main>
  );
}
