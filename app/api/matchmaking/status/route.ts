// マッチング状態取得APIエンドポイント
// 詳細: #20

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 動的レンダリングを強制（cookiesを使用するため）
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Supabaseクライアントを作成
    const supabase = await createClient();

    // 現在のユーザーを取得
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: '認証が必要です'
        },
        { status: 401 }
      );
    }

    // ユーザーの最新のマッチングキューエントリを取得
    const { data: queueEntry, error: fetchError } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('マッチング状態取得エラー:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'マッチング状態の取得に失敗しました'
        },
        { status: 500 }
      );
    }

    // キューにエントリがない場合
    if (!queueEntry) {
      return NextResponse.json({
        status: 'not_in_queue',
        message: 'マッチングキューに参加していません'
      });
    }

    // マッチング待機中の場合
    if (queueEntry.status === 'waiting') {
      return NextResponse.json({
        status: 'waiting',
        message: 'マッチング相手を待っています',
        createdAt: queueEntry.created_at
      });
    }

    // マッチング成立済みの場合
    if (queueEntry.status === 'matched' && queueEntry.game_id) {
      // ゲーム情報も取得
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', queueEntry.game_id)
        .single();

      if (gameError || !game) {
        console.error('ゲーム情報取得エラー:', gameError);
        return NextResponse.json({
          status: 'matched',
          gameId: queueEntry.game_id,
          message: 'マッチング成立',
          matchedAt: queueEntry.matched_at
        });
      }

      // プレイヤーの役割（先手/後手）を判定
      const role = game.black_player_id === user.id ? 'black' : 'white';

      return NextResponse.json({
        status: 'matched',
        gameId: queueEntry.game_id,
        message: 'マッチング成立！ゲームが開始されます',
        matchedAt: queueEntry.matched_at,
        role,
        gameStatus: game.status
      });
    }

    // その他のステータス（通常はここに到達しない）
    return NextResponse.json({
      status: queueEntry.status,
      gameId: queueEntry.game_id,
      message: 'マッチング状態を確認しました'
    });

  } catch (error) {
    console.error('マッチング状態取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました'
      },
      { status: 500 }
    );
  }
}