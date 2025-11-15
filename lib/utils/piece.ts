/**
 * 駒関連のユーティリティ関数
 * 詳細: #5, #18
 */

import type { Piece, PieceType, Player, PromotablePieceType } from '@/types/shogi';
import { PIECE_NAMES_JA, PROMOTABLE_PIECES } from '../game/constants';

/**
 * 駒の表示名を取得（日本語）
 * 詳細: #18
 */
export function getPieceName(piece: Piece): string;
export function getPieceName(pieceType: PieceType, isPromoted?: boolean): string;
export function getPieceName(pieceOrType: Piece | PieceType, isPromoted = false): string {
  let type: PieceType;
  let promoted: boolean;

  if (typeof pieceOrType === 'object' && 'type' in pieceOrType) {
    // Pieceオブジェクト
    type = pieceOrType.type;
    promoted = pieceOrType.isPromoted;
  } else {
    // PieceType
    type = pieceOrType;
    promoted = isPromoted;
  }

  const names = PIECE_NAMES_JA[type];
  return promoted && names.promoted ? names.promoted : names.normal;
}

/**
 * 成り駒の名前を取得する専用関数
 * 詳細: #18
 */
export function getPromotedPieceName(pieceType: PromotablePieceType): string {
  const names = PIECE_NAMES_JA[pieceType];
  return names.promoted!; // PromotablePieceType は必ず promoted を持つ
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
