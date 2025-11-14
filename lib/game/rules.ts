/**
 * 将棋の駒の移動ルール
 * 詳細: #4, #10
 */

import type { Board, Piece, Player, Position } from '@/types/shogi';
import { isValidPosition } from '../utils/position';

// ========================================
// 飛車・角の移動ルール実装 (#10)
// ========================================

/**
 * 飛車の移動可能な位置を取得
 * - 縦横に何マスでも移動可能
 * - 他の駒を飛び越えられない
 */
export function getRookMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  const moves: Position[] = [];
  const directions = [
    { rankDelta: -1, fileDelta: 0 },  // 上
    { rankDelta: 1, fileDelta: 0 },   // 下
    { rankDelta: 0, fileDelta: -1 },  // 左
    { rankDelta: 0, fileDelta: 1 },   // 右
  ];

  // 成駒（竜王/龍）の場合は斜め1マスも追加
  if (piece.isPromoted) {
    const diagonalMoves = [
      { rankDelta: -1, fileDelta: -1 }, // 左上
      { rankDelta: -1, fileDelta: 1 },  // 右上
      { rankDelta: 1, fileDelta: -1 },  // 左下
      { rankDelta: 1, fileDelta: 1 },   // 右下
    ];

    // 斜め1マスのみ
    for (const dir of diagonalMoves) {
      const to: Position = {
        rank: from.rank + dir.rankDelta,
        file: from.file + dir.fileDelta,
      };

      if (isValidPosition(to)) {
        const targetPiece = board[to.rank][to.file];
        if (!targetPiece || targetPiece.owner !== piece.owner) {
          moves.push(to);
        }
      }
    }
  }

  // 縦横方向に何マスでも（障害物まで）
  for (const dir of directions) {
    let step = 1;
    while (true) {
      const to: Position = {
        rank: from.rank + dir.rankDelta * step,
        file: from.file + dir.fileDelta * step,
      };

      // 盤外チェック
      if (!isValidPosition(to)) break;

      const targetPiece = board[to.rank][to.file];

      // 自分の駒がある場合は移動不可
      if (targetPiece && targetPiece.owner === piece.owner) break;

      moves.push(to);

      // 相手の駒がある場合はそこで止まる
      if (targetPiece && targetPiece.owner !== piece.owner) break;

      step++;
    }
  }

  return moves;
}

/**
 * 角の移動可能な位置を取得
 * - 斜め4方向に何マスでも移動可能
 * - 他の駒を飛び越えられない
 */
export function getBishopMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  const moves: Position[] = [];
  const directions = [
    { rankDelta: -1, fileDelta: -1 }, // 左上
    { rankDelta: -1, fileDelta: 1 },  // 右上
    { rankDelta: 1, fileDelta: -1 },  // 左下
    { rankDelta: 1, fileDelta: 1 },   // 右下
  ];

  // 成駒（竜馬/馬）の場合は縦横1マスも追加
  if (piece.isPromoted) {
    const straightMoves = [
      { rankDelta: -1, fileDelta: 0 },  // 上
      { rankDelta: 1, fileDelta: 0 },   // 下
      { rankDelta: 0, fileDelta: -1 },  // 左
      { rankDelta: 0, fileDelta: 1 },   // 右
    ];

    // 縦横1マスのみ
    for (const dir of straightMoves) {
      const to: Position = {
        rank: from.rank + dir.rankDelta,
        file: from.file + dir.fileDelta,
      };

      if (isValidPosition(to)) {
        const targetPiece = board[to.rank][to.file];
        if (!targetPiece || targetPiece.owner !== piece.owner) {
          moves.push(to);
        }
      }
    }
  }

  // 斜め方向に何マスでも（障害物まで）
  for (const dir of directions) {
    let step = 1;
    while (true) {
      const to: Position = {
        rank: from.rank + dir.rankDelta * step,
        file: from.file + dir.fileDelta * step,
      };

      // 盤外チェック
      if (!isValidPosition(to)) break;

      const targetPiece = board[to.rank][to.file];

      // 自分の駒がある場合は移動不可
      if (targetPiece && targetPiece.owner === piece.owner) break;

      moves.push(to);

      // 相手の駒がある場合はそこで止まる
      if (targetPiece && targetPiece.owner !== piece.owner) break;

      step++;
    }
  }

  return moves;
}

// ========================================
// その他の駒の移動ルール（将来実装）
// ========================================

/**
 * 玉の移動可能な位置を取得
 * 全8方向に1マスずつ移動可能
 * 詳細: #9, #4
 */
export function getKingMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  const moves: Position[] = [];

  // 8方向の相対位置
  const directions = [
    { rankDelta: -1, fileDelta: 0 },  // 上
    { rankDelta: -1, fileDelta: 1 },  // 右上
    { rankDelta: 0, fileDelta: 1 },   // 右
    { rankDelta: 1, fileDelta: 1 },   // 右下
    { rankDelta: 1, fileDelta: 0 },   // 下
    { rankDelta: 1, fileDelta: -1 },  // 左下
    { rankDelta: 0, fileDelta: -1 },  // 左
    { rankDelta: -1, fileDelta: -1 }, // 左上
  ];

  for (const dir of directions) {
    const to: Position = {
      rank: from.rank + dir.rankDelta,
      file: from.file + dir.fileDelta,
    };

    if (isValidPosition(to)) {
      const targetPiece = board[to.rank][to.file];
      if (!targetPiece || targetPiece.owner !== piece.owner) {
        moves.push(to);
      }
    }
  }

  return moves;
}

