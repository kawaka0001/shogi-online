/**
 * Realtime Broadcast イベント用の型ガード関数
 * 詳細: #58 Warning #6
 *
 * ランタイムで型安全性を保証し、予期しないペイロード構造によるエラーを防止
 */

import type {
  MoveEvent,
  ResignEvent,
  DrawOfferEvent,
  DrawAcceptEvent,
  DrawDeclineEvent,
} from '@/types/online-game';
import type { Move, Player } from '@/types/shogi';

/**
 * 値がオブジェクトかどうかをチェック
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 値が有効なPlayer型かどうかをチェック
 */
function isPlayer(value: unknown): value is Player {
  return value === 'black' || value === 'white';
}

/**
 * 値が有効なMove型かどうかをチェック
 */
function isMove(value: unknown): value is Move {
  if (!isObject(value)) return false;

  // type: 'move' | 'drop'
  const hasValidType = value.type === 'move' || value.type === 'drop';

  // from: Position | null (rank, fileを使用)
  const hasValidFrom =
    value.from === null ||
    (isObject(value.from) &&
      typeof value.from.rank === 'number' &&
      typeof value.from.file === 'number');

  // to: Position (rank, fileを使用)
  const hasValidTo =
    isObject(value.to) &&
    typeof value.to.rank === 'number' &&
    typeof value.to.file === 'number';

  // piece: PieceType (string)
  const hasValidPiece = typeof value.piece === 'string';

  // isPromoted: boolean
  const hasValidIsPromoted = typeof value.isPromoted === 'boolean';

  // shouldPromote: boolean
  const hasValidShouldPromote = typeof value.shouldPromote === 'boolean';

  // capturedPiece: PieceType | null
  const hasValidCapturedPiece =
    value.capturedPiece === null || typeof value.capturedPiece === 'string';

  // timestamp: Date | string
  const hasValidTimestamp =
    value.timestamp instanceof Date || typeof value.timestamp === 'string';

  return (
    hasValidType &&
    hasValidFrom &&
    hasValidTo &&
    hasValidPiece &&
    hasValidIsPromoted &&
    hasValidShouldPromote &&
    hasValidCapturedPiece &&
    hasValidTimestamp
  );
}

/**
 * 共通フィールドの型チェック（type, playerId, player, timestamp）
 */
function hasCommonEventFields(
  payload: unknown,
  expectedType: string
): payload is {
  type: string;
  playerId: string;
  player: Player;
  timestamp: string;
} {
  if (!isObject(payload)) return false;

  return (
    payload.type === expectedType &&
    typeof payload.playerId === 'string' &&
    payload.playerId.length > 0 &&
    isPlayer(payload.player) &&
    typeof payload.timestamp === 'string' &&
    payload.timestamp.length > 0
  );
}

/**
 * MoveEvent型ガード
 */
export function isMoveEvent(payload: unknown): payload is MoveEvent {
  if (!hasCommonEventFields(payload, 'move')) return false;

  return isObject(payload) && 'move' in payload && isMove(payload.move);
}

/**
 * ResignEvent型ガード
 */
export function isResignEvent(payload: unknown): payload is ResignEvent {
  return hasCommonEventFields(payload, 'resign');
}

/**
 * DrawOfferEvent型ガード
 */
export function isDrawOfferEvent(payload: unknown): payload is DrawOfferEvent {
  return hasCommonEventFields(payload, 'draw_offer');
}

/**
 * DrawAcceptEvent型ガード
 */
export function isDrawAcceptEvent(payload: unknown): payload is DrawAcceptEvent {
  return hasCommonEventFields(payload, 'draw_accept');
}

/**
 * DrawDeclineEvent型ガード
 */
export function isDrawDeclineEvent(payload: unknown): payload is DrawDeclineEvent {
  return hasCommonEventFields(payload, 'draw_decline');
}
