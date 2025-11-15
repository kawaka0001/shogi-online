/**
 * ゲーム状態管理用のReact Context
 * 詳細: #5, #17
 *
 * React Context APIを使用した状態管理
 * 将来的にZustandへの移行も検討
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { GameState, Position, Move, PieceType, Piece } from '@/types/shogi';
import { isCapturablePieceType } from '@/types/shogi';
import { createInitialGameState } from '../game/initial-state';
import { getValidMoves, canDropPiece, isInCheck, isCheckmate, shouldOfferPromotion, mustPromote } from '../game/rules';

// ========================================
// Action Types
// ========================================

type GameAction =
  | { type: 'SELECT_SQUARE'; payload: Position }
  | { type: 'SELECT_CAPTURED_PIECE'; payload: PieceType }  // #12: 持ち駒を選択
  | { type: 'MOVE_PIECE'; payload: { from: Position; to: Position; shouldPromote: boolean } }
  | { type: 'DROP_PIECE'; payload: { pieceType: PieceType; to: Position } }
  | { type: 'DESELECT' }
  | { type: 'NEW_GAME' }
  | { type: 'RESIGN' }
  | { type: 'UNDO' }
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'CLEAR_ERROR' }  // 詳細: エラーUI実装
  | { type: 'PROMOTE' }  // #13: 成りを選択
  | { type: 'NOT_PROMOTE' };  // #13: 成らないを選択

// ========================================
// Context Type
// ========================================

type GameContextType = {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;

  // Helper functions
  selectSquare: (position: Position) => void;
  selectCapturedPiece: (pieceType: PieceType) => void;  // #12: 持ち駒を選択
  movePiece: (from: Position, to: Position, shouldPromote: boolean) => void;
  dropPiece: (pieceType: PieceType, to: Position) => void;
  deselect: () => void;
  newGame: () => void;
  resign: () => void;
  undo: () => void;
  clearError: () => void;  // 詳細: エラーUI実装
  promote: () => void;  // #13: 成りを選択
  notPromote: () => void;  // #13: 成らないを選択
};

// ========================================
// Reducer
// ========================================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_SQUARE': {
      const { payload: position } = action;
      const piece = state.board[position.rank][position.file];

      // 持ち駒選択中の場合、マスをクリックしたら駒を打つ (#12)
      if (state.selectedCapturedPiece) {
        return gameReducer(state, {
          type: 'DROP_PIECE',
          payload: { pieceType: state.selectedCapturedPiece, to: position }
        });
      }

      // 駒が選択されている状態で移動可能なマスをクリックした場合
      if (state.selectedPosition) {
        const isValidMoveTarget = state.validMoves.some(
          move => move.rank === position.rank && move.file === position.file
        );

        if (isValidMoveTarget) {
          // 駒を移動（#11で実装）
          const selectedPiece = state.board[state.selectedPosition.rank][state.selectedPosition.file];
          if (!selectedPiece) return state;

          // #13: 成り判定
          const canOfferPromotion = shouldOfferPromotion(
            state.selectedPosition,
            position,
            selectedPiece
          );
          const mustPromoteNow = mustPromote(selectedPiece.type, position, selectedPiece.owner);

          // 強制成りの場合は自動的に成る
          if (mustPromoteNow) {
            return gameReducer(state, {
              type: 'MOVE_PIECE',
              payload: { from: state.selectedPosition, to: position, shouldPromote: true }
            });
          }

          // 成りの選択肢を提示する場合
          if (canOfferPromotion) {
            return {
              ...state,
              promotionState: {
                isOpen: true,
                from: state.selectedPosition,
                to: position,
                piece: selectedPiece,
              },
            };
          }

          // 成れない場合は通常の移動
          return gameReducer(state, {
            type: 'MOVE_PIECE',
            payload: { from: state.selectedPosition, to: position, shouldPromote: false }
          });
        }
      }

      // 自分の駒を選択した場合
      if (piece && piece.owner === state.currentTurn) {
        // 合法手を計算 (#7, #8, #9, #10)
        const validMoves = getValidMoves(state.board, position, piece);
        return {
          ...state,
          selectedPosition: position,
          selectedCapturedPiece: null,  // #12: 盤上の駒を選択したら持ち駒選択を解除
          validMoves,
        };
      }

      // 空マスや相手の駒をクリック → 選択解除
      return {
        ...state,
        selectedPosition: null,
        selectedCapturedPiece: null,  // #12
        validMoves: [],
      };
    }

    case 'SELECT_CAPTURED_PIECE': {
      // #12: 持ち駒を選択
      const { payload: pieceType } = action;

      // 型ガードで安全にチェック（詳細: 型安全性強化）
      if (!isCapturablePieceType(pieceType)) {
        return state;
      }

      // 持ち駒があるかチェック（この時点でpieceTypeはCapturablePieceType）
      const capturedPieces = state.captured[state.currentTurn];
      if (capturedPieces[pieceType] === 0) {
        return state;
      }

      // 持ち駒を打てるマスを計算
      const validMoves: Position[] = [];
      for (let rank = 0; rank < 9; rank++) {
        for (let file = 0; file < 9; file++) {
          const position: Position = { rank, file };
          const validation = canDropPiece(state.board, pieceType, position, state.currentTurn);
          if (validation.isValid) {
            validMoves.push(position);
          }
        }
      }

      return {
        ...state,
        selectedPosition: null,
        selectedCapturedPiece: pieceType,
        validMoves,
      };
    }

    case 'MOVE_PIECE': {
      const { from, to, shouldPromote } = action.payload;

      // 移動元の駒を取得
      const piece = state.board[from.rank][from.file];
      if (!piece) return state;

      // 移動先の駒（取られる駒）を取得
      const capturedPiece = state.board[to.rank][to.file];

      // 新しい盤面を作成
      const newBoard = state.board.map(row => [...row]);

      // 駒を移動
      newBoard[to.rank][to.file] = {
        ...piece,
        isPromoted: shouldPromote || piece.isPromoted,
      };
      newBoard[from.rank][from.file] = null;

      // 持ち駒の更新（#11: 駒を取る機能）
      const newCaptured = { ...state.captured };
      if (capturedPiece) {
        const capturingPlayer = piece.owner;

        // 成駒は元に戻す
        const capturedType = capturedPiece.type;

        // 玉は取れない（通常ありえないが安全のため）
        if (capturedType !== 'king') {
          newCaptured[capturingPlayer] = {
            ...newCaptured[capturingPlayer],
            [capturedType]: newCaptured[capturingPlayer][capturedType] + 1,
          };
        }
      }

      // 手番を交代
      const nextTurn = state.currentTurn === 'black' ? 'white' : 'black';

      // 移動履歴を記録
      const move: Move = {
        type: 'move',
        from,
        to,
        piece: piece.type,
        isPromoted: piece.isPromoted,
        shouldPromote,
        capturedPiece: capturedPiece?.type || null,
        timestamp: new Date(),
      };

      // 王手チェック (#16)
      const inCheck = isInCheck(newBoard, nextTurn);

      // 詰みチェック (#17)
      const inCheckmate = inCheck && isCheckmate(newBoard, nextTurn);
      const newGameStatus = inCheckmate ? 'checkmate' : (inCheck ? 'check' : 'playing');

      return {
        ...state,
        board: newBoard,
        captured: newCaptured,
        currentTurn: nextTurn,
        moveHistory: [...state.moveHistory, move],
        selectedPosition: null,
        validMoves: [],
        lastMove: move,
        isCheck: inCheck,
        gameStatus: newGameStatus,
      };
    }

    case 'DROP_PIECE': {
      // #12: 持ち駒を打つ処理
      const { payload } = action;
      const { pieceType, to } = payload;

      // 型ガードで安全にチェック（詳細: 型安全性強化）
      if (!isCapturablePieceType(pieceType)) {
        return {
          ...state,
          errorMessage: '玉を持ち駒として打つことはできません',
        };
      }

      // 持ち駒があるかチェック（この時点でpieceTypeはCapturablePieceType）
      const capturedPieces = state.captured[state.currentTurn];
      const count = capturedPieces[pieceType]; // 型安全

      if (count === 0) {
        return {
          ...state,
          errorMessage: '持ち駒がありません',
        };
      }

      // 合法手かチェック（詳細: エラーUI実装）
      const validation = canDropPiece(state.board, pieceType, to, state.currentTurn);
      if (!validation.isValid) {
        return {
          ...state,
          errorMessage: `不正な打ち方です: ${validation.reason}`,
          selectedCapturedPiece: null,
          validMoves: [],
        };
      }

      // 新しい盤面を作成
      const newBoard = state.board.map(row => [...row]);
      newBoard[to.rank][to.file] = {
        type: pieceType,
        owner: state.currentTurn,
        isPromoted: false,
      };

      // 持ち駒から減らす（型安全）
      const newCaptured = {
        ...state.captured,
        [state.currentTurn]: {
          ...capturedPieces,
          [pieceType]: count - 1,
        },
      };

      // 手番を交代
      const nextTurn = state.currentTurn === 'black' ? 'white' : 'black';

      // 移動履歴に追加
      const move: Move = {
        type: 'drop',
        from: null,
        to,
        piece: pieceType,
        isPromoted: false,
        shouldPromote: false,
        capturedPiece: null,
        timestamp: new Date(),
      };

      // 王手チェック (#16)
      const inCheck = isInCheck(newBoard, nextTurn);

      // 詰みチェック (#17)
      const inCheckmate = inCheck && isCheckmate(newBoard, nextTurn);
      const newGameStatus = inCheckmate ? 'checkmate' : (inCheck ? 'check' : 'playing');

      return {
        ...state,
        board: newBoard,
        captured: newCaptured,
        currentTurn: nextTurn,
        moveHistory: [...state.moveHistory, move],
        selectedPosition: null,
        selectedCapturedPiece: null,
        validMoves: [],
        lastMove: move,
        isCheck: inCheck,
        gameStatus: newGameStatus,
      };
    }

    case 'DESELECT': {
      return {
        ...state,
        selectedPosition: null,
        selectedCapturedPiece: null,  // #12
        validMoves: [],
      };
    }

    case 'NEW_GAME': {
      return createInitialGameState();
    }

    case 'RESIGN': {
      return {
        ...state,
        gameStatus: 'resignation',
      };
    }

    case 'UNDO': {
      // TODO: 1手戻す処理を実装（#25で実装）
      return state;
    }

    case 'SET_GAME_STATE': {
      return action.payload;
    }

    case 'CLEAR_ERROR': {
      // 詳細: エラーUI実装
      return {
        ...state,
        errorMessage: null,
      };
    }

    case 'PROMOTE': {
      // #13: 成りを選択
      const { from, to, piece } = state.promotionState;
      if (!from || !to || !piece) return state;

      // 成りで駒を移動
      const newState = gameReducer(state, {
        type: 'MOVE_PIECE',
        payload: { from, to, shouldPromote: true }
      });

      // ダイアログを閉じる
      return {
        ...newState,
        promotionState: {
          isOpen: false,
          from: null,
          to: null,
          piece: null,
        },
      };
    }

    case 'NOT_PROMOTE': {
      // #13: 成らないを選択
      const { from, to, piece } = state.promotionState;
      if (!from || !to || !piece) return state;

      // 成らずに駒を移動
      const newState = gameReducer(state, {
        type: 'MOVE_PIECE',
        payload: { from, to, shouldPromote: false }
      });

      // ダイアログを閉じる
      return {
        ...newState,
        promotionState: {
          isOpen: false,
          from: null,
          to: null,
          piece: null,
        },
      };
    }

    default:
      return state;
  }
}

// ========================================
// Context
// ========================================

const GameContext = createContext<GameContextType | undefined>(undefined);

// ========================================
// Provider
// ========================================

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialGameState());

  // Helper functions
  const selectSquare = useCallback((position: Position) => {
    dispatch({ type: 'SELECT_SQUARE', payload: position });
  }, []);

  const selectCapturedPiece = useCallback((pieceType: PieceType) => {
    dispatch({ type: 'SELECT_CAPTURED_PIECE', payload: pieceType });
  }, []);

  const movePiece = useCallback((from: Position, to: Position, shouldPromote: boolean) => {
    dispatch({ type: 'MOVE_PIECE', payload: { from, to, shouldPromote } });
  }, []);

  const dropPiece = useCallback((pieceType: PieceType, to: Position) => {
    dispatch({ type: 'DROP_PIECE', payload: { pieceType, to } });
  }, []);

  const deselect = useCallback(() => {
    dispatch({ type: 'DESELECT' });
  }, []);

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' });
  }, []);

  const resign = useCallback(() => {
    dispatch({ type: 'RESIGN' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const promote = useCallback(() => {
    dispatch({ type: 'PROMOTE' });
  }, []);

  const notPromote = useCallback(() => {
    dispatch({ type: 'NOT_PROMOTE' });
  }, []);

  const value: GameContextType = {
    gameState,
    dispatch,
    selectSquare,
    selectCapturedPiece,
    movePiece,
    dropPiece,
    deselect,
    newGame,
    resign,
    undo,
    clearError,
    promote,
    notPromote,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ========================================
// Hook
// ========================================

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
