/**
 * 将棋の駒の移動ルール
 * 詳細: #4, #8, #10
 */

import type { Board, Piece, Player, Position, PieceType } from '@/types/shogi';
import { isValidPosition } from '../utils/position';
import { validateDrop as validateDropIllegal } from './validation';

// ========================================
// 型定義
// ========================================

/**
 * 移動可能な位置のリスト
 */
export type ValidMoves = Position[];

/**
 * 移動判定結果
 */
export type MoveValidationResult = {
  isValid: boolean;
  reason?: string;
};

// ========================================
// ヘルパー関数
// ========================================

/**
 * 指定した位置に駒が存在するか確認
 */
function hasPiece(board: Board, position: Position): boolean {
  if (!isValidPosition(position)) return false;
  return board[position.rank][position.file] !== null;
}

/**
 * 指定した位置の駒が味方かどうか確認
 */
function isFriendlyPiece(board: Board, position: Position, player: Player): boolean {
  if (!isValidPosition(position)) return false;
  const piece = board[position.rank][position.file];
  return piece !== null && piece.owner === player;
}

/**
 * 指定した位置の駒が敵かどうか確認
 */
function isEnemyPiece(board: Board, position: Position, player: Player): boolean {
  if (!isValidPosition(position)) return false;
  const piece = board[position.rank][position.file];
  return piece !== null && piece.owner !== player;
}

/**
 * プレイヤーの前進方向を取得
 * 先手(black): -1 (上に進む、rankが減る)
 * 後手(white): +1 (下に進む、rankが増える)
 */
function getForwardDirection(player: Player): number {
  return player === 'black' ? -1 : 1;
}

// ========================================
// 歩・香・桂の移動ルール実装 (#8)
// ========================================

/**
 * 歩（ふ）の移動可能マスを取得
 * ルール: 1マス前進のみ
 * 詳細: #4
 */
export function getPawnMoves(
  board: Board,
  from: Position,
  piece: Piece
): ValidMoves {
  const moves: ValidMoves = [];
  const forward = getForwardDirection(piece.owner);

  // 1マス前進
  const targetRank = from.rank + forward;
  const targetFile = from.file;
  const target: Position = { rank: targetRank, file: targetFile };

  // 盤面内 && 駒がない または 敵の駒がある
  if (isValidPosition(target) && !isFriendlyPiece(board, target, piece.owner)) {
    moves.push(target);
  }

  return moves;
}

/**
 * 香（きょう）の移動可能マスを取得
 * ルール: 縦に何マスでも前進可能、他の駒を飛び越えられない
 * 詳細: #4
 */
export function getLanceMoves(
  board: Board,
  from: Position,
  piece: Piece
): ValidMoves {
  const moves: ValidMoves = [];
  const forward = getForwardDirection(piece.owner);

  // 前方に進めるだけ進む
  let currentRank = from.rank + forward;
  const currentFile = from.file;

  while (true) {
    const target: Position = { rank: currentRank, file: currentFile };

    // 盤外に出たら終了
    if (!isValidPosition(target)) break;

    // 味方の駒があったら終了
    if (isFriendlyPiece(board, target, piece.owner)) break;

    // 移動可能マスに追加
    moves.push(target);

    // 敵の駒があったらそこで終了（取れるが飛び越えられない）
    if (isEnemyPiece(board, target, piece.owner)) break;

    // 次のマスへ
    currentRank += forward;
  }

  return moves;
}

/**
 * 桂（けい）の移動可能マスを取得
 * ルール: 前方2マス先の左右斜め、他の駒を飛び越えられる
 * 詳細: #4
 */
export function getKnightMoves(
  board: Board,
  from: Position,
  piece: Piece
): ValidMoves {
  const moves: ValidMoves = [];
  const forward = getForwardDirection(piece.owner);

  // 前方2マス先の左右
  const targetRank = from.rank + forward * 2;
  const leftFile = from.file - 1;
  const rightFile = from.file + 1;

  const targets: Position[] = [
    { rank: targetRank, file: leftFile },   // 左
    { rank: targetRank, file: rightFile },  // 右
  ];

  for (const target of targets) {
    // 盤面内 && 味方の駒がない
    if (isValidPosition(target) && !isFriendlyPiece(board, target, piece.owner)) {
      moves.push(target);
    }
  }

  return moves;
}

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
      { rankDelta: 1, fileDelta: 1 },   // 右上
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

