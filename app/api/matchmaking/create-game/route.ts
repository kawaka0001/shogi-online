// マッチング成立時のゲーム作成APIエンドポイント
// 詳細: #54

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInitialGameState } from '@/lib/game/initial-state';
import type { Database, Tables } from '@/types/database';

type Game = Tables<'games'>;

/**
 * POST /api/matchmaking/create-game
 *
 * マッチング成立時にゲームを作成するエンドポイント
 *
 * リクエストボディ:
 * {
 *   player1Id: string (先手)
 *   player2Id: string (後手)
 * }
 *
 * レスポンス:
 * {
 *   success: true,
 *   gameId: string
 * }
 * または
 * {
 *   success: false,
 *   error: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディを解析
    const body = await request.json();
    const { player1Id, player2Id } = body;

    // リクエストボディのバリデーション
    if (!player1Id || !player2Id) {
      return NextResponse.json(
        {
          success: false,
          error: 'player1Idとplayer2Idは必須です'
        },
        { status: 400 }
      );
    }

    // 同じプレイヤーIDが渡されていないかチェック
    if (player1Id === player2Id) {
      return NextResponse.json(
        {
          success: false,
          error: '異なるプレイヤーでゲームを作成してください'
        },
        { status: 400 }
      );
    }

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

    // 認証チェック: リクエストしたユーザーがplayer1またはplayer2であること
    if (user.id !== player1Id && user.id !== player2Id) {
      return NextResponse.json(
        {
          success: false,
          error: '権限がありません'
        },
        { status: 403 }
      );
    }

    // 初期盤面を生成
    const initialState = createInitialGameState();

    // ゲームを作成
    // player1Idが先手（黒）、player2Idが後手（白）
    const { data: newGame, error: gameError } = await supabase
      .from('games')
      .insert({
        black_player_id: player1Id,
        white_player_id: player2Id,
        board_state: initialState.board as any, // JSON形式で保存
        current_turn: 'black',
        status: 'playing',
        moves: [],
      })
      .select()
      .single();

    if (gameError) {
      console.error('ゲーム作成エラー:', gameError);
      return NextResponse.json(
        {
          success: false,
          error: 'ゲームの作成に失敗しました'
        },
        { status: 500 }
      );
    }

    if (!newGame || !newGame.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ゲームIDが取得できません'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      gameId: newGame.id
    });

  } catch (error) {
    console.error('ゲーム作成エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'サーバーエラーが発生しました'
      },
      { status: 500 }
    );
  }
}
