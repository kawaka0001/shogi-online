// Realtime Presenceベースのマッチング機能の型定義
// 詳細: #54

import type { RealtimePresenceState } from '@supabase/realtime-js'

/**
 * Presenceチャンネルで共有するプレイヤー情報
 * Realtime Presenceの`track()`メソッドで送信される
 */
export type PlayerPresence = {
  /** ユーザーID（UUID形式） */
  userId: string

  /** ユーザー名 */
  username: string

  /** マッチングステータス
   * - 'searching': マッチング待機中
   * - 'matched': マッチング完了
   * - 'cancelled': キャンセル
   */
  status: 'searching' | 'matched' | 'cancelled'

  /** スキルレベル（デフォルト1500）
   * 将来的なランクマッチング機能用に予約
   * ELOレーティングシステムを想定
   */
  skillLevel: number

  /** Presenceチャンネルへの参加タイムスタンプ（ISO 8601形式）
   * FIFO順でのマッチング判定に使用
   */
  joinedAt: string
}

/**
 * Realtime Presenceの状態全体
 * キー: userId
 * 値: PlayerPresenceの配列（複数デバイスからのアクセス対応）
 */
export type MatchmakingState = RealtimePresenceState<PlayerPresence>

/**
 * マッチング成立時の結果情報
 * ゲーム作成時に必要な対戦相手の情報を保持
 */
export type MatchResult = {
  /** 対戦相手のユーザーID */
  opponentId: string

  /** 対戦相手の情報（Presenceから取得） */
  opponent: PlayerPresence

  /** 作成されたゲームID（null=まだゲーム未作成） */
  gameId: string | null
}

/**
 * useMatchmakingフックの戻り値の型
 * マッチング処理の全ての状態と操作メソッドを提供
 */
export type UseMatchmakingReturn = {
  /** 現在Presenceにいるプレイヤー一覧（自分を除く） */
  players: PlayerPresence[]

  /** マッチング成立時の結果（null=未成立） */
  matchResult: MatchResult | null

  /** マッチング待機中フラグ */
  isSearching: boolean

  /** エラーメッセージ（null=エラーなし）
   * ネットワークエラーやマッチング失敗時に設定
   */
  error: string | null

  /** マッチング待機を開始する関数
   * 自分のPresenceを'searching'ステータスで送信
   * @throws エラーが発生した場合、errorフィールドに設定
   */
  startSearch: () => Promise<void>

  /** マッチング待機をキャンセルする関数
   * 自分のPresenceを'cancelled'ステータスに更新
   * Presenceチャンネルからアンサブスクライブ
   * @throws エラーが発生した場合、errorフィールドに設定
   */
  cancelSearch: () => Promise<void>
}

/**
 * Presenceチャンネル設定オプション
 * 詳細: #54
 */
export type MatchmakingChannelConfig = {
  /** チャンネル名（固定: 'matchmaking'） */
  channelName: 'matchmaking'

  /** Presenceキー（通常はuserId） */
  presenceKey: string

  /** Presenceのブロードキャストオプション */
  config: {
    presence: {
      key: string
    }
  }
}

/**
 * マッチング検索のフィルター条件（将来的な拡張用）
 * ランクマッチングやカスタムルーム機能で使用予定
 */
export type MatchmakingFilter = {
  /** 最小スキルレベル */
  minSkillLevel?: number

  /** 最大スキルレベル */
  maxSkillLevel?: number

  /** スキルレベルマッチングの許容範囲（デフォルト: 200） */
  skillLevelRange?: number

  /** タイムアウト時間（ミリ秒、デフォルト: 30000） */
  timeoutMs?: number
}

/**
 * MatchmakingManagerのコールバック関数群
 * 詳細: #54
 */
export type MatchmakingCallbacks = {
  /** Presenceの状態変更時に呼ばれる */
  onStateChange?: (players: PlayerPresence[]) => void

  /** マッチング成立時に呼ばれる */
  onMatch?: (result: MatchResult) => void

  /** エラー発生時に呼ばれる */
  onError?: (error: Error) => void
}