/**
 * 指定した移動が合法かどうかを判定
 *
 * @param board - 現在の盤面
 * @param from - 移動元の位置
 * @param to - 移動先の位置
 * @param player - プレイヤー
 * @returns 移動の有効性
 */
export function isValidMove(
  board: Board,
  from: Position,
  to: Position,
  player: Player
): MoveValidationResult {
  // 移動元に駒が存在するか確認
  if (!hasPiece(board, from)) {
    return { isValid: false, reason: '移動元に駒が存在しません' };
  }

  const piece = board[from.rank][from.file];
  if (!piece) {
    return { isValid: false, reason: '移動元に駒が存在しません' };
  }

  // 自分の駒かどうか確認
  if (piece.owner !== player) {
    return { isValid: false, reason: '自分の駒ではありません' };
  }

  // 移動先が盤面内か確認
  if (!isValidPosition(to)) {
    return { isValid: false, reason: '移動先が盤面外です' };
  }

  // 移動先に味方の駒がないか確認
  if (isFriendlyPiece(board, to, player)) {
    return { isValid: false, reason: '移動先に味方の駒が存在します' };
  }

  // 駒の移動ルールに従って移動可能か確認
  const validMoves = getValidMoves(board, from, piece);
  const isInValidMoves = validMoves.some(
    (move) => move.rank === to.rank && move.file === to.file
  );

  if (!isInValidMoves) {
    return { isValid: false, reason: 'その駒はそこに移動できません' };
  }

  return { isValid: true };
}

// ========================================
// 持ち駒を打つ時の判定 (#12)
// ========================================

/**
 * 指定した筋に歩が既に存在するかチェック（二歩判定）
 * 詳細: #12
 */
export function hasPawnInFile(
  board: Board,
  file: number,
  player: Player
): boolean {
  for (let rank = 0; rank < 9; rank++) {
    const piece = board[rank][file];
    if (piece && piece.owner === player && piece.type === 'pawn' && !piece.isPromoted) {
      return true;
    }
  }
  return false;
}

/**
 * 持ち駒を打つ位置が行き所のない駒にならないかチェック
 * 歩・香・桂はそれ以上進めない位置には打てない
 * 詳細: #12
 */
export function canPlacePiece(
  pieceType: PieceType,
  position: Position,
  player: Player
): MoveValidationResult {
  const forward = getForwardDirection(player);

  // 歩: 1段目（先手）または9段目（後手）には打てない
  if (pieceType === 'pawn') {
    if (player === 'black' && position.rank === 0) {
      return { isValid: false, reason: '歩を1段目には打てません（行き所のない駒）' };
    }
    if (player === 'white' && position.rank === 8) {
      return { isValid: false, reason: '歩を9段目には打てません（行き所のない駒）' };
    }
  }

  // 香: 1段目（先手）または9段目（後手）には打てない
  if (pieceType === 'lance') {
    if (player === 'black' && position.rank === 0) {
      return { isValid: false, reason: '香を1段目には打てません（行き所のない駒）' };
    }
    if (player === 'white' && position.rank === 8) {
      return { isValid: false, reason: '香を9段目には打てません（行き所のない駒）' };
    }
  }

  // 桂: 1段目・2段目（先手）または8段目・9段目（後手）には打てない
  if (pieceType === 'knight') {
    if (player === 'black' && (position.rank === 0 || position.rank === 1)) {
      return { isValid: false, reason: '桂を1・2段目には打てません（行き所のない駒）' };
    }
    if (player === 'white' && (position.rank === 7 || position.rank === 8)) {
      return { isValid: false, reason: '桂を8・9段目には打てません（行き所のない駒）' };
    }
  }

  return { isValid: true };
}

/**
 * 持ち駒を打つことができるかを判定
 * 詳細: #12
 *
 * @param board - 現在の盤面
 * @param pieceType - 打つ駒の種類
 * @param to - 打つ位置
 * @param player - プレイヤー
 * @returns 判定結果
 */
