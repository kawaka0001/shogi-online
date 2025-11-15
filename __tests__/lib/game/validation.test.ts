/**
 * 禁じ手判定ロジックのテスト
 * 詳細: #14
 */

import { describe, test, expect } from '@jest/globals';
import type { Board, Player } from '@/types/shogi';
import {
  isNifu,
  isIkidononai,
  isUchifuzume,
  validateDrop,
  validateMove,
} from '@/lib/game/validation';

// ========================================
// 二歩のテスト
// ========================================

describe('isNifu (二歩判定)', () => {
  test('同じ筋に歩がある場合、二歩と判定される', () => {
    // 空盤面を作成
    const board: Board = Array(9).fill(null).map(() => Array(9).fill(null));

    // 1筋に先手の歩を配置
    board[6][0] = { type: 'pawn', owner: 'black', isPromoted: false };

    // 同じ1筋に先手の歩を打とうとする → 二歩
    expect(isNifu(board, 0, 'black')).toBe(true);

    // 別の筋（2筋）に打つ → OK
    expect(isNifu(board, 1, 'black')).toBe(false);
  });

  test('成った歩（と金）は二歩判定に含まれない', () => {
    const board: Board = Array(9).fill(null).map(() => Array(9).fill(null));

    // 1筋に成った歩（と金）を配置
    board[6][0] = { type: 'pawn', owner: 'black', isPromoted: true };

    // 同じ1筋に先手の歩を打とうとする → OK（と金は二歩に含まれない）
    expect(isNifu(board, 0, 'black')).toBe(false);
  });

  test('相手の歩がある筋には打てる', () => {
    const board: Board = Array(9).fill(null).map(() => Array(9).fill(null));

    // 1筋に後手の歩を配置
    board[2][0] = { type: 'pawn', owner: 'white', isPromoted: false };

    // 同じ1筋に先手の歩を打とうとする → OK（相手の歩は二歩に含まれない）
    expect(isNifu(board, 0, 'black')).toBe(false);
  });
});

// ========================================
// 行き所のない駒のテスト
// ========================================

describe('isIkidononai (行き所のない駒判定)', () => {
  test('先手の桂を1段目に打つことはできない', () => {
    expect(isIkidononai('knight', { rank: 0, file: 4 }, 'black')).toBe(true);
  });

  test('先手の桂を2段目に打つことはできない', () => {
    expect(isIkidononai('knight', { rank: 1, file: 4 }, 'black')).toBe(true);
  });

  test('先手の桂を3段目に打つことはできる', () => {
    expect(isIkidononai('knight', { rank: 2, file: 4 }, 'black')).toBe(false);
  });

  test('後手の桂を8段目に打つことはできない', () => {
    expect(isIkidononai('knight', { rank: 7, file: 4 }, 'white')).toBe(true);
  });

  test('後手の桂を9段目に打つことはできない', () => {
    expect(isIkidononai('knight', { rank: 8, file: 4 }, 'white')).toBe(true);
  });

  test('先手の香を1段目に打つことはできない', () => {
    expect(isIkidononai('lance', { rank: 0, file: 4 }, 'black')).toBe(true);
  });

  test('先手の香を2段目に打つことはできる', () => {
    expect(isIkidononai('lance', { rank: 1, file: 4 }, 'black')).toBe(false);
  });

  test('後手の香を9段目に打つことはできない', () => {
    expect(isIkidononai('lance', { rank: 8, file: 4 }, 'white')).toBe(true);
  });

  test('先手の歩を1段目に打つことはできない', () => {
    expect(isIkidononai('pawn', { rank: 0, file: 4 }, 'black')).toBe(true);
  });

  test('後手の歩を9段目に打つことはできない', () => {
    expect(isIkidononai('pawn', { rank: 8, file: 4 }, 'white')).toBe(true);
  });
});

// ========================================
// 統合テスト: validateDrop
// ========================================

describe('validateDrop (駒を打つ際の禁じ手判定)', () => {
  test('二歩の場合はエラーを返す', () => {
    const board: Board = Array(9).fill(null).map(() => Array(9).fill(null));

    // 1筋に先手の歩を配置
    board[6][0] = { type: 'pawn', owner: 'black', isPromoted: false };

    // 同じ1筋に先手の歩を打とうとする
    const result = validateDrop(board, 'pawn', { rank: 5, file: 0 }, 'black');

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('二歩');
  });

  test('行き所のない駒の場合はエラーを返す（桂馬を1段目に打つ）', () => {
    const board: Board = Array(9).fill(null).map(() => Array(9).fill(null));

    // 先手の桂を1段目に打とうとする
    const result = validateDrop(board, 'knight', { rank: 0, file: 4 }, 'black');

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('行き所のない駒');
  });
});

// ========================================
// 打ち歩詰めのテスト
// ========================================

describe('isUchifuzume (打ち歩詰め判定)', () => {
  test('歩を打って即詰みになる場合は打ち歩詰めと判定される', () => {
    const board: Board = Array(9).fill(null).map(() => Array(9).fill(null));

    // 簡単な打ち歩詰めの局面を作成
    // 後手の玉を1段4筋に配置
    board[0][4] = { type: 'king', owner: 'white', isPromoted: false };

    // 玉の周りを先手の駒で囲む（逃げ場をなくす）
    board[0][3] = { type: 'gold', owner: 'black', isPromoted: false };  // 左
    board[0][5] = { type: 'gold', owner: 'black', isPromoted: false };  // 右
    board[1][3] = { type: 'silver', owner: 'black', isPromoted: false }; // 左下
    board[1][5] = { type: 'silver', owner: 'black', isPromoted: false }; // 右下

    // 2段目4筋に歩を打って即詰みにしようとする → 打ち歩詰め
    const result = isUchifuzume(board, { rank: 1, file: 4 }, 'black');

    expect(result).toBe(true);
  });

  test('歩を打っても詰みにならない場合は打ち歩詰めではない', () => {
    const board: Board = Array(9).fill(null).map(() => Array(9).fill(null));

    // 後手の玉を配置（逃げ場がある）
    board[0][4] = { type: 'king', owner: 'white', isPromoted: false };

    // 歩を打つ位置
    const result = isUchifuzume(board, { rank: 1, file: 4 }, 'black');

    expect(result).toBe(false);
  });
});
