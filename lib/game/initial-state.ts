/**
 * ゲームの初期状態を生成
 * 詳細: #4, #5
 */

import type {
  Board,
  CapturedPieces,
  GameState,
  Piece,
  Player,
  PlayerCapturedPieces,
} from '@/types/shogi';
import { BOARD_SIZE } from './constants';

/**
 * 空の盤面を生成
 */
export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
}

/**
 * 空の持ち駒を生成
 */
export function createEmptyCapturedPieces(): PlayerCapturedPieces {
  return {
    rook: 0,
    bishop: 0,
    gold: 0,
    silver: 0,
    knight: 0,
    lance: 0,
    pawn: 0,
  };
}

/**
 * 初期配置の盤面を生成
 * 詳細: #4
 */
export function createInitialBoard(): Board {
  const board = createEmptyBoard();

  // 後手（White）の駒配置
  // 1段目（インデックス0）
  board[0][0] = { type: 'lance', owner: 'white', isPromoted: false };
  board[0][1] = { type: 'knight', owner: 'white', isPromoted: false };
  board[0][2] = { type: 'silver', owner: 'white', isPromoted: false };
  board[0][3] = { type: 'gold', owner: 'white', isPromoted: false };
  board[0][4] = { type: 'king', owner: 'white', isPromoted: false };
  board[0][5] = { type: 'gold', owner: 'white', isPromoted: false };
  board[0][6] = { type: 'silver', owner: 'white', isPromoted: false };
  board[0][7] = { type: 'knight', owner: 'white', isPromoted: false };
  board[0][8] = { type: 'lance', owner: 'white', isPromoted: false };

  // 2段目（インデックス1）
  board[1][1] = { type: 'bishop', owner: 'white', isPromoted: false };
  board[1][7] = { type: 'rook', owner: 'white', isPromoted: false };

  // 3段目（インデックス2）- 歩
  for (let file = 0; file < BOARD_SIZE; file++) {
    board[2][file] = { type: 'pawn', owner: 'white', isPromoted: false };
  }

  // 先手（Black）の駒配置
  // 7段目（インデックス6）- 歩
  for (let file = 0; file < BOARD_SIZE; file++) {
    board[6][file] = { type: 'pawn', owner: 'black', isPromoted: false };
  }

  // 8段目（インデックス7）
  board[7][1] = { type: 'rook', owner: 'black', isPromoted: false };
  board[7][7] = { type: 'bishop', owner: 'black', isPromoted: false };

  // 9段目（インデックス8）
  board[8][0] = { type: 'lance', owner: 'black', isPromoted: false };
  board[8][1] = { type: 'knight', owner: 'black', isPromoted: false };
  board[8][2] = { type: 'silver', owner: 'black', isPromoted: false };
  board[8][3] = { type: 'gold', owner: 'black', isPromoted: false };
  board[8][4] = { type: 'king', owner: 'black', isPromoted: false };
  board[8][5] = { type: 'gold', owner: 'black', isPromoted: false };
  board[8][6] = { type: 'silver', owner: 'black', isPromoted: false };
  board[8][7] = { type: 'knight', owner: 'black', isPromoted: false };
  board[8][8] = { type: 'lance', owner: 'black', isPromoted: false };

  return board;
}

/**
 * ゲームの初期状態を生成
 */
export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    captured: {
      black: createEmptyCapturedPieces(),
      white: createEmptyCapturedPieces(),
    },
    currentTurn: 'black', // 先手から開始
    moveHistory: [],
    gameStatus: 'playing',
    isCheck: false,
    selectedPosition: null,
    validMoves: [],
    selectedCapturedPiece: null, // #12: 持ち駒選択
    lastMove: null,
  };
}
