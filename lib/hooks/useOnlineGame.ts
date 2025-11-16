/**
 * オンラインゲーム用のカスタムフック
 * Supabase Realtimeを使用してゲーム状態を同期
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  OnlineGameState,
  UseOnlineGameReturn,
  OnlineGameError,
  MoveEvent,
  RealtimeEvent,
  ConnectionStatus,
  ResignEvent,
  DrawOfferEvent,
  DrawAcceptEvent,
  DrawDeclineEvent,
  GameRow,
  OnlineGameInfo
} from '@/types/online-game';
import type { Move, GameState, Player, Piece, Position, CapturablePieceType } from '@/types/shogi';
import { isCapturablePieceType } from '@/types/shogi';
import { isCheckmate } from '@/lib/game/rules';

export function useOnlineGame(gameId: string): UseOnlineGameReturn {
  // 状態管理
  const [gameState, setGameState] = useState<OnlineGameState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<OnlineGameError | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Refs
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  /**
   * エラーハンドリング用のヘルパー関数
   */
  const handleError = useCallback((type: OnlineGameError['type'], message: string, details?: unknown) => {
    const error: OnlineGameError = {
      type,
      message,
      timestamp: new Date(),
      details
    };
    setError(error);
    console.error('OnlineGame Error:', error);
  }, []);

  /**
   * ゲーム情報の取得
   */
  const fetchGameData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: gameData, error: fetchError } = await supabaseRef.current
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (fetchError) {
        handleError('game_not_found', 'ゲームが見つかりません', fetchError);
        return;
      }

      if (!gameData) {
        handleError('game_not_found', 'ゲームデータが存在しません');
        return;
      }

      // ユーザー情報の取得
      const { data: { user }, error: userError } = await supabaseRef.current.auth.getUser();

      if (userError || !user) {
        handleError('unauthorized', 'ユーザー認証が必要です', userError);
        return;
      }

      // プレイヤーの立場を判定
      const myPlayer: Player = gameData.black_player_id === user.id ? 'black' : 'white';
      const opponentId = myPlayer === 'black' ? gameData.white_player_id : gameData.black_player_id;

      // ユーザーIDを保存
      setCurrentUserId(user.id);

      // GameStateの構築
      // DBから取得したboard_stateにはUI用のフィールド（promotionState等）が含まれていないため、
      // 明示的にデフォルト値を設定する
      const rawBoardState = gameData.board_state as any;

      const boardState: GameState = {
        board: rawBoardState.board || [],
        captured: rawBoardState.captured || { black: {}, white: {} },
        currentTurn: (gameData.current_turn as Player) || 'black',
        moveHistory: gameData.moves as Move[] || [],
        gameStatus: rawBoardState.gameStatus || 'playing',
        isCheck: rawBoardState.isCheck || false,
        selectedPosition: null, // UI状態はリセット
        validMoves: [], // UI状態はリセット
        selectedCapturedPiece: null, // UI状態はリセット
        lastMove: rawBoardState.lastMove || null,
        errorMessage: null, // UI状態はリセット
        promotionState: { // UI状態はリセット
          isOpen: false,
          from: null,
          to: null,
          piece: null,
        },
      };

      // OnlineGameInfoの構築
      const onlineInfo: OnlineGameInfo = {
        gameId,
        myPlayer,
        opponentId,
        opponentName: 'Opponent', // TODO: ユーザー名を取得する場合は別途実装
        isLocalGame: false,
        lastSyncTime: new Date(),
        isSyncing: false,
        connectionStatus: 'connected'
      };

      // OnlineGameStateの構築
      const onlineGameState: OnlineGameState = {
        ...boardState,
        ...onlineInfo
      };

      setGameState(onlineGameState);
      setConnectionStatus('connected');

    } catch (err) {
      handleError('sync_failed', 'ゲームデータの取得に失敗しました', err);
    } finally {
      setIsLoading(false);
    }
  }, [gameId, handleError]);

  /**
   * 指し手の送信とDB更新
   */
  const submitMove = useCallback(async (move: Move): Promise<void> => {
    if (!gameState) {
      throw new Error('ゲーム状態が初期化されていません');
    }

    try {
      // 現在のユーザーを取得
      const { data: { user }, error: userError } = await supabaseRef.current.auth.getUser();

      if (userError || !user) {
        handleError('unauthorized', 'ユーザー認証が必要です', userError);
        throw new Error('認証エラー');
      }

      // 手番の確認
      if (gameState.myPlayer !== gameState.currentTurn) {
        handleError('invalid_move', '相手の手番です');
        throw new Error('手番エラー');
      }

      // MoveEventの作成
      const moveEvent: MoveEvent = {
        type: 'move',
        playerId: user.id,
        player: gameState.myPlayer,
        move,
        timestamp: new Date().toISOString()
      };

      // ゲーム状態の更新（ローカル）
      const newBoard = gameState.board.map(row => [...row]);
      const newCaptured = { ...gameState.captured };
      const newMoves = [...gameState.moveHistory, move];

      // 駒を打つ場合
      if (move.type === 'drop' && isCapturablePieceType(move.piece)) {
        // 持ち駒を減らす
        newCaptured[gameState.myPlayer] = {
          ...newCaptured[gameState.myPlayer],
          [move.piece]: newCaptured[gameState.myPlayer][move.piece] - 1
        };

        // 盤面に駒を配置
        newBoard[move.to.rank][move.to.file] = {
          type: move.piece,
          owner: gameState.myPlayer,
          isPromoted: false
        };
      } else if (move.from) {
        // 駒を移動する場合
        const movingPiece = newBoard[move.from.rank][move.from.file];
        if (!movingPiece) {
          throw new Error('移動元に駒がありません');
        }

        // 駒を取る場合
        if (move.capturedPiece && isCapturablePieceType(move.capturedPiece)) {
          // 成った駒は元の駒として持ち駒になる
          newCaptured[gameState.myPlayer] = {
            ...newCaptured[gameState.myPlayer],
            [move.capturedPiece]: newCaptured[gameState.myPlayer][move.capturedPiece] + 1
          };
        }

        // 駒を移動
        newBoard[move.to.rank][move.to.file] = {
          ...movingPiece,
          isPromoted: movingPiece.isPromoted || move.shouldPromote
        };
        newBoard[move.from.rank][move.from.file] = null;
      }

      // 次のプレイヤー
      const nextPlayer: Player = gameState.myPlayer === 'black' ? 'white' : 'black';

      // 詰みチェック
      const isNextPlayerInCheckmate = isCheckmate(newBoard, nextPlayer);
      const newGameStatus = isNextPlayerInCheckmate ? 'checkmate' : 'playing';

      // 新しいボードステート
      const newBoardState = {
        board: newBoard,
        captured: newCaptured,
        gameStatus: newGameStatus,
        isCheck: false, // TODO: 王手チェック
        lastMove: move,
      };

      // DBの更新
      const { error: updateError } = await supabaseRef.current
        .from('games')
        .update({
          board_state: newBoardState as any,
          current_turn: nextPlayer,
          moves: newMoves,
          status: newGameStatus === 'checkmate' ? 'finished' : 'active',
          winner_id: newGameStatus === 'checkmate' ? user.id : null,
          finished_at: newGameStatus === 'checkmate' ? new Date().toISOString() : null
        })
        .eq('id', gameId);

      if (updateError) {
        handleError('sync_failed', 'ゲーム状態の更新に失敗しました', updateError);
        throw updateError;
      }

      // Realtimeで指し手をブロードキャスト（DB更新後）
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'move',
          payload: moveEvent
        });
      }

      // ローカル状態を更新
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          board: newBoard,
          captured: newCaptured,
          currentTurn: nextPlayer,
          moveHistory: newMoves,
          gameStatus: newGameStatus,
          lastMove: move,
        };
      });

    } catch (err) {
      handleError('sync_failed', '指し手の送信に失敗しました', err);
      throw err;
    }
  }, [gameState, gameId, handleError]);

  /**
   * 投了処理
   */
  const resign = useCallback(async (): Promise<void> => {
    if (!gameState) {
      throw new Error('ゲーム状態が初期化されていません');
    }

    try {
      const { data: { user }, error: userError } = await supabaseRef.current.auth.getUser();

      if (userError || !user) {
        handleError('unauthorized', 'ユーザー認証が必要です', userError);
        throw new Error('認証エラー');
      }

      // ResignEventの作成
      const resignEvent: ResignEvent = {
        type: 'resign',
        playerId: user.id,
        player: gameState.myPlayer,
        timestamp: new Date().toISOString()
      };

      // Realtimeで投了をブロードキャスト
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'resign',
          payload: resignEvent
        });
      }

      // DBの更新（対戦相手が勝者）
      const winnerId = gameState.opponentId;

      const { error: updateError } = await supabaseRef.current
        .from('games')
        .update({
          status: 'resignation',
          winner_id: winnerId,
          finished_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (updateError) {
        handleError('sync_failed', '投了処理に失敗しました', updateError);
        throw updateError;
      }

    } catch (err) {
      handleError('sync_failed', '投了処理に失敗しました', err);
      throw err;
    }
  }, [gameState, gameId, handleError]);

  /**
   * 引き分け提案
   */
  const offerDraw = useCallback(async (): Promise<void> => {
    if (!gameState) {
      throw new Error('ゲーム状態が初期化されていません');
    }

    try {
      const { data: { user }, error: userError } = await supabaseRef.current.auth.getUser();

      if (userError || !user) {
        handleError('unauthorized', 'ユーザー認証が必要です', userError);
        throw new Error('認証エラー');
      }

      const drawOfferEvent: DrawOfferEvent = {
        type: 'draw_offer',
        playerId: user.id,
        player: gameState.myPlayer,
        timestamp: new Date().toISOString()
      };

      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'draw_offer',
          payload: drawOfferEvent
        });
      }

    } catch (err) {
      handleError('sync_failed', '引き分け提案の送信に失敗しました', err);
      throw err;
    }
  }, [gameState, handleError]);

  /**
   * 引き分け承認
   */
  const acceptDraw = useCallback(async (): Promise<void> => {
    if (!gameState) {
      throw new Error('ゲーム状態が初期化されていません');
    }

    try {
      const { data: { user }, error: userError } = await supabaseRef.current.auth.getUser();

      if (userError || !user) {
        handleError('unauthorized', 'ユーザー認証が必要です', userError);
        throw new Error('認証エラー');
      }

      const drawAcceptEvent: DrawAcceptEvent = {
        type: 'draw_accept',
        playerId: user.id,
        player: gameState.myPlayer,
        timestamp: new Date().toISOString()
      };

      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'draw_accept',
          payload: drawAcceptEvent
        });
      }

      // DBの更新（引き分け）
      const { error: updateError } = await supabaseRef.current
        .from('games')
        .update({
          status: 'draw',
          finished_at: new Date().toISOString()
        })
        .eq('id', gameId);

      if (updateError) {
        handleError('sync_failed', '引き分け承認処理に失敗しました', updateError);
        throw updateError;
      }

    } catch (err) {
      handleError('sync_failed', '引き分け承認処理に失敗しました', err);
      throw err;
    }
  }, [gameState, gameId, handleError]);

  /**
   * 引き分け拒否
   */
  const declineDraw = useCallback(async (): Promise<void> => {
    if (!gameState) {
      throw new Error('ゲーム状態が初期化されていません');
    }

    try {
      const { data: { user }, error: userError } = await supabaseRef.current.auth.getUser();

      if (userError || !user) {
        handleError('unauthorized', 'ユーザー認証が必要です', userError);
        throw new Error('認証エラー');
      }

      const drawDeclineEvent: DrawDeclineEvent = {
        type: 'draw_decline',
        playerId: user.id,
        player: gameState.myPlayer,
        timestamp: new Date().toISOString()
      };

      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'draw_decline',
          payload: drawDeclineEvent
        });
      }

    } catch (err) {
      handleError('sync_failed', '引き分け拒否の送信に失敗しました', err);
      throw err;
    }
  }, [gameState, handleError]);

  /**
   * Realtime Channelのセットアップ
   */
  useEffect(() => {
    if (!gameId) return;

    // チャンネルの作成と購読
    const channel = supabaseRef.current.channel(`game:${gameId}`);

    // 指し手イベントの処理
    channel.on('broadcast', { event: 'move' }, (payload) => {
      const moveEvent = payload.payload as MoveEvent;
      console.log('Received move:', moveEvent);

      // 相手の指し手の場合のみ処理（自分の指し手は既にローカル更新済み）
      if (moveEvent.playerId === currentUserId) {
        console.log('Skipping own move');
        return;
      }

      // ゲームデータを再取得して同期
      fetchGameData();
    });

    // 投了イベントの処理
    channel.on('broadcast', { event: 'resign' }, (payload) => {
      const resignEvent = payload.payload as ResignEvent;
      console.log('Received resign:', resignEvent);

      // ゲーム状態を更新
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          gameStatus: 'resignation'
        };
      });
    });

    // 引き分け提案イベントの処理
    channel.on('broadcast', { event: 'draw_offer' }, (payload) => {
      const drawOfferEvent = payload.payload as DrawOfferEvent;
      console.log('Received draw offer:', drawOfferEvent);

      // TODO: UIで引き分け提案を表示
    });

    // 引き分け承認イベントの処理
    channel.on('broadcast', { event: 'draw_accept' }, (payload) => {
      const drawAcceptEvent = payload.payload as DrawAcceptEvent;
      console.log('Received draw accept:', drawAcceptEvent);

      // ゲーム状態を更新
      setGameState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          gameStatus: 'draw'
        };
      });
    });

    // 引き分け拒否イベントの処理
    channel.on('broadcast', { event: 'draw_decline' }, (payload) => {
      const drawDeclineEvent = payload.payload as DrawDeclineEvent;
      console.log('Received draw decline:', drawDeclineEvent);

      // TODO: UIで引き分け拒否を表示
    });

    // 接続状態の監視
    channel.subscribe((status) => {
      console.log('Channel status:', status);

      switch (status) {
        case 'SUBSCRIBED':
          setConnectionStatus('connected');
          break;
        case 'CHANNEL_ERROR':
          setConnectionStatus('error');
          handleError('connection_lost', 'チャンネル接続エラー');
          break;
        case 'TIMED_OUT':
          setConnectionStatus('disconnected');
          handleError('timeout', '接続がタイムアウトしました');
          break;
        case 'CLOSED':
          setConnectionStatus('disconnected');
          break;
      }
    });

    channelRef.current = channel;

    // 初期データの取得
    fetchGameData();

    // クリーンアップ
    return () => {
      const channel = channelRef.current;

      if (channel) {
        // supabaseRef.currentを直接使用せず、ローカルコピーを使う
        const supabase = createClient();
        supabase.removeChannel(channel);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, currentUserId]);

  return {
    gameState,
    isLoading,
    error,
    submitMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw
  };
}