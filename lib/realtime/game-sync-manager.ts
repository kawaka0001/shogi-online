/**
 * ゲーム同期管理クラス
 * Realtime Broadcastを使用してゲーム状態を同期
 * 詳細: #21 (オンライン対戦機能)
 */

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type {
  RealtimeEvent,
  RealtimeEventType,
  MoveEvent,
  ResignEvent,
  DrawOfferEvent,
  DrawAcceptEvent,
  DrawDeclineEvent,
  ConnectionStatus
} from '@/types/online-game';
import type { Move, Player } from '@/types/shogi';

/**
 * ゲーム同期のコールバック関数群
 */
export type GameSyncCallbacks = {
  /** 指し手イベントのハンドラ */
  onMove: (event: MoveEvent) => void;
  /** 投了イベントのハンドラ */
  onResign: (event: ResignEvent) => void;
  /** 引き分け提案イベントのハンドラ */
  onDrawOffer: () => void;
  /** 引き分け承認イベントのハンドラ */
  onDrawAccept: () => void;
  /** 引き分け拒否イベントのハンドラ */
  onDrawDecline: () => void;
  /** 接続状態変更のハンドラ */
  onConnectionChange: (status: ConnectionStatus) => void;
  /** エラーハンドラ */
  onError: (error: Error) => void;
};

/**
 * ゲーム同期を管理するクラス
 *
 * @example
 * ```typescript
 * const syncManager = new GameSyncManager(
 *   supabase,
 *   gameId,
 *   userId,
 *   {
 *     onMove: (event) => {
 *       console.log('相手の手:', event.move);
 *       applyMove(event.move);
 *     },
 *     onResign: (event) => {
 *       console.log('相手が投了しました');
 *       endGame('resignation');
 *     },
 *     onConnectionChange: (status) => {
 *       console.log('接続状態:', status);
 *     },
 *     onError: (error) => {
 *       console.error('同期エラー:', error);
 *     }
 *   }
 * );
 *
 * await syncManager.start();
 * ```
 */
export class GameSyncManager {
  private supabase: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private gameId: string;
  private userId: string;
  private callbacks: GameSyncCallbacks;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';

  /**
   * コンストラクタ
   *
   * @param supabase - Supabaseクライアント
   * @param gameId - ゲームID（UUID）
   * @param userId - プレイヤーのユーザーID
   * @param callbacks - イベントハンドラのコールバック関数群
   */
  constructor(
    supabase: SupabaseClient,
    gameId: string,
    userId: string,
    callbacks: GameSyncCallbacks
  ) {
    if (!supabase) {
      throw new Error('[GameSyncManager] Supabaseクライアントが必要です');
    }
    if (!gameId || !userId) {
      throw new Error('[GameSyncManager] gameIdとuserIdが必要です');
    }

    this.supabase = supabase;
    this.gameId = gameId;
    this.userId = userId;
    this.callbacks = callbacks;

    console.log('[GameSyncManager] 初期化完了', {
      gameId,
      userId,
    });
  }

  /**
   * Channel購読開始
   * ゲーム用のRealtimeチャンネルを作成し、イベントリスナーを登録
   */
  async start(): Promise<void> {
    try {
      console.log('[GameSyncManager] 同期開始...');

      // 既存チャンネルがあればクリーンアップ
      if (this.channel) {
        console.log('[GameSyncManager] 既存チャンネルをクリーンアップ');
        await this.stop();
      }

      // 接続状態を更新
      this.updateConnectionStatus('connecting');

      // ゲーム専用のチャンネルを作成
      const channelName = `game:${this.gameId}`;
      this.channel = this.supabase.channel(channelName);

      console.log('[GameSyncManager] チャンネル作成:', channelName);

      // Broadcastイベントハンドラを登録
      this.channel
        .on('broadcast', { event: 'move' }, (payload) => {
          this.handleBroadcast(payload.payload as RealtimeEvent);
        })
        .on('broadcast', { event: 'resign' }, (payload) => {
          this.handleBroadcast(payload.payload as RealtimeEvent);
        })
        .on('broadcast', { event: 'draw_offer' }, (payload) => {
          this.handleBroadcast(payload.payload as RealtimeEvent);
        })
        .on('broadcast', { event: 'draw_accept' }, (payload) => {
          this.handleBroadcast(payload.payload as RealtimeEvent);
        })
        .on('broadcast', { event: 'draw_decline' }, (payload) => {
          this.handleBroadcast(payload.payload as RealtimeEvent);
        });

      // チャンネル購読
      await this.channel.subscribe((status) => {
        console.log('[GameSyncManager] チャンネルステータス:', status);
        this.handleChannelStatus(status);
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[GameSyncManager] start()エラー:', err);
      this.updateConnectionStatus('error');
      this.callbacks.onError(err);
      throw err;
    }
  }

  /**
   * Channel購読停止
   * チャンネルから購読解除し、クリーンアップを実行
   */
  async stop(): Promise<void> {
    try {
      console.log('[GameSyncManager] 同期停止...');

      // 再接続タイマーをクリア
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (!this.channel) {
        console.log('[GameSyncManager] チャンネルが存在しないためスキップ');
        return;
      }

      // チャンネルunsubscribe
      await this.supabase.removeChannel(this.channel);
      console.log('[GameSyncManager] チャンネル削除完了');

      this.channel = null;
      this.reconnectAttempts = 0;
      this.updateConnectionStatus('disconnected');

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[GameSyncManager] stop()エラー:', err);
      this.callbacks.onError(err);
      throw err;
    }
  }

  /**
   * 指し手を送信
   *
   * @param move - 指し手情報
   * @param player - プレイヤー（先手/後手）
   */
  async sendMove(move: Move, player: Player): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('チャンネルが接続されていません');
      }

      const event: MoveEvent = {
        type: 'move',
        playerId: this.userId,
        player,
        move,
        timestamp: new Date().toISOString(),
      };

      console.log('[GameSyncManager] 指し手送信:', event);

      await this.channel.send({
        type: 'broadcast',
        event: 'move',
        payload: event,
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[GameSyncManager] sendMove()エラー:', err);
      this.callbacks.onError(err);
      throw err;
    }
  }

  /**
   * 投了を送信
   *
   * @param player - 投了するプレイヤー
   */
  async sendResign(player: Player): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('チャンネルが接続されていません');
      }

      const event: ResignEvent = {
        type: 'resign',
        playerId: this.userId,
        player,
        timestamp: new Date().toISOString(),
      };

      console.log('[GameSyncManager] 投了送信:', event);

      await this.channel.send({
        type: 'broadcast',
        event: 'resign',
        payload: event,
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[GameSyncManager] sendResign()エラー:', err);
      this.callbacks.onError(err);
      throw err;
    }
  }

  /**
   * 引き分け提案を送信
   *
   * @param player - 提案するプレイヤー
   */
  async sendDrawOffer(player: Player): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('チャンネルが接続されていません');
      }

      const event: DrawOfferEvent = {
        type: 'draw_offer',
        playerId: this.userId,
        player,
        timestamp: new Date().toISOString(),
      };

      console.log('[GameSyncManager] 引き分け提案送信:', event);

      await this.channel.send({
        type: 'broadcast',
        event: 'draw_offer',
        payload: event,
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[GameSyncManager] sendDrawOffer()エラー:', err);
      this.callbacks.onError(err);
      throw err;
    }
  }

  /**
   * 引き分け承認を送信
   *
   * @param player - 承認するプレイヤー
   */
  async sendDrawAccept(player: Player): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('チャンネルが接続されていません');
      }

      const event: DrawAcceptEvent = {
        type: 'draw_accept',
        playerId: this.userId,
        player,
        timestamp: new Date().toISOString(),
      };

      console.log('[GameSyncManager] 引き分け承認送信:', event);

      await this.channel.send({
        type: 'broadcast',
        event: 'draw_accept',
        payload: event,
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[GameSyncManager] sendDrawAccept()エラー:', err);
      this.callbacks.onError(err);
      throw err;
    }
  }

  /**
   * 引き分け拒否を送信
   *
   * @param player - 拒否するプレイヤー
   */
  async sendDrawDecline(player: Player): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('チャンネルが接続されていません');
      }

      const event: DrawDeclineEvent = {
        type: 'draw_decline',
        playerId: this.userId,
        player,
        timestamp: new Date().toISOString(),
      };

      console.log('[GameSyncManager] 引き分け拒否送信:', event);

      await this.channel.send({
        type: 'broadcast',
        event: 'draw_decline',
        payload: event,
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[GameSyncManager] sendDrawDecline()エラー:', err);
      this.callbacks.onError(err);
      throw err;
    }
  }

  /**
   * Broadcastイベントハンドラ
   * 受信したイベントの種類に応じて適切なコールバックを実行
   *
   * @param payload - 受信したイベントペイロード
   */
  private handleBroadcast(payload: RealtimeEvent): void {
    try {
      console.log('[GameSyncManager] Broadcastイベント受信:', payload);

      // 自分が送信したイベントは無視
      if ('playerId' in payload && payload.playerId === this.userId) {
        console.log('[GameSyncManager] 自分のイベントのため無視');
        return;
      }

      // イベントタイプに応じてコールバック実行
      switch (payload.type) {
        case 'move':
          this.callbacks.onMove(payload as MoveEvent);
          break;
        case 'resign':
          this.callbacks.onResign(payload as ResignEvent);
          break;
        case 'draw_offer':
          this.callbacks.onDrawOffer();
          break;
        case 'draw_accept':
          this.callbacks.onDrawAccept();
          break;
        case 'draw_decline':
          this.callbacks.onDrawDecline();
          break;
        default:
          console.warn('[GameSyncManager] 未知のイベントタイプ:', payload);
      }

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[GameSyncManager] handleBroadcast()エラー:', err);
      this.callbacks.onError(err);
    }
  }

  /**
   * チャンネルステータスハンドラ
   * チャンネルの接続状態を監視し、必要に応じて再接続を実行
   *
   * @param status - チャンネルステータス
   */
  private handleChannelStatus(status: string): void {
    switch (status) {
      case 'SUBSCRIBED':
        console.log('[GameSyncManager] チャンネル接続成功');
        this.reconnectAttempts = 0;
        this.updateConnectionStatus('connected');
        break;

      case 'CLOSED':
        console.log('[GameSyncManager] チャンネル切断');
        this.updateConnectionStatus('disconnected');
        this.reconnect();
        break;

      case 'CHANNEL_ERROR':
        console.error('[GameSyncManager] チャンネルエラー');
        this.updateConnectionStatus('error');
        this.reconnect();
        break;

      case 'TIMED_OUT':
        console.error('[GameSyncManager] チャンネルタイムアウト');
        this.updateConnectionStatus('disconnected');
        this.reconnect();
        break;

      default:
        console.log('[GameSyncManager] チャンネルステータス:', status);
    }
  }

  /**
   * 接続状態を更新し、コールバックを実行
   *
   * @param status - 新しい接続状態
   */
  private updateConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      console.log('[GameSyncManager] 接続状態変更:', status);
      this.callbacks.onConnectionChange(status);
    }
  }

  /**
   * 再接続処理
   * 指数バックオフを使用して再接続を試行
   */
  private async reconnect(): Promise<void> {
    try {
      // 最大試行回数を超えた場合はエラー
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        const error = new Error('再接続の最大試行回数を超えました');
        console.error('[GameSyncManager]', error);
        this.updateConnectionStatus('error');
        this.callbacks.onError(error);
        return;
      }

      this.reconnectAttempts++;
      this.updateConnectionStatus('reconnecting');

      // 指数バックオフ: 2^n * 1000ms (最大30秒)
      const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000);

      console.log(`[GameSyncManager] ${delay}ms後に再接続を試行します (試行 ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      // 既存のタイマーをクリア
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      // 再接続タイマーを設定
      this.reconnectTimeout = setTimeout(async () => {
        console.log('[GameSyncManager] 再接続を実行...');

        // 既存チャンネルをクリーンアップ
        if (this.channel) {
          await this.supabase.removeChannel(this.channel);
          this.channel = null;
        }

        // 再接続
        await this.start();
      }, delay);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[GameSyncManager] reconnect()エラー:', err);
      this.updateConnectionStatus('error');
      this.callbacks.onError(err);
    }
  }

  /**
   * 現在の接続状態を取得
   *
   * @returns 現在の接続状態
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * チャンネルが接続されているかどうかを確認
   *
   * @returns 接続されている場合はtrue
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }
}