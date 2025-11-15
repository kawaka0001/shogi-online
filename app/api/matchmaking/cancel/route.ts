// マッチングキャンセルAPIエンドポイント
// 詳細: #20

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

    // 待機中のマッチングキューエントリを取得
    const { data: queueEntry, error: fetchError } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'waiting')
      .single();

    if (fetchError || !queueEntry) {
      return NextResponse.json(
        {
          success: false,
          error: 'マッチング待機中ではありません'
        },
        { status: 404 }
      );
    }

    // マッチングキューから削除
    const { error: deleteError } = await supabase
      .from('matchmaking_queue')
      .delete()
      .eq('id', queueEntry.id);

    if (deleteError) {
      console.error('マッチングキャンセルエラー:', deleteError);
      return NextResponse.json(
        {
          success: false,
          error: 'マッチングのキャンセルに失敗しました'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'マッチングをキャンセルしました'
    });

  } catch (error) {
    console.error('マッチングキャンセルエラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました'
      },
      { status: 500 }
    );
  }
}