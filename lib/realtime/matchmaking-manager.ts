// Realtime Presenceを使ったマッチング管理クラス
// 詳細: #54

import type { SupabaseClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/realtime-js';
import type { Database, Json } from '@/types/database';
import type {
  PlayerPresence,
  MatchResult,
  MatchmakingCallbacks,
} from '@/types/matchmaking';
import { createInitialGameState } from '@/lib/game/initial-state';

/**
 * Realtime Presenceを管理し、マッチング処理を行うクラス
 *
 * @example
 * ```typescript
 * const manager = new MatchmakingManager(
 *   supabase,
 *   userId,
 *   username,
 *   1500
 * );
 *
 * await manager.start({
 *   onMatch: (result) => {
 *     console.log('マッチング成立!', result);
 *     router.push(`/game/${result.gameId}`);
 *   },
 *   onStateChange: (players) => {
 *     console.log(`待機中: ${players.length}人`);
 *   },
 *   onError: (error) => {
 *     console.error('エラー:', error);
 *   }
 * });
 * ```
 */
export class MatchmakingManager {
  private supabase: SupabaseClient<Database>;
  private userId: string;
  private username: string;
  private skillLevel: number;
  private channel: RealtimeChannel | null = null;
  private callbacks: MatchmakingCallbacks = {};
  private isMatched = false;
  private matchingLock = false; // マッチング処理の排他制御

  /**
   * コンストラクタ
   *
   * @param supabase - Supabaseクライアント
   * @param userId - ユーザーID（UUID）
   * @param username - ユーザー名
   * @param skillLevel - スキルレベル（デフォルト1500）
   */
  constructor(
    supabase: SupabaseClient<Database>,
    userId: string,
    username: string,
    skillLevel: number = 1500
  ) {
    if (!supabase) {
      throw new Error('[MatchmakingManager] Supabaseクライアントが必要です');
    }
    if (!userId || !username) {
      throw new Error('[MatchmakingManager] userIdとusernameが必要です');
    }

    this.supabase = supabase;
    this.userId = userId;
    this.username = username;
    this.skillLevel = skillLevel;

    console.log('[MatchmakingManager] 初期化完了', {
      userId,
      username,
      skillLevel,
    });
  }

  /**
   * マッチング開始
   * Presenceチャンネルに接続し、自分の状態をbroadcast
   *
   * @param callbacks - イベントハンドラのコールバック関数群
   */
  async start(callbacks: MatchmakingCallbacks = {}): Promise<void> {
    try {
      console.log('[MatchmakingManager] マッチング開始...');

      this.callbacks = callbacks;
      this.isMatched = false;
      this.matchingLock = false;

      // 既存チャンネルがあればクリーンアップ
      if (this.channel) {
        console.log('[MatchmakingManager] 既存チャンネルをクリーンアップ');
        await this.stop();
      }

      // Presenceチャンネル作成
      this.channel = this.supabase.channel('matchmaking', {
        config: {
          presence: {
            key: this.userId,
          },
        },
      });

      // 自分の状態をtrack
      const presence: PlayerPresence = {
        userId: this.userId,
        username: this.username,
        status: 'searching',
        skillLevel: this.skillLevel,
        joinedAt: new Date().toISOString(),
      };

      console.log('[MatchmakingManager] Presence送信:', presence);

      // イベントリスナー登録
      this.channel
        .on('presence', { event: 'sync' }, () => this.handleSync())
        .on('presence', { event: 'join' }, ({ key, newPresences }) =>
          this.handleJoin(key, newPresences)
        )
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) =>
          this.handleLeave(key, leftPresences)
        )
        .on('broadcast', { event: 'game_created' }, ({ payload }) =>
          this.handleGameCreated(payload)
        );

      // チャンネル購読とPresence送信
      await this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[MatchmakingManager] チャンネル購読成功');
          await this.channel!.track(presence);
          console.log('[MatchmakingManager] Presence送信完了');
        } else if (status === 'CHANNEL_ERROR') {
          const error = new Error('チャンネル購読エラー');
          console.error('[MatchmakingManager]', error);
          this.callbacks.onError?.(error);
        } else if (status === 'TIMED_OUT') {
          const error = new Error('チャンネル購読タイムアウト');
          console.error('[MatchmakingManager]', error);
          this.callbacks.onError?.(error);
        }
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[MatchmakingManager] start()エラー:', err);
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * マッチング停止
   * Presenceからuntrackし、チャンネルをunsubscribe
   */
  async stop(): Promise<void> {
    try {
      console.log('[MatchmakingManager] マッチング停止...');

      if (!this.channel) {
        console.log('[MatchmakingManager] チャンネルが存在しないためスキップ');
        return;
      }

      // Presenceからuntrack
      await this.channel.untrack();
      console.log('[MatchmakingManager] untrack完了');

      // チャンネルunsubscribe
      await this.supabase.removeChannel(this.channel);
      console.log('[MatchmakingManager] チャンネル削除完了');

      this.channel = null;
      this.isMatched = false;
      this.matchingLock = false;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[MatchmakingManager] stop()エラー:', err);
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Presence同期イベントハンドラ
   * Presenceの全体状態が変更されたときに呼ばれる
   */
  private handleSync(): void {
    if (!this.channel || this.isMatched) return;

    try {
      const state = this.channel.presenceState<PlayerPresence>();
      console.log('[MatchmakingManager] Presence同期:', state);

      // UI表示用: 全プレイヤー（自分を含む）
      const allPlayersIncludingSelf = this.getAllPlayersIncludingSelf(state);
      console.log('[MatchmakingManager] 全プレイヤー（自分含む）:', allPlayersIncludingSelf);

      // 状態変更コールバック（UI表示用）
      this.callbacks.onStateChange?.(allPlayersIncludingSelf);

      // マッチングロジック用: 対戦相手候補のみ（自分を除く）
      const opponentCandidates = this.getOpponentCandidates(state);
      console.log('[MatchmakingManager] 対戦相手候補:', opponentCandidates);

      // マッチング判定
      this.findOpponent(opponentCandidates);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[MatchmakingManager] handleSync()エラー:', err);
      this.callbacks.onError?.(err);
    }
  }

  /**
   * Presence Join イベントハンドラ
   * 新規プレイヤーが参加したときに呼ばれる
   */
  private handleJoin(key: string, newPresences: unknown[]): void {
    if (!this.channel || this.isMatched) return;

    try {
      console.log('[MatchmakingManager] プレイヤー参加:', {
        key,
        newPresences,
      });

      const state = this.channel.presenceState<PlayerPresence>();

      // UI表示用: 全プレイヤー（自分を含む）
      const allPlayersIncludingSelf = this.getAllPlayersIncludingSelf(state);

      // 状態変更コールバック（UI表示用）
      this.callbacks.onStateChange?.(allPlayersIncludingSelf);

      // マッチングロジック用: 対戦相手候補のみ（自分を除く）
      const opponentCandidates = this.getOpponentCandidates(state);

      // マッチング判定
      this.findOpponent(opponentCandidates);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[MatchmakingManager] handleJoin()エラー:', err);
      this.callbacks.onError?.(err);
    }
  }

  /**
   * Presence Leave イベントハンドラ
   * プレイヤーが退出したときに呼ばれる
   */
  private handleLeave(key: string, leftPresences: unknown[]): void {
    if (!this.channel) return;

    try {
      console.log('[MatchmakingManager] プレイヤー退出:', {
        key,
        leftPresences,
      });

      const state = this.channel.presenceState<PlayerPresence>();

      // UI表示用: 全プレイヤー（自分を含む）
      const allPlayersIncludingSelf = this.getAllPlayersIncludingSelf(state);

      // 状態変更コールバック（UI表示用）
      this.callbacks.onStateChange?.(allPlayersIncludingSelf);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[MatchmakingManager] handleLeave()エラー:', err);
      this.callbacks.onError?.(err);
    }
  }

  /**
   * ゲーム作成通知ハンドラ（Broadcast経由）
   * 相手プレイヤーがゲームを作成したときに呼ばれる
   */
  private handleGameCreated(payload: any): void {
    // 既にマッチング済みの場合はスキップ
    if (this.isMatched) {
      console.log('[MatchmakingManager] 既にマッチング済みのため無視');
      return;
    }

    try {
      console.log('[MatchmakingManager] ゲーム作成通知受信:', payload);

      // このプレイヤーが対戦相手かどうか確認
      if (
        payload.blackPlayerId !== this.userId &&
        payload.whitePlayerId !== this.userId
      ) {
        console.log('[MatchmakingManager] 自分のマッチングではないため無視');
        return;
      }

      // マッチング結果を構築
      const opponentId =
        payload.blackPlayerId === this.userId
          ? payload.whitePlayerId
          : payload.blackPlayerId;

      const matchResult: MatchResult = {
        opponentId,
        opponent: {
          userId: opponentId,
          username: 'Opponent', // TODO: Presenceから取得できるようにする
          status: 'matched',
          skillLevel: 1500, // TODO: Presenceから取得できるようにする
          joinedAt: new Date().toISOString(),
        },
        gameId: payload.gameId,
      };

      this.isMatched = true;
      this.callbacks.onMatch?.(matchResult);

      // Presenceをmatched状態に更新
      this.channel?.track({
        userId: this.userId,
        username: this.username,
        status: 'matched' as const,
        skillLevel: this.skillLevel,
        joinedAt: new Date().toISOString(),
      });

      console.log('[MatchmakingManager] マッチング完了（Broadcast経由）!', matchResult);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[MatchmakingManager] handleGameCreated()エラー:', err);
      this.callbacks.onError?.(err);
    }
  }

  /**
   * 対戦相手を検索してマッチングを試みる
   *
   * マッチング条件:
   * 1. status = 'searching'
   * 2. スキルレベル差が±200以内
   * 3. タイムスタンプ（joinedAt）が最も早い相手（FIFO）
   *
   * @param opponentCandidates - 対戦相手候補（自分を除く）
   */
  private async findOpponent(opponentCandidates: PlayerPresence[]): Promise<void> {
    // 既にマッチング済み、または処理中の場合はスキップ
    if (this.isMatched || this.matchingLock) {
      console.log('[MatchmakingManager] マッチング処理スキップ（既に処理中）');
      return;
    }

    try {
      this.matchingLock = true; // ロック取得

      // マッチング候補をフィルタリング
      const candidates = opponentCandidates.filter((player) => {
        // status = 'searching' のみ
        if (player.status !== 'searching') return false;

        // スキルレベル差が±200以内
        const skillDiff = Math.abs(player.skillLevel - this.skillLevel);
        if (skillDiff > 200) return false;

        return true;
      });

      console.log('[MatchmakingManager] マッチング候補:', candidates);

      if (candidates.length === 0) {
        console.log('[MatchmakingManager] マッチング相手なし');
        this.matchingLock = false;
        return;
      }

      // タイムスタンプ昇順（FIFO）でソート
      const sortedCandidates = candidates.sort((a, b) => {
        const timeA = new Date(a.joinedAt).getTime();
        const timeB = new Date(b.joinedAt).getTime();
        return timeA - timeB;
      });

      // 最も早く参加した相手
      const opponent = sortedCandidates[0];
      console.log('[MatchmakingManager] マッチング相手決定:', opponent);

      // UUID辞書順で役割分担（2025年的なアプローチ: クライアント時計に依存しない）
      // 小さいUUIDを持つ方がゲーム作成を担当
      const shouldCreateGame = this.userId < opponent.userId;

      if (!shouldCreateGame) {
        console.log(
          '[MatchmakingManager] 相手（UUID優先）がゲームを作成します。待機中...'
        );
        this.matchingLock = false;
        return;
      }

      console.log('[MatchmakingManager] このクライアントがゲームを作成します');

      // ゲーム作成（先に参加した方が作成）
      await this.createGame(opponent);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[MatchmakingManager] findOpponent()エラー:', err);
      this.callbacks.onError?.(err);
      this.matchingLock = false;
    }
  }

  /**
   * ゲームを作成してマッチング成立
   *
   * @param opponent - 対戦相手のPresence情報
   */
  private async createGame(opponent: PlayerPresence): Promise<void> {
    try {
      console.log('[MatchmakingManager] ゲーム作成開始...');

      // 先手（黒）・後手（白）をランダムに決定
      const isBlackPlayer = Math.random() < 0.5;
      const blackPlayerId = isBlackPlayer ? this.userId : opponent.userId;
      const whitePlayerId = isBlackPlayer ? opponent.userId : this.userId;

      // 初期盤面（#4, #5で定義された初期配置）
      const initialGameState = createInitialGameState();
      const initialBoardState = {
        board: initialGameState.board,
        captured: initialGameState.captured,
        gameStatus: initialGameState.gameStatus,
        isCheck: initialGameState.isCheck,
        lastMove: initialGameState.lastMove,
      };

      // gamesテーブルにレコード作成
      const { data: game, error } = await this.supabase
        .from('games')
        .insert({
          black_player_id: blackPlayerId,
          white_player_id: whitePlayerId,
          board_state: initialBoardState as Json,
          current_turn: 'black', // 先手（黒）が最初
          status: 'active', // ゲーム進行中
          moves: [],
        })
        .select()
        .single();

      if (error) {
        throw new Error(`ゲーム作成エラー: ${error.message}`);
      }

      console.log('[MatchmakingManager] ゲーム作成成功:', game);

      // 相手プレイヤーにゲーム作成を通知（Broadcast）
      await this.channel?.send({
        type: 'broadcast',
        event: 'game_created',
        payload: {
          gameId: game.id,
          blackPlayerId,
          whitePlayerId,
          createdBy: this.userId,
        },
      });

      console.log('[MatchmakingManager] ゲーム作成通知をBroadcast送信');

      // マッチング結果を通知（自分用）
      const matchResult: MatchResult = {
        opponentId: opponent.userId,
        opponent,
        gameId: game.id,
      };

      this.isMatched = true;
      this.callbacks.onMatch?.(matchResult);

      // Presenceをmatched状態に更新
      await this.channel?.track({
        userId: this.userId,
        username: this.username,
        status: 'matched' as const,
        skillLevel: this.skillLevel,
        joinedAt: new Date().toISOString(),
      });

      console.log('[MatchmakingManager] マッチング完了!', matchResult);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[MatchmakingManager] createGame()エラー:', err);
      this.callbacks.onError?.(err);
      throw err;
    } finally {
      this.matchingLock = false;
    }
  }

  /**
   * Presence Stateから全プレイヤーを取得（自分を含む）
   * UI表示用（「現在 X 人が待機中です」の表示に使用）
   *
   * @param state - Presenceの状態オブジェクト
   * @returns 全プレイヤーのPresence情報の配列（自分を含む）
   */
  private getAllPlayersIncludingSelf(
    state: Record<string, PlayerPresence[]>
  ): PlayerPresence[] {
    const players: PlayerPresence[] = [];

    Object.entries(state).forEach(([key, presences]) => {
      // 複数デバイスからのアクセスに対応（最初のPresenceのみ使用）
      if (presences.length > 0) {
        players.push(presences[0]);
      }
    });

    return players;
  }

  /**
   * Presence Stateから対戦相手候補を取得（自分を除く）
   * マッチングロジック用（対戦相手の検索に使用）
   *
   * @param state - Presenceの状態オブジェクト
   * @returns 対戦相手候補のPresence情報の配列（自分を除く）
   */
  private getOpponentCandidates(
    state: Record<string, PlayerPresence[]>
  ): PlayerPresence[] {
    const players: PlayerPresence[] = [];

    Object.entries(state).forEach(([key, presences]) => {
      // 複数デバイスからのアクセスに対応（最初のPresenceのみ使用）
      if (presences.length > 0) {
        const player = presences[0];
        // 自分を除外（マッチング対象外）
        if (player.userId !== this.userId) {
          players.push(player);
        }
      }
    });

    return players;
  }

}
