/**
 * 位置関連のユーティリティ関数
 * 詳細: #5
 */

import type { Position } from '@/types/shogi';
import { BOARD_SIZE } from '../game/constants';

/**
 * 位置が盤面内かどうかを判定
 */
export function isValidPosition(position: Position): boolean {
  return (
    position.rank >= 0 &&
    position.rank < BOARD_SIZE &&
    position.file >= 0 &&
    position.file < BOARD_SIZE
  );
}

/**
 * 2つの位置が同じかどうかを判定
 */
export function isSamePosition(pos1: Position, pos2: Position): boolean {
  return pos1.rank === pos2.rank && pos1.file === pos2.file;
}

/**
 * 位置の配列に特定の位置が含まれているかを判定
 */
export function includesPosition(positions: Position[], target: Position): boolean {
  return positions.some((pos) => isSamePosition(pos, target));
}

/**
 * 位置を文字列に変換（デバッグ用）
 * 例: {rank: 0, file: 0} -> "1一"
 */
export function positionToString(position: Position): string {
  const files = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const ranks = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  return `${files[position.file]}${ranks[position.rank]}`;
}

/**
 * 文字列を位置に変換
 * 例: "1一" -> {rank: 0, file: 0}
 */
export function stringToPosition(str: string): Position | null {
  const files = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const ranks = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

  if (str.length !== 2) return null;

  const file = files.indexOf(str[0]);
  const rank = ranks.indexOf(str[1]);

  if (file === -1 || rank === -1) return null;

  return { rank, file };
}

/**
 * 位置の差分を計算
 */
export function getPositionDelta(from: Position, to: Position): { rankDelta: number; fileDelta: number } {
  return {
    rankDelta: to.rank - from.rank,
    fileDelta: to.file - from.file,
  };
}
