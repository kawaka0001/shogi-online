/**
 * オンラインゲーム用のアダプター
 * useOnlineGameフックをGameContextインターフェースに変換
 * これにより既存のBoardコンポーネント等を再利用可能にする
 * 詳細: #21
 */

'use client';

import { createContext, useContext, useCallback, useMemo, ReactNode, useState } from 'react';
import { useOnlineGame } from '@/lib/hooks/useOnlineGame';
import type { GameState, Position, PieceType } from '@/types/shogi';
import type { UseOnlineGameReturn } from '@/types/online-game';

// GameContextと同じインターフェース
type GameContextType = {
  gameState: GameState;
  selectSquare: (position: Position) => void;
  selectCapturedPiece: (pieceType: PieceType) => void;
  newGame: () => void;
  resign: () => void;
  clearError: () => void;
  promote: () => void;
  notPromote: () => void;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export function OnlineGameAdapter({
  gameId,
  children,
}: {
  gameId: string;
  children: ReactNode;
}) {
  const {
    gameState: onlineGameState,
    isLoading,
    error,
    submitMove,
    resign: onlineResign,
  } = useOnlineGame(gameId);

  // ローカルUI状態（選択中の位置、駒など）
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedCapturedPiece, setSelectedCapturedPiece] = useState<PieceType | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [promotionPending, setPromotionPending] = useState<{
    from: Position;
    to: Position;
  } | null>(null);

  // 依存値を事前に計算（フック内で使用）
  const myPlayer = onlineGameState?.myPlayer;
  const isMyTurn = onlineGameState ? onlineGameState.currentTurn === myPlayer : false;

  // GameContextインターフェースの実装（全てのフックを先に定義）

  const selectSquare = useCallback((position: Position) => {
    if (!isMyTurn || !onlineGameState) return;

    // TODO: 実装
    // 1. 持ち駒選択中の場合は駒を打つ
    // 2. 駒が選択されている場合は移動
    // 3. 自分の駒をクリックした場合は選択
    // 4. 合法手の計算

    console.log('selectSquare:', position, 'isMyTurn:', isMyTurn);

    // 仮実装: 選択状態をトグル
    const piece = onlineGameState.board[position.rank][position.file];
    if (piece && piece.owner === myPlayer) {
      setSelectedPosition(position);
      // TODO: 合法手を計算してsetValidMoves
    } else {
      setSelectedPosition(null);
      setValidMoves([]);
    }
  }, [isMyTurn, myPlayer, onlineGameState]);

  const selectCapturedPiece = useCallback((pieceType: PieceType) => {
    if (!isMyTurn) return;

    // TODO: 実装
    // 1. 持ち駒の数をチェック
    // 2. 打てる場所を計算してvalidMovesに設定

    console.log('selectCapturedPiece:', pieceType);
    setSelectedCapturedPiece(pieceType);
    setSelectedPosition(null);
  }, [isMyTurn]);

  const newGame = useCallback(() => {
    // オンラインゲームでは新規ゲーム開始は不可
    console.warn('オンラインゲームでは新規ゲーム開始はできません');
  }, []);

  const resign = useCallback(async () => {
    if (!isMyTurn) return;
    await onlineResign();
  }, [isMyTurn, onlineResign]);

  const clearError = useCallback(() => {
    // エラーは親コンポーネントで管理
  }, []);

  const promote = useCallback(async () => {
    if (!promotionPending) return;

    // TODO: 成りの手を送信
    console.log('promote:', promotionPending);
    setPromotionPending(null);
  }, [promotionPending]);

  const notPromote = useCallback(async () => {
    if (!promotionPending) return;

    // TODO: 成らない手を送信
    console.log('notPromote:', promotionPending);
    setPromotionPending(null);
  }, [promotionPending]);

  // GameStateにローカルUI状態をマージ
  const gameState: GameState = useMemo(() => {
    if (!onlineGameState) {
      // ダミーの初期状態を返す（実際には使用されない）
      return {
        board: [],
        captured: {
          black: { rook: 0, bishop: 0, gold: 0, silver: 0, knight: 0, lance: 0, pawn: 0 },
          white: { rook: 0, bishop: 0, gold: 0, silver: 0, knight: 0, lance: 0, pawn: 0 }
        },
        currentTurn: 'black',
        moveHistory: [],
        gameStatus: 'playing',
        isCheck: false,
        selectedPosition: null,
        validMoves: [],
        selectedCapturedPiece: null,
        lastMove: null,
        errorMessage: null,
        promotionState: {
          isOpen: false,
          from: null,
          to: null,
          piece: null,
        },
      } as GameState;
    }

    return {
      ...onlineGameState,
      selectedPosition,
      validMoves,
      selectedCapturedPiece,
      promotionState: promotionPending ? {
        isOpen: true,
        from: promotionPending.from,
        to: promotionPending.to,
        piece: onlineGameState.board[promotionPending.from.rank][promotionPending.from.file],
      } : {
        isOpen: false,
        from: null,
        to: null,
        piece: null,
      },
    };
  }, [onlineGameState, selectedPosition, validMoves, selectedCapturedPiece, promotionPending]);

  const value: GameContextType = useMemo(() => ({
    gameState,
    selectSquare,
    selectCapturedPiece,
    newGame,
    resign,
    clearError,
    promote,
    notPromote,
  }), [gameState, selectSquare, selectCapturedPiece, newGame, resign, clearError, promote, notPromote]);

  // ローディング中やエラー時はnullを返す（親コンポーネントでハンドリング）
  // 全てのフック呼び出しの後に配置
  if (isLoading || error || !onlineGameState) {
    return null;
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

// useGameと同じインターフェースのフック
export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within OnlineGameAdapter');
  }
  return context;
}