export function canDropPiece(
  board: Board,
  pieceType: PieceType,
  to: Position,
  player: Player
): MoveValidationResult {
  // 盤面内かチェック
  if (!isValidPosition(to)) {
    return { isValid: false, reason: '盤面外には打てません' };
  }

  // 空マスかチェック
  if (hasPiece(board, to)) {
    return { isValid: false, reason: '駒が既に存在する位置には打てません' };
  }

  // 行き所のない駒にならないかチェック
  const placementCheck = canPlacePiece(pieceType, to, player);
  if (!placementCheck.isValid) {
    return placementCheck;
  }

  // 二歩チェック（歩の場合のみ）
  if (pieceType === 'pawn') {
    if (hasPawnInFile(board, to.file, player)) {
      return { isValid: false, reason: '二歩は禁じ手です' };
    }
  }

  // 禁じ手チェック（打ち歩詰め、王手放置など） - 詳細: #14
  const illegalMoveCheck = validateDropIllegal(board, pieceType, to, player);
  if (!illegalMoveCheck.isValid) {
    return illegalMoveCheck;
  }

  return { isValid: true };
}

// ========================================
// 成り（Promotion）関連 (#13)
// ========================================

/**
 * 敵陣かどうかを判定
 * 先手: rank 0-2（1-3段目）
 * 後手: rank 6-8（7-9段目）
 * 詳細: #4, #13
 */
export function isEnemyTerritory(position: Position, player: Player): boolean {
  if (player === 'black') {
    // 先手の敵陣は0-2段目（上側3段）
    return position.rank >= 0 && position.rank <= 2;
  } else {
    // 後手の敵陣は6-8段目（下側3段）
    return position.rank >= 6 && position.rank <= 8;
  }
}

/**
 * 駒が成れるかどうかを判定
 * 詳細: #4, #13
 */
export function canPromote(pieceType: string, isPromoted: boolean): boolean {
  // 既に成っている駒は成れない
  if (isPromoted) return false;

  // 玉と金は成れない
  if (pieceType === 'king' || pieceType === 'gold') return false;

  // それ以外の駒（歩・香・桂・銀・飛・角）は成れる
  return ['pawn', 'lance', 'knight', 'silver', 'rook', 'bishop'].includes(pieceType);
}

/**
 * 強制的に成らなければならないかを判定
 * 歩・香: 最奥段（先手0段、後手8段）
 * 桂: 最奥2段（先手0-1段、後手7-8段）
 * 詳細: #4, #13
 */
export function mustPromote(
  pieceType: string,
  toPosition: Position,
  player: Player
): boolean {
  if (player === 'black') {
    // 先手（下から上に進む）
    if (pieceType === 'pawn' || pieceType === 'lance') {
      // 最奥段（0段目）に到達したら必ず成る
      return toPosition.rank === 0;
    }
    if (pieceType === 'knight') {
      // 最奥2段（0-1段目）に到達したら必ず成る
      return toPosition.rank <= 1;
    }
  } else {
    // 後手（上から下に進む）
    if (pieceType === 'pawn' || pieceType === 'lance') {
      // 最奥段（8段目）に到達したら必ず成る
      return toPosition.rank === 8;
    }
    if (pieceType === 'knight') {
      // 最奥2段（7-8段目）に到達したら必ず成る
      return toPosition.rank >= 7;
    }
  }

  return false;
}

/**
 * 成りの選択が可能かどうかを判定
 * 以下のいずれかの条件を満たす場合に成れる：
 * 1. 駒が敵陣に入る
 * 2. 駒が既に敵陣内にいて、敵陣内で移動する
 * 3. 駒が敵陣から出る
 * 詳細: #4, #13
 */
export function shouldOfferPromotion(
  from: Position,
  to: Position,
  piece: Piece
): boolean {
  // 成れない駒は対象外
  if (!canPromote(piece.type, piece.isPromoted)) {
    return false;
  }

  const fromInEnemyTerritory = isEnemyTerritory(from, piece.owner);
  const toInEnemyTerritory = isEnemyTerritory(to, piece.owner);

  // 敵陣に入る、敵陣内で移動する、敵陣から出る、のいずれか
  return fromInEnemyTerritory || toInEnemyTerritory;
}