/**
 * 金の移動可能な位置を取得
 * 前方3方向・左右・真後ろの計6方向に1マスずつ移動可能
 * （斜め後ろ2方向には移動不可）
 * 詳細: #9, #4
 */
export function getGoldMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  const moves: Position[] = [];

  // 金の移動方向（先手基準）
  // 先手: 上、右上、右、下、左、左上
  // 後手: 下、右下、右、上、左、右上
  const directionsBlack = [
    { rankDelta: -1, fileDelta: 0 },  // 上（前）
    { rankDelta: -1, fileDelta: 1 },  // 右上（右前）
    { rankDelta: 0, fileDelta: 1 },   // 右
    { rankDelta: 1, fileDelta: 0 },   // 下（後ろ）
    { rankDelta: 0, fileDelta: -1 },  // 左
    { rankDelta: -1, fileDelta: -1 }, // 左上（左前）
  ];

  const directionsWhite = [
    { rankDelta: 1, fileDelta: 0 },   // 下（前）
    { rankDelta: 1, fileDelta: 1 },   // 右下（右前）
    { rankDelta: 0, fileDelta: 1 },   // 右
    { rankDelta: -1, fileDelta: 0 },  // 上（後ろ）
    { rankDelta: 0, fileDelta: -1 },  // 左
    { rankDelta: 1, fileDelta: -1 },  // 左下（左前）
  ];

  const directions = piece.owner === 'black' ? directionsBlack : directionsWhite;

  for (const dir of directions) {
    const to: Position = {
      rank: from.rank + dir.rankDelta,
      file: from.file + dir.fileDelta,
    };

    if (isValidPosition(to)) {
      const targetPiece = board[to.rank][to.file];
      if (!targetPiece || targetPiece.owner !== piece.owner) {
        moves.push(to);
      }
    }
  }

  return moves;
}

/**
 * 銀の移動可能な位置を取得
 * 斜め4方向・真前の計5方向に1マスずつ移動可能
 * （左右・真後ろには移動不可）
 * 詳細: #9, #4
 */
export function getSilverMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  const moves: Position[] = [];

  // 銀の移動方向（先手基準）
  // 先手: 上、右上、右下、左下、左上
  // 後手: 下、右下、右上、左上、左下
  const directionsBlack = [
    { rankDelta: -1, fileDelta: 0 },  // 上（前）
    { rankDelta: -1, fileDelta: 1 },  // 右上
    { rankDelta: 1, fileDelta: 1 },   // 右下
    { rankDelta: 1, fileDelta: -1 },  // 左下
    { rankDelta: -1, fileDelta: -1 }, // 左上
  ];

  const directionsWhite = [
    { rankDelta: 1, fileDelta: 0 },   // 下（前）
    { rankDelta: 1, fileDelta: 1 },   // 右下
    { rankDelta: -1, fileDelta: 1 },  // 右上
    { rankDelta: -1, fileDelta: -1 }, // 左上
    { rankDelta: 1, fileDelta: -1 },  // 左下
  ];

  const directions = piece.owner === 'black' ? directionsBlack : directionsWhite;

  for (const dir of directions) {
    const to: Position = {
      rank: from.rank + dir.rankDelta,
      file: from.file + dir.fileDelta,
    };

    if (isValidPosition(to)) {
      const targetPiece = board[to.rank][to.file];
      if (!targetPiece || targetPiece.owner !== piece.owner) {
        moves.push(to);
      }
    }
  }

  return moves;
}

/**
 * 桂馬の移動可能な位置を取得
 * 前方2マス先の左右斜め（他の駒を飛び越えられる）
 * TODO: #8で実装
 */
export function getKnightMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  // TODO: #8で実装予定
  return [];
}

/**
 * 香車の移動可能な位置を取得
 * 真前に何マスでも直進可能（他の駒を飛び越えられない）
 * TODO: #8で実装
 */
export function getLanceMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  // TODO: #8で実装予定
  return [];
}

/**
 * 歩兵の移動可能な位置を取得
 * 真前に1マスのみ
 * TODO: #8で実装
 */
export function getPawnMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  // TODO: #8で実装予定
  return [];
}

// ========================================
// 統合関数
// ========================================

/**
 * 駒の種類に応じた移動可能な位置を取得
 */
export function getValidMoves(
  board: Board,
  from: Position,
  piece: Piece
): Position[] {
  // 成駒の場合、金と同じ動きをする駒（銀・桂・香・歩）
  if (piece.isPromoted && ['silver', 'knight', 'lance', 'pawn'].includes(piece.type)) {
    return getGoldMoves(board, from, piece);
  }

  switch (piece.type) {
    case 'king':
      return getKingMoves(board, from, piece);
    case 'rook':
      return getRookMoves(board, from, piece);
    case 'bishop':
      return getBishopMoves(board, from, piece);
    case 'gold':
      return getGoldMoves(board, from, piece);
    case 'silver':
      return getSilverMoves(board, from, piece);
    case 'knight':
      return getKnightMoves(board, from, piece);
    case 'lance':
      return getLanceMoves(board, from, piece);
    case 'pawn':
      return getPawnMoves(board, from, piece);
    default:
      return [];
  }
}
