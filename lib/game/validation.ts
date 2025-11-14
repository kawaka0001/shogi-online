/**
 * 禁じ手の判定ロジック
 * 詳細: #14, #4
 */

import type { Board, Piece, PieceType, Player, Position, MoveValidation } from '@/types/shogi';
import { isValidPosition } from '../utils/position';
import { getValidMoves } from './rules';

// ========================================
// 禁じ手判定: 二歩 (Nifu)
// ========================================

/**
 * 二歩判定
 * 同じ筋（縦の列）に自分の歩が既にある場合、歩を打てない
 *
 * @param board - 盤面
 * @param file - 打とうとしている筋 (0-8)
 * @param player - プレイヤー
 * @returns 二歩かどうか
 */
export function isNifu(board: Board, file: number, player: Player): boolean {
  // 指定した筋に自分の歩が既に存在するか確認
  for (let rank = 0; rank < 9; rank++) {
    const piece = board[rank][file];
    if (
      piece &&
      piece.type === 'pawn' &&
      piece.owner === player &&
      !piece.isPromoted // 成った歩（と金）は除外
    ) {
      return true; // 既に歩が存在する → 二歩
    }
  }
  return false;
}

// ========================================
// 禁じ手判定: 行き所のない駒 (Ikidononai)
// ========================================

/**
 * 行き所のない駒の判定
 * - 桂を1段目に打てない
 * - 桂・香を敵陣外で動けなくなる位置に打てない
 *
 * @param pieceType - 駒の種類
 * @param to - 打とうとしている位置
 * @param player - プレイヤー
 * @returns 行き所のない駒かどうか
 */
export function isIkidononai(
  pieceType: PieceType,
  to: Position,
  player: Player
): boolean {
  // 桂馬の場合
  if (pieceType === 'knight') {
    // 先手の桂を1段目または2段目に打てない
    if (player === 'black' && to.rank <= 1) {
      return true;
    }
    // 後手の桂を8段目または9段目に打てない
    if (player === 'white' && to.rank >= 7) {
      return true;
    }
  }

  // 香車の場合
  if (pieceType === 'lance') {
    // 先手の香を1段目に打てない
    if (player === 'black' && to.rank === 0) {
      return true;
    }
    // 後手の香を9段目に打てない
    if (player === 'white' && to.rank === 8) {
      return true;
    }
  }

  // 歩の場合（念のため）
  if (pieceType === 'pawn') {
    // 先手の歩を1段目に打てない
    if (player === 'black' && to.rank === 0) {
      return true;
    }
    // 後手の歩を9段目に打てない
    if (player === 'white' && to.rank === 8) {
      return true;
    }
  }

  return false;
}

// ========================================
// 禁じ手判定: 打ち歩詰め (Uchifuzume)
// ========================================

/**
 * 敵玉の位置を取得
 */
function findKingPosition(board: Board, player: Player): Position | null {
  for (let rank = 0; rank < 9; rank++) {
    for (let file = 0; file < 9; file++) {
      const piece = board[rank][file];
      if (piece && piece.type === 'king' && piece.owner === player) {
        return { rank, file };
      }
    }
  }
  return null;
}

/**
 * 指定した位置が王手になっているか確認
 */
function isInCheck(board: Board, kingPosition: Position, attackingPlayer: Player): boolean {
  // 敵の全ての駒から王への攻撃をチェック
  for (let rank = 0; rank < 9; rank++) {
    for (let file = 0; file < 9; file++) {
      const piece = board[rank][file];
      if (piece && piece.owner === attackingPlayer) {
        const from: Position = { rank, file };
        const validMoves = getValidMoves(board, from, piece);

        // この駒が王の位置に移動できるか確認
        const canAttackKing = validMoves.some(
          (move) => move.rank === kingPosition.rank && move.file === kingPosition.file
        );

        if (canAttackKing) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * 詰みかどうか確認（王が逃げられるか、王手を防げるか）
 */
function isCheckmate(board: Board, kingPosition: Position, defendingPlayer: Player): boolean {
  const king = board[kingPosition.rank][kingPosition.file];
  if (!king) return false;

  // 王が逃げられるか確認
  const kingMoves = getValidMoves(board, kingPosition, king);
  for (const move of kingMoves) {
    // 仮想的に王を移動してみる
    const testBoard = board.map(row => [...row]);
    testBoard[move.rank][move.file] = king;
    testBoard[kingPosition.rank][kingPosition.file] = null;

    // 移動先でも王手になっていないか確認
    const attackingPlayer = defendingPlayer === 'black' ? 'white' : 'black';
    if (!isInCheck(testBoard, move, attackingPlayer)) {
      return false; // 逃げられる手がある
    }
  }

  // 他の駒で王手を防げるか確認
  for (let rank = 0; rank < 9; rank++) {
    for (let file = 0; file < 9; file++) {
      const piece = board[rank][file];
      if (piece && piece.owner === defendingPlayer && piece.type !== 'king') {
        const from: Position = { rank, file };
        const validMoves = getValidMoves(board, from, piece);

        for (const move of validMoves) {
          // 仮想的に駒を移動してみる
          const testBoard = board.map(row => [...row]);
          testBoard[move.rank][move.file] = piece;
          testBoard[from.rank][from.file] = null;

          // 王手が解消されるか確認
          const attackingPlayer = defendingPlayer === 'black' ? 'white' : 'black';
          const kingPos = findKingPosition(testBoard, defendingPlayer);
          if (kingPos && !isInCheck(testBoard, kingPos, attackingPlayer)) {
            return false; // 防げる手がある
          }
        }
      }
    }
  }

  return true; // 詰み
}

/**
 * 打ち歩詰め判定
 * 歩を打って即詰みにする手は禁止
 * ただし、打った歩以外でも詰む場合はOK
 *
 * @param board - 盤面
 * @param to - 歩を打とうとしている位置
 * @param player - プレイヤー
 * @returns 打ち歩詰めかどうか
 */
export function isUchifuzume(
  board: Board,
  to: Position,
  player: Player
): boolean {
  // 相手の王の位置を取得
  const opponent: Player = player === 'black' ? 'white' : 'black';
  const kingPosition = findKingPosition(board, opponent);

  if (!kingPosition) return false;

  // 仮想的に歩を打ってみる
  const testBoard = board.map(row => [...row]);
  testBoard[to.rank][to.file] = {
    type: 'pawn',
    owner: player,
    isPromoted: false,
  };

  // 王手になっているか確認
  if (!isInCheck(testBoard, kingPosition, player)) {
    return false; // 王手にならないので打ち歩詰めではない
  }

  // 詰みになっているか確認
  if (!isCheckmate(testBoard, kingPosition, opponent)) {
    return false; // 詰みではないので打ち歩詰めではない
  }

  // 歩を取り除いた状態でも詰みか確認
  const boardWithoutPawn = board.map(row => [...row]);
  if (isCheckmate(boardWithoutPawn, kingPosition, opponent)) {
    return false; // 歩を打たなくても詰みなのでOK
  }

  return true; // 打ち歩詰め
}

// ========================================
// 禁じ手判定: 王手放置 (Oute Houchi)
// ========================================

/**
 * 王手放置の判定
 * 王手がかかっている状態で、王手を解消しない手を指すのは禁止
 *
 * @param board - 盤面
 * @param player - プレイヤー
 * @returns 王手がかかっているかどうか
 */
export function isOuteHouchi(board: Board, player: Player): boolean {
  const kingPosition = findKingPosition(board, player);
  if (!kingPosition) return false;

  const opponent: Player = player === 'black' ? 'white' : 'black';
  return isInCheck(board, kingPosition, opponent);
}

/**
 * 移動後に王手放置になっていないか確認
 */
export function wouldBeOuteHouchi(
  board: Board,
  from: Position,
  to: Position,
  player: Player
): boolean {
  // 仮想的に駒を移動
  const testBoard = board.map(row => [...row]);
  const piece = testBoard[from.rank][from.file];
  if (!piece) return false;

  testBoard[to.rank][to.file] = piece;
  testBoard[from.rank][from.file] = null;

  // 移動後に自分の王が王手になっているか確認
  return isOuteHouchi(testBoard, player);
}

// ========================================
// 統合的な禁じ手判定
// ========================================

/**
 * 持ち駒を打つ際の禁じ手判定
 * 注: 基本的な位置・空マスチェックは rules.ts で行われる前提
 */
export function validateDrop(
  board: Board,
  pieceType: PieceType,
  to: Position,
  player: Player
): MoveValidation {
  // 打ち歩詰めのチェック（歩の場合のみ）
  if (pieceType === 'pawn') {
    if (isUchifuzume(board, to, player)) {
      return { isValid: false, reason: '打ち歩詰めは禁止です' };
    }
  }

  // 仮想的に駒を打ってみて、王手放置にならないか確認
  const testBoard = board.map(row => [...row]);
  testBoard[to.rank][to.file] = {
    type: pieceType,
    owner: player,
    isPromoted: false,
  };

  if (isOuteHouchi(testBoard, player)) {
    return { isValid: false, reason: '王手を解消してください' };
  }

  return { isValid: true };
}

/**
 * 駒の移動に対する禁じ手判定
 */
export function validateMove(
  board: Board,
  from: Position,
  to: Position,
  player: Player
): MoveValidation {
  // 移動後に王手放置になっていないか確認
  if (wouldBeOuteHouchi(board, from, to, player)) {
    return { isValid: false, reason: '王手を解消してください' };
  }

  return { isValid: true };
}
