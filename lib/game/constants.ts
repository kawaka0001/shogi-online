/**
 * 将棋ゲームの定数定義
 * 詳細: #4, #5
 */

import type { PieceType } from '@/types/shogi';

// ========================================
// 盤面サイズ
// ========================================

export const BOARD_SIZE = 9;
export const TOTAL_SQUARES = BOARD_SIZE * BOARD_SIZE;

// ========================================
// 敵陣の定義
// ========================================

/**
 * 先手（Black）の敵陣: 7, 8, 9段目（インデックス6, 7, 8）
 */
export const BLACK_PROMOTION_ZONE = [6, 7, 8];

/**
 * 後手（White）の敵陣: 1, 2, 3段目（インデックス0, 1, 2）
 */
export const WHITE_PROMOTION_ZONE = [0, 1, 2];

// ========================================
// 駒の点数（持将棋用）
// ========================================

export const PIECE_VALUES: Record<PieceType, number> = {
  king: 0,
  rook: 5,
  bishop: 5,
  gold: 1,
  silver: 1,
  knight: 1,
  lance: 1,
  pawn: 1,
};

/**
 * 持将棋の点数基準
 */
export const JISHOGI_POINT_THRESHOLD = 24;

// ========================================
// SFEN駒マッピング
// ========================================

/**
 * SFEN文字の型定義
 * 詳細: #18
 */
type SFENChar = 'K' | 'R' | 'B' | 'G' | 'S' | 'N' | 'L' | 'P';

/**
 * SFEN形式での駒の表記
 * 大文字: 先手（Black）
 * 小文字: 後手（White）
 * +付き: 成駒
 * 詳細: #18
 */
export const PIECE_TO_SFEN: Record<PieceType, SFENChar> = {
  king: 'K',
  rook: 'R',
  bishop: 'B',
  gold: 'G',
  silver: 'S',
  knight: 'N',
  lance: 'L',
  pawn: 'P',
};

/**
 * SFEN文字から駒の種類へのマッピング
 * 詳細: #18
 */
export const SFEN_TO_PIECE: Record<SFENChar, PieceType> = {
  K: 'king',
  R: 'rook',
  B: 'bishop',
  G: 'gold',
  S: 'silver',
  N: 'knight',
  L: 'lance',
  P: 'pawn',
};

// ========================================
// 駒の日本語表記
// ========================================

export const PIECE_NAMES_JA: Record<PieceType, { normal: string; promoted?: string }> = {
  king: { normal: '玉' },
  rook: { normal: '飛', promoted: '竜' },
  bishop: { normal: '角', promoted: '馬' },
  gold: { normal: '金' },
  silver: { normal: '銀', promoted: '成銀' },
  knight: { normal: '桂', promoted: '成桂' },
  lance: { normal: '香', promoted: '成香' },
  pawn: { normal: '歩', promoted: 'と' },
};

// ========================================
// 成れる駒
// ========================================

export const PROMOTABLE_PIECES: PieceType[] = [
  'rook',
  'bishop',
  'silver',
  'knight',
  'lance',
  'pawn',
];

// ========================================
// 強制成りの条件
// ========================================

/**
 * 最奥段で強制成りになる駒
 */
export const MUST_PROMOTE_AT_LAST_RANK: PieceType[] = ['pawn', 'lance'];

/**
 * 最奥2段で強制成りになる駒
 */
export const MUST_PROMOTE_AT_LAST_TWO_RANKS: PieceType[] = ['knight'];

// ========================================
// 初期配置（SFEN）
// ========================================

export const INITIAL_SFEN = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1';

// ========================================
// アニメーション設定
// ========================================

export const ANIMATION_DURATION = 200; // ms
export const PIECE_MOVE_DURATION = 150; // ms
