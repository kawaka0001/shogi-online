/**
 * オンライン対戦用の型定義
 * 詳細: #21
 */

import { GameState, Move, Player } from './shogi';
import type { Database } from './database';

// ========================================
// データベース関連型
// ========================================

/**
 * gamesテーブルのRow型
 */
export type GameRow = Database['public']['Tables']['games']['Row'];

/**
 * gamesテーブルのInsert型
 */
export type GameInsert = Database['public']['Tables']['games']['Insert'];

/**
 * gamesテーブルのUpdate型
 */
export type GameUpdate = Database['public']['Tables']['games']['Update'];

// ========================================
// オンラインゲーム状態
// ========================================

/**
 * オンラインゲームの追加情報
 */
export type OnlineGameInfo = {
  gameId: string;                    // ゲーム識別子（UUID）
  myPlayer: Player;                  // 自分の立場（'black' | 'white'）
  opponentId: string;                // 対戦相手のユーザーID
  opponentName: string;              // 対戦相手の名前
  isLocalGame: boolean;              // ローカルゲームかどうか
  lastSyncTime: Date | null;         // 最後の同期時刻
  isSyncing: boolean;                // 同期中かどうか
  connectionStatus: ConnectionStatus; // 接続状態
};

/**
 * オンラインゲーム全体の状態
 */
export type OnlineGameState = GameState & OnlineGameInfo;

/**
 * DBから取得した盤面状態（部分的な型定義）
 */
export type RawBoardState = {
  board?: GameState['board'];
  captured?: GameState['captured'];
  gameStatus?: GameState['gameStatus'];
  isCheck?: boolean;
  lastMove?: Move | null;
};

/**
 * DBに保存する盤面状態（UI状態を除く）
 */
export type BoardStateForDB = {
  board: GameState['board'];
  captured: GameState['captured'];
  gameStatus: GameState['gameStatus'];
  isCheck: boolean;
  lastMove: Move | null;
};

/**
 * 接続状態
 */
export type ConnectionStatus =
  | 'connecting'      // 接続中
  | 'connected'       // 接続済み
  | 'reconnecting'    // 再接続中
  | 'disconnected'    // 切断
  | 'error';          // エラー

// ========================================
// Realtimeイベント
// ========================================

/**
 * Realtime Broadcastで送受信するイベントの種類
 */
export type RealtimeEventType =
  | 'move'            // 指し手の送信
  | 'resign'          // 投了
  | 'draw_offer'      // 引き分け提案
  | 'draw_accept'     // 引き分け承認
  | 'draw_decline'    // 引き分け拒否
  | 'game_end';       // ゲーム終了

/**
 * 指し手の送信イベント
 */
export type MoveEvent = {
  type: 'move';
  playerId: string;           // プレイヤーID
  player: Player;             // プレイヤー（'black' | 'white'）
  move: Move;                 // 指し手
  timestamp: string;          // ISO 8601形式
};

/**
 * 投了イベント
 */
export type ResignEvent = {
  type: 'resign';
  playerId: string;           // 投了したプレイヤーID
  player: Player;             // プレイヤー（'black' | 'white'）
  timestamp: string;
};

/**
 * 引き分け提案イベント
 */
export type DrawOfferEvent = {
  type: 'draw_offer';
  playerId: string;
  player: Player;
  timestamp: string;
};

/**
 * 引き分け承認イベント
 */
export type DrawAcceptEvent = {
  type: 'draw_accept';
  playerId: string;
  player: Player;
  timestamp: string;
};

/**
 * 引き分け拒否イベント
 */
export type DrawDeclineEvent = {
  type: 'draw_decline';
  playerId: string;
  player: Player;
  timestamp: string;
};

/**
 * ゲーム終了イベント
 */
export type GameEndEvent = {
  type: 'game_end';
  winnerId: string | null;    // 勝者ID（null = 引き分け）
  reason: 'checkmate' | 'resignation' | 'timeout' | 'draw';
  timestamp: string;
};

/**
 * Realtimeイベントの統合型
 */
export type RealtimeEvent =
  | MoveEvent
  | ResignEvent
  | DrawOfferEvent
  | DrawAcceptEvent
  | DrawDeclineEvent
  | GameEndEvent;

// ========================================
// Realtime Broadcastペイロード
// ========================================

/**
 * Realtime Broadcastのペイロード型
 */
export type BroadcastPayload = {
  event: RealtimeEventType;
  payload: RealtimeEvent;
};

// ========================================
// エラー関連
// ========================================

/**
 * オンラインゲームのエラー種類
 */
export type OnlineGameErrorType =
  | 'sync_failed'           // 同期失敗
  | 'connection_lost'       // 接続切断
  | 'invalid_move'          // 不正な手
  | 'game_not_found'        // ゲームが見つからない
  | 'unauthorized'          // 権限なし
  | 'opponent_disconnected' // 対戦相手が切断
  | 'timeout';              // タイムアウト

/**
 * オンラインゲームエラー
 */
export type OnlineGameError = {
  type: OnlineGameErrorType;
  message: string;
  timestamp: Date;
  details?: unknown;
};

// ========================================
// フック・コンポーネント用の型
// ========================================

/**
 * useOnlineGameフックの戻り値
 */
export type UseOnlineGameReturn = {
  gameState: OnlineGameState | null;
  isLoading: boolean;
  error: OnlineGameError | null;
  submitMove: (move: Move) => Promise<void>;
  resign: () => Promise<void>;
  offerDraw: () => Promise<void>;
  acceptDraw: () => Promise<void>;
  declineDraw: () => Promise<void>;
};

/**
 * オンラインゲームコンポーネントのProps
 */
export type OnlineGameProps = {
  gameId: string;
};
