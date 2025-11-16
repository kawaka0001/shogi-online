/**
 * オンラインゲーム用のアダプター
 * useOnlineGameフックをGameContextインターフェースに変換
 * これにより既存のBoardコンポーネント等を再利用可能にする
 * 詳細: #21
 */

'use client';

import { useCallback, useMemo, ReactNode, useState } from 'react';
import { useOnlineGame } from '@/lib/hooks/useOnlineGame';
import type { GameState, Position, PieceType, Piece } from '@/types/shogi';
import { isCapturablePieceType } from '@/types/shogi';
// 元のGameContextをインポート（新しいContextを作らない）
import { GameContext, type GameContextType } from '@/lib/context/GameContext';
import { getValidMoves, canDropPiece, isInCheck, shouldOfferPromotion, mustPromote } from '@/lib/game/rules';

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
    offerDraw,
    acceptDraw,
    declineDraw,
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

  const selectSquare = useCallback(async (position: Position) => {
    if (!isMyTurn || !onlineGameState || !myPlayer) return;

    const piece = onlineGameState.board[position.rank][position.file];

    // 1. 持ち駒選択中の場合は駒を打つ
    if (selectedCapturedPiece) {
      // 駒を打つ処理
      const validation = canDropPiece(onlineGameState.board, selectedCapturedPiece, position, myPlayer);
      if (!validation.isValid) {
        console.log('Invalid drop:', validation.reason);
        return;
      }

      // 王手放置チェック
      const testBoard = onlineGameState.board.map(row => [...row]);
      testBoard[position.rank][position.file] = {
        type: selectedCapturedPiece,
        owner: myPlayer,
        isPromoted: false,
      };
      if (isInCheck(testBoard, myPlayer)) {
        console.log('Cannot drop: would be in check');
        return;
      }

      // submitMoveで送信
      await submitMove({
        type: 'drop',
        from: null,
        to: position,
        piece: selectedCapturedPiece,
        capturedPiece: null,
        isPromoted: false,
        shouldPromote: false,
        timestamp: new Date(),
      });

      setSelectedCapturedPiece(null);
      setValidMoves([]);
      return;
    }

    // 2. 駒が選択されている場合は移動
    if (selectedPosition) {
      const isValidMoveTarget = validMoves.some(
        move => move.rank === position.rank && move.file === position.file
      );

      if (isValidMoveTarget) {
        const selectedPiece = onlineGameState.board[selectedPosition.rank][selectedPosition.file];
        if (!selectedPiece) return;

        // 成り判定
        const canOfferPromotion = shouldOfferPromotion(selectedPosition, position, selectedPiece);
        const mustPromoteNow = mustPromote(selectedPiece.type, position, selectedPiece.owner);

        // 強制成りの場合は自動的に成る
        if (mustPromoteNow) {
          const capturedPiece = onlineGameState.board[position.rank][position.file];
          await submitMove({
            type: 'move',
            from: selectedPosition,
            to: position,
            piece: selectedPiece.type,
            capturedPiece: capturedPiece?.type || null,
            isPromoted: selectedPiece.isPromoted,
            shouldPromote: true,
            timestamp: new Date(),
          });
          setSelectedPosition(null);
          setValidMoves([]);
          return;
        }

        // 成りの選択肢を提示する場合
        if (canOfferPromotion) {
          setPromotionPending({ from: selectedPosition, to: position });
          return;
        }

        // 成れない場合は通常の移動
        const capturedPiece = onlineGameState.board[position.rank][position.file];
        await submitMove({
          type: 'move',
          from: selectedPosition,
          to: position,
          piece: selectedPiece.type,
          capturedPiece: capturedPiece?.type || null,
          isPromoted: selectedPiece.isPromoted,
          shouldPromote: false,
          timestamp: new Date(),
        });
        setSelectedPosition(null);
        setValidMoves([]);
        return;
      }
    }

    // 3. 自分の駒をクリックした場合は選択
    if (piece && piece.owner === myPlayer) {
      // 合法手を計算
      let moves = getValidMoves(onlineGameState.board, position, piece);

      // 王手放置防止: 移動後に王手になる手を除外
      moves = moves.filter(move => {
        const testBoard = onlineGameState.board.map(row => [...row]);
        testBoard[move.rank][move.file] = piece;
        testBoard[position.rank][position.file] = null;
        const wouldBeInCheck = isInCheck(testBoard, myPlayer);
        return !wouldBeInCheck;
      });

      setSelectedPosition(position);
      setSelectedCapturedPiece(null);
      setValidMoves(moves);
      return;
    }

    // 4. 空マスや相手の駒をクリック → 選択解除
    setSelectedPosition(null);
    setSelectedCapturedPiece(null);
    setValidMoves([]);
  }, [isMyTurn, myPlayer, onlineGameState, selectedCapturedPiece, selectedPosition, validMoves, submitMove]);

  const selectCapturedPiece = useCallback((pieceType: PieceType) => {
    if (!isMyTurn || !onlineGameState || !myPlayer) return;

    // 型ガードで安全にチェック
    if (!isCapturablePieceType(pieceType)) {
      return;
    }

    // 持ち駒があるかチェック
    const capturedPieces = onlineGameState.captured[myPlayer];
    if (capturedPieces[pieceType] === 0) {
      return;
    }

    // 持ち駒を打てるマスを計算
    const moves: Position[] = [];
    for (let rank = 0; rank < 9; rank++) {
      for (let file = 0; file < 9; file++) {
        const position: Position = { rank, file };
        const validation = canDropPiece(onlineGameState.board, pieceType, position, myPlayer);
        if (validation.isValid) {
          // 王手放置にならないかチェック
          const testBoard = onlineGameState.board.map(row => [...row]);
          testBoard[position.rank][position.file] = {
            type: pieceType,
            owner: myPlayer,
            isPromoted: false,
          };

          const wouldBeInCheck = isInCheck(testBoard, myPlayer);
          if (!wouldBeInCheck) {
            moves.push(position);
          }
        }
      }
    }

    setSelectedPosition(null);
    setSelectedCapturedPiece(pieceType);
    setValidMoves(moves);
  }, [isMyTurn, myPlayer, onlineGameState]);

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
    if (!promotionPending || !onlineGameState) return;

    const { from, to } = promotionPending;
    const selectedPiece = onlineGameState.board[from.rank][from.file];
    const capturedPiece = onlineGameState.board[to.rank][to.file];

    if (!selectedPiece) return;

    // 成りの手を送信
    await submitMove({
      type: 'move',
      from,
      to,
      piece: selectedPiece.type,
      capturedPiece: capturedPiece?.type || null,
      isPromoted: selectedPiece.isPromoted,
      shouldPromote: true,
      timestamp: new Date(),
    });

    setPromotionPending(null);
    setSelectedPosition(null);
    setValidMoves([]);
  }, [promotionPending, onlineGameState, submitMove]);

  const notPromote = useCallback(async () => {
    if (!promotionPending || !onlineGameState) return;

    const { from, to } = promotionPending;
    const selectedPiece = onlineGameState.board[from.rank][from.file];
    const capturedPiece = onlineGameState.board[to.rank][to.file];

    if (!selectedPiece) return;

    // 成らない手を送信
    await submitMove({
      type: 'move',
      from,
      to,
      piece: selectedPiece.type,
      capturedPiece: capturedPiece?.type || null,
      isPromoted: selectedPiece.isPromoted,
      shouldPromote: false,
      timestamp: new Date(),
    });

    setPromotionPending(null);
    setSelectedPosition(null);
    setValidMoves([]);
  }, [promotionPending, onlineGameState, submitMove]);

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

  // GameContextTypeの部分的な実装（dispatchは不要）
  const value = useMemo(() => ({
    gameState,
    selectSquare,
    selectCapturedPiece,
    newGame,
    resign,
    clearError,
    promote,
    notPromote,
    // オンライン情報を追加
    onlineInfo: onlineGameState ? {
      myPlayer: onlineGameState.myPlayer,
      connectionStatus: onlineGameState.connectionStatus,
    } : undefined,
    // 引き分け機能（#58）
    acceptDraw,
    declineDraw,
    offerDraw,
    // 以下はアダプターでは使用しないが、型を満たすためにダミー実装
    dispatch: () => {},
    movePiece: () => {},
    dropPiece: () => {},
    deselect: () => {},
    undo: () => {},
  }), [gameState, onlineGameState, selectSquare, selectCapturedPiece, newGame, resign, clearError, promote, notPromote, acceptDraw, declineDraw, offerDraw]);

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

// useGameはGameContext.tsxのものを使用するため、ここではエクスポートしない
