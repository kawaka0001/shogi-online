// 金・銀・玉の移動ルールのテスト
// 詳細: #9

import {
  getKingMoves,
  getGoldMoves,
  getSilverMoves,
  getValidMoves,
} from '@/lib/game/rules';
import { Board, Piece, Position } from '@/types/shogi';

/**
 * 空の盤面を作成
 */
function createEmptyBoard(): Board {
  return Array(9)
    .fill(null)
    .map(() => Array(9).fill(null));
}

describe('金・銀・玉の移動ルール', () => {
  describe('玉将（King）の移動', () => {
    test('盤面中央で全8方向に移動可能', () => {
      const board = createEmptyBoard();
      const from: Position = { rank: 4, file: 4 }; // 5五

      const king: Piece = {
        type: 'king',
        owner: 'black',
        isPromoted: false,
      };

      board[from.rank][from.file] = king;

      const moves = getKingMoves(board, from, king);

      // 8方向すべてに移動可能
      expect(moves).toHaveLength(8);

      // 各方向の存在確認
      const moveSet = new Set(moves.map((m) => `${m.rank},${m.file}`));
      expect(moveSet.has('3,4')).toBe(true); // 上
      expect(moveSet.has('3,5')).toBe(true); // 右上
      expect(moveSet.has('4,5')).toBe(true); // 右
      expect(moveSet.has('5,5')).toBe(true); // 右下
      expect(moveSet.has('5,4')).toBe(true); // 下
      expect(moveSet.has('5,3')).toBe(true); // 左下
      expect(moveSet.has('4,3')).toBe(true); // 左
      expect(moveSet.has('3,3')).toBe(true); // 左上
    });

    test('盤面端では盤外に移動できない', () => {
      const board = createEmptyBoard();
      const from: Position = { rank: 0, file: 0 }; // 1一（右上隅）

      const king: Piece = {
        type: 'king',
        owner: 'black',
        isPromoted: false,
      };

      board[from.rank][from.file] = king;

      const moves = getKingMoves(board, from, king);

      // 3方向のみ移動可能（右、下、右下）
      expect(moves).toHaveLength(3);
    });

    test('味方の駒がいる位置には移動できない', () => {
      const board = createEmptyBoard();
      const from: Position = { rank: 4, file: 4 }; // 5五

      const king: Piece = {
        type: 'king',
        owner: 'black',
        isPromoted: false,
      };

      const friendlyPiece: Piece = {
        type: 'gold',
        owner: 'black',
        isPromoted: false,
      };

      board[from.rank][from.file] = king;
      board[3][4] = friendlyPiece; // 上に味方の駒

      const moves = getKingMoves(board, from, king);

      // 7方向のみ移動可能（上は除外）
      expect(moves).toHaveLength(7);

      const moveSet = new Set(moves.map((m) => `${m.rank},${m.file}`));
      expect(moveSet.has('3,4')).toBe(false); // 上は移動不可
    });
  });

  describe('金将（Gold）の移動', () => {
    test('先手の金が6方向に移動可能', () => {
      const board = createEmptyBoard();
      const from: Position = { rank: 4, file: 4 }; // 5五

      const gold: Piece = {
        type: 'gold',
        owner: 'black',
        isPromoted: false,
      };

      board[from.rank][from.file] = gold;

      const moves = getGoldMoves(board, from, gold);

      // 6方向に移動可能
      expect(moves).toHaveLength(6);

      const moveSet = new Set(moves.map((m) => `${m.rank},${m.file}`));
      expect(moveSet.has('3,4')).toBe(true); // 上（前）
      expect(moveSet.has('3,5')).toBe(true); // 右上（右前）
      expect(moveSet.has('4,5')).toBe(true); // 右
      expect(moveSet.has('5,4')).toBe(true); // 下（後ろ）
      expect(moveSet.has('4,3')).toBe(true); // 左
      expect(moveSet.has('3,3')).toBe(true); // 左上（左前）

      // 斜め後ろには移動不可
      expect(moveSet.has('5,5')).toBe(false); // 右下
      expect(moveSet.has('5,3')).toBe(false); // 左下
    });

    test('後手の金が6方向に移動可能', () => {
      const board = createEmptyBoard();
      const from: Position = { rank: 4, file: 4 }; // 5五

      const gold: Piece = {
        type: 'gold',
        owner: 'white',
        isPromoted: false,
      };

      board[from.rank][from.file] = gold;

      const moves = getGoldMoves(board, from, gold);

      // 6方向に移動可能
      expect(moves).toHaveLength(6);

      const moveSet = new Set(moves.map((m) => `${m.rank},${m.file}`));
      expect(moveSet.has('5,4')).toBe(true); // 下（前）
      expect(moveSet.has('5,5')).toBe(true); // 右下（右前）
      expect(moveSet.has('4,5')).toBe(true); // 右
      expect(moveSet.has('3,4')).toBe(true); // 上（後ろ）
      expect(moveSet.has('4,3')).toBe(true); // 左
      expect(moveSet.has('5,3')).toBe(true); // 左下（左前）

      // 斜め後ろには移動不可
      expect(moveSet.has('3,5')).toBe(false); // 右上
      expect(moveSet.has('3,3')).toBe(false); // 左上
    });
  });

  describe('銀将（Silver）の移動', () => {
    test('先手の銀が5方向に移動可能', () => {
      const board = createEmptyBoard();
      const from: Position = { rank: 4, file: 4 }; // 5五

      const silver: Piece = {
        type: 'silver',
        owner: 'black',
        isPromoted: false,
      };

      board[from.rank][from.file] = silver;

      const moves = getSilverMoves(board, from, silver);

      // 5方向に移動可能
      expect(moves).toHaveLength(5);

      const moveSet = new Set(moves.map((m) => `${m.rank},${m.file}`));
      expect(moveSet.has('3,4')).toBe(true); // 上（前）
      expect(moveSet.has('3,5')).toBe(true); // 右上
      expect(moveSet.has('5,5')).toBe(true); // 右下
      expect(moveSet.has('5,3')).toBe(true); // 左下
      expect(moveSet.has('3,3')).toBe(true); // 左上

      // 左右・真後ろには移動不可
      expect(moveSet.has('4,5')).toBe(false); // 右
      expect(moveSet.has('4,3')).toBe(false); // 左
      expect(moveSet.has('5,4')).toBe(false); // 下（後ろ）
    });

    test('後手の銀が5方向に移動可能', () => {
      const board = createEmptyBoard();
      const from: Position = { rank: 4, file: 4 }; // 5五

      const silver: Piece = {
        type: 'silver',
        owner: 'white',
        isPromoted: false,
      };

      board[from.rank][from.file] = silver;

      const moves = getSilverMoves(board, from, silver);

      // 5方向に移動可能
      expect(moves).toHaveLength(5);

      const moveSet = new Set(moves.map((m) => `${m.rank},${m.file}`));
      expect(moveSet.has('5,4')).toBe(true); // 下（前）
      expect(moveSet.has('5,5')).toBe(true); // 右下
      expect(moveSet.has('3,5')).toBe(true); // 右上
      expect(moveSet.has('3,3')).toBe(true); // 左上
      expect(moveSet.has('5,3')).toBe(true); // 左下

      // 左右・真後ろには移動不可
      expect(moveSet.has('4,5')).toBe(false); // 右
      expect(moveSet.has('4,3')).toBe(false); // 左
      expect(moveSet.has('3,4')).toBe(false); // 上（後ろ）
    });

    test('成銀は金と同じ動きをする', () => {
      const board = createEmptyBoard();
      const from: Position = { rank: 4, file: 4 }; // 5五

      const promotedSilver: Piece = {
        type: 'silver',
        owner: 'black',
        isPromoted: true,
      };

      board[from.rank][from.file] = promotedSilver;

      const moves = getValidMoves(board, from, promotedSilver);

      // 成銀は金と同じ6方向に移動可能
      expect(moves).toHaveLength(6);

      const moveSet = new Set(moves.map((m) => `${m.rank},${m.file}`));
      // 金と同じ動き
      expect(moveSet.has('3,4')).toBe(true); // 上（前）
      expect(moveSet.has('3,5')).toBe(true); // 右上
      expect(moveSet.has('4,5')).toBe(true); // 右
      expect(moveSet.has('5,4')).toBe(true); // 下（後ろ）
      expect(moveSet.has('4,3')).toBe(true); // 左
      expect(moveSet.has('3,3')).toBe(true); // 左上

      // 斜め後ろには移動不可（銀の動きではない）
      expect(moveSet.has('5,5')).toBe(false); // 右下
      expect(moveSet.has('5,3')).toBe(false); // 左下
    });
  });

  describe('getValidMoves統合テスト', () => {
    test('駒種に応じて正しい移動パターンを返す', () => {
      const board = createEmptyBoard();
      const from: Position = { rank: 4, file: 4 };

      const king: Piece = { type: 'king', owner: 'black', isPromoted: false };
      const gold: Piece = { type: 'gold', owner: 'black', isPromoted: false };
      const silver: Piece = {
        type: 'silver',
        owner: 'black',
        isPromoted: false,
      };

      board[from.rank][from.file] = king;
      expect(getValidMoves(board, from, king)).toHaveLength(8);

      board[from.rank][from.file] = gold;
      expect(getValidMoves(board, from, gold)).toHaveLength(6);

      board[from.rank][from.file] = silver;
      expect(getValidMoves(board, from, silver)).toHaveLength(5);
    });
  });
});
