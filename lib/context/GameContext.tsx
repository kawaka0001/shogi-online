/**
 * ゲーム状態管理用のReact Context
 * 詳細: #5
 *
 * React Context APIを使用した状態管理
 * 将来的にZustandへの移行も検討
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import type { GameState, Position, Move, PieceType } from '@/types/shogi';
import { createInitialGameState } from '../game/initial-state';
import { getValidMoves } from '../game/rules';

// ========================================
// Action Types
// ========================================

type GameAction =
  | { type: 'SELECT_SQUARE'; payload: Position }
  | { type: 'MOVE_PIECE'; payload: { from: Position; to: Position; shouldPromote: boolean } }
  | { type: 'DROP_PIECE'; payload: { pieceType: PieceType; to: Position } }
  | { type: 'DESELECT' }
  | { type: 'NEW_GAME' }
  | { type: 'RESIGN' }
  | { type: 'UNDO' }
  | { type: 'SET_GAME_STATE'; payload: GameState };

// ========================================
// Context Type
// ========================================

type GameContextType = {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;

  // Helper functions
  selectSquare: (position: Position) => void;
  movePiece: (from: Position, to: Position, shouldPromote: boolean) => void;
  dropPiece: (pieceType: PieceType, to: Position) => void;
  deselect: () => void;
  newGame: () => void;
  resign: () => void;
  undo: () => void;
};

// ========================================
// Reducer
// ========================================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_SQUARE': {
      const { payload: position } = action;
      const piece = state.board[position.rank][position.file];

      // 自分の駒を選択した場合
      if (piece && piece.owner === state.currentTurn) {
        // 合法手を計算 (#7, #8, #9, #10)
        const validMoves = getValidMoves(state.board, position, piece);
        return {
          ...state,
          selectedPosition: position,
          validMoves,
        };
      }

      // 空マスや相手の駒をクリック → 選択解除
      return {
        ...state,
        selectedPosition: null,
        validMoves: [],
      };
    }

    case 'MOVE_PIECE': {
      // TODO: 実際の移動処理を実装（#7, #8で実装）
      // ここでは基本的な構造のみ
      return state;
    }

    case 'DROP_PIECE': {
      // TODO: 持ち駒を打つ処理を実装（#12で実装）
      return state;
    }

    case 'DESELECT': {
      return {
        ...state,
        selectedPosition: null,
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

  const value: GameContextType = {
    gameState,
    dispatch,
    selectSquare,
    movePiece,
    dropPiece,
    deselect,
    newGame,
    resign,
    undo,
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
