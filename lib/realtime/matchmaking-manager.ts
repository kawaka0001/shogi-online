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
  private myJoinedAt: string = ''; // 自分が参加した時刻

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
        joinedAt: (this.myJoinedAt = new Date().toISOString()),
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

      // 全プレイヤーを取得（自分を除く）
      const allPlayers = this.getAllPlayers(state);
      console.log('[MatchmakingManager] 待機中のプレイヤー:', allPlayers);

      // 状態変更コールバック
      this.callbacks.onStateChange?.(allPlayers);

      // マッチング判定
      this.findOpponent(allPlayers);
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
      const allPlayers = this.getAllPlayers(state);

      // 状態変更コールバック
      this.callbacks.onStateChange?.(allPlayers);

      // マッチング判定
      this.findOpponent(allPlayers);
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
      const allPlayers = this.getAllPlayers(state);

      // 状態変更コールバック
      this.callbacks.onStateChange?.(allPlayers);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[MatchmakingManager] handleLeave()エラー:', err);
      this.callbacks.onError?.(err);
    }
  }

  /**
   * 対戦相手を検索してマッチングを試みる
   *
   * マッチング条件:
   * 1. 自分以外のプレイヤー
   * 2. status = 'searching'
   * 3. スキルレベル差が±200以内
   * 4. タイムスタンプ（joinedAt）が最も早い相手（FIFO）
   *
   * @param players - 待機中の全プレイヤー
   */
  private async findOpponent(players: PlayerPresence[]): Promise<void> {
    // 既にマッチング済み、または処理中の場合はスキップ
    if (this.isMatched || this.matchingLock) {
      console.log('[MatchmakingManager] マッチング処理スキップ（既に処理中）');
      return;
    }

    try {
      this.matchingLock = true; // ロック取得

      // マッチング候補をフィルタリング
      const candidates = players.filter((player) => {
        // 自分を除外
        if (player.userId === this.userId) return false;

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

      // 自分が後から参加した場合は相手がゲームを作るまで待つ
      const myJoinedAtTime = new Date(this.myJoinedAt).getTime();
      const opponentJoinedAtTime = new Date(opponent.joinedAt).getTime();

      if (myJoinedAtTime > opponentJoinedAtTime) {
        console.log(
          '[MatchmakingManager] 相手が先に参加しているため、相手がゲームを作成するまで待機'
        );
        this.matchingLock = false;
        return;
      }

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

      // 初期盤面（#6で定義された初期配置）
      const initialBoard = this.getInitialBoard();

      // gamesテーブルにレコード作成
      const { data: game, error } = await this.supabase
        .from('games')
        .insert({
          black_player_id: blackPlayerId,
          white_player_id: whitePlayerId,
          board_state: initialBoard,
          current_turn: blackPlayerId, // 先手が最初
          status: 'playing',
          moves: [],
        })
        .select()
        .single();

      if (error) {
        throw new Error(`ゲーム作成エラー: ${error.message}`);
      }

      console.log('[MatchmakingManager] ゲーム作成成功:', game);

      // マッチング結果を通知
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
   * Presence Stateから全プレイヤーを取得（自分を除く）
   *
   * @param state - Presenceの状態オブジェクト
   * @returns 全プレイヤーのPresence情報の配列
   */
  private getAllPlayers(
    state: Record<string, PlayerPresence[]>
  ): PlayerPresence[] {
    const players: PlayerPresence[] = [];

    Object.entries(state).forEach(([key, presences]) => {
      // 複数デバイスからのアクセスに対応（最初のPresenceのみ使用）
      if (presences.length > 0) {
        const player = presences[0];
        // 自分を除外
        if (player.userId !== this.userId) {
          players.push(player);
        }
      }
    });

    return players;
  }

  /**
   * 初期盤面を取得
   * TODO: #6で定義された初期配置ロジックを使用する
   *
   * @returns 初期盤面のJSON
   */
  private getInitialBoard(): Json {
    // 暫定実装：空の盤面
    // 本実装では lib/game/board.ts などから初期配置を取得する
    return {
      pieces: [
        // 9x9の盤面配置
        // 詳細は #6 で実装
      ],
      capturedPieces: {
        black: [],
        white: [],
      },
    };
  }
}
