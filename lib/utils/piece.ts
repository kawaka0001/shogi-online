/**
 * 駒関連のユーティリティ関数
 * 詳細: #5
 */

import type { Piece, PieceType, Player } from '@/types/shogi';
import { PIECE_NAMES_JA, PROMOTABLE_PIECES } from '../game/constants';

/**
 * 駒の表示名を取得（日本語）
 */
export function getPieceName(piece: Piece): string {
  const names = PIECE_NAMES_JA[piece.type];
  if (piece.isPromoted && names.promoted) {
    return names.promoted;
  }
  return names.normal;
}

/**
 * 駒が成れるかどうかを判定
 */
export function canPromote(pieceType: PieceType): boolean {
  return PROMOTABLE_PIECES.includes(pieceType);
}

/**
 * 駒のコピーを作成
 */
export function copyPiece(piece: Piece): Piece {
  return {
    type: piece.type,
    owner: piece.owner,
    isPromoted: piece.isPromoted,
  };
}

/**
 * 相手のプレイヤーを取得
 */
export function getOpponent(player: Player): Player {
  return player === 'black' ? 'white' : 'black';
}

/**
 * プレイヤーの日本語名を取得
 */
export function getPlayerName(player: Player): string {
  return player === 'black' ? '先手' : '後手';
}
