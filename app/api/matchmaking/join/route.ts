// マッチング参加APIエンドポイント
// 詳細: #20

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInitialGameState } from '@/lib/game/initial-state';
import type { Database, Tables } from '@/types/database';

type MatchmakingQueue = Tables<'matchmaking_queue'>;
type Game = Tables<'games'>;

export async function POST(request: NextRequest) {
  try {
    // Supabaseクライアントを作成
    const supabase = await createClient();

    // 現在のユーザーを取得
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Matchmaking] 認証エラー:', authError);
      return NextResponse.json(
        {
          success: false,
          error: '認証が必要です'
        },
        { status: 401 }
      );
    }

    console.log('[Matchmaking] ユーザーがマッチング参加:', user.id);

    // Postgres関数を使ってアトミックにマッチング処理
    // 詳細: #52 - レースコンディション対策
    const { data: matchResult, error: matchError } = await supabase
      .rpc('find_and_match_opponent', { p_user_id: user.id });

    if (matchError) {
      console.error('[Matchmaking] マッチング関数エラー:', matchError);
      return NextResponse.json(
        {
          success: false,
          error: 'マッチング処理中にエラーが発生しました'
        },
        { status: 500 }
      );
    }

    const result = matchResult?.[0];
    if (!result) {
      console.error('[Matchmaking] マッチング結果が空');
      return NextResponse.json(
        {
          success: false,
          error: 'マッチング処理に失敗しました'
        },
        { status: 500 }
      );
    }

    console.log('[Matchmaking] マッチング関数結果:', result);

    // 待機中のユーザーがいない場合
    if (!result.matched) {
      console.log('[Matchmaking] 待機中 - キューID:', result.queue_id);
      return NextResponse.json({
        status: 'waiting',
        message: 'マッチング相手を待っています'
      });
    }

    // マッチング成立
    console.log('[Matchmaking] マッチング成立！ 相手:', result.opponent_id);
    const opponentQueueId = result.queue_id;

    // ランダムで先手・後手を決定
    const isCurrentUserBlack = Math.random() < 0.5;
    const blackPlayerId = isCurrentUserBlack ? user.id : result.opponent_id;
    const whitePlayerId = isCurrentUserBlack ? result.opponent_id : user.id;

    // 初期盤面を生成
    const initialState = createInitialGameState();

    // 新しいゲームを作成
    const { data: newGame, error: gameError } = await supabase
      .from('games')
      .insert({
        black_player_id: blackPlayerId,
        white_player_id: whitePlayerId,
        board_state: initialState.board as any, // JSON形式で保存
        current_turn: 'black',
        status: 'playing',
        moves: [],
      })
      .select()
      .single();

    if (gameError) {
      console.error('[Matchmaking] ゲーム作成エラー:', gameError);
      return NextResponse.json(
        {
          success: false,
          error: 'ゲームの作成に失敗しました'
        },
        { status: 500 }
      );
    }

    console.log('[Matchmaking] ゲーム作成成功:', newGame.id);

    // 両方のユーザーのマッチングキューをマッチ済みに更新
    console.log('[Matchmaking] キュー更新開始');
    const updatePromises = [
      // 相手のキューを更新
      supabase
        .from('matchmaking_queue')
        .update({
          status: 'matched',
          game_id: newGame.id,
          matched_at: new Date().toISOString()
        })
        .eq('id', opponentQueueId),

      // 自分のキューエントリを作成してマッチ済みにする
      supabase
        .from('matchmaking_queue')
        .insert({
          user_id: user.id,
          status: 'matched',
          game_id: newGame.id,
          matched_at: new Date().toISOString()
        })
    ];

    const results = await Promise.all(updatePromises);

    // エラーチェック
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.error) {
        console.error(`[Matchmaking] キュー更新エラー [${i}]:`, result.error);
        // ゲームは作成済みなので、エラーでもゲームIDを返す
      } else {
        console.log(`[Matchmaking] キュー更新成功 [${i}]`);
      }
    }

    console.log('[Matchmaking] マッチング完了 - ゲームID:', newGame.id);
    return NextResponse.json({
      status: 'matched',
      gameId: newGame.id,
      message: 'マッチング成立！ゲームが開始されます',
      role: isCurrentUserBlack ? 'black' : 'white'
    });

  } catch (error) {
    console.error('マッチングエラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました'
      },
      { status: 500 }
    );
  }
}