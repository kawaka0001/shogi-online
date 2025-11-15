# Realtime Matchmaking Manager

Supabase Realtime Presenceを使ったマッチング機能のコアクラス

詳細: #54

## 概要

`MatchmakingManager`は、Supabase Realtime Presenceを活用してリアルタイムマッチングを実現するクラスです。

### 主な機能

1. **Presenceチャンネル管理**
   - チャンネルへの接続・切断
   - 自分の状態（searching/matched/cancelled）のbroadcast

2. **マッチング処理**
   - FIFO順（先着順）でのマッチング
   - スキルレベル差±200以内でマッチング
   - レースコンディション対策（排他制御）

3. **イベント通知**
   - 状態変更時のコールバック
   - マッチング成立時のコールバック
   - エラー発生時のコールバック

## 使用例

```typescript
import { MatchmakingManager } from '@/lib/realtime/matchmaking-manager';
import { createClient } from '@/lib/supabase/client';

// Supabaseクライアント作成
const supabase = createClient();

// ユーザー情報取得
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id || '';
const username = user?.user_metadata?.username || 'Player';
const skillLevel = 1500; // デフォルトスキルレベル

// MatchmakingManager作成
const manager = new MatchmakingManager(
  supabase,
  userId,
  username,
  skillLevel
);

// マッチング開始
await manager.start({
  onStateChange: (players) => {
    console.log(`待機中のプレイヤー: ${players.length}人`);
    setWaitingPlayers(players);
  },
  onMatch: (result) => {
    console.log('マッチング成立!', result);
    // ゲーム画面にリダイレクト
    router.push(`/game/${result.gameId}`);
  },
  onError: (error) => {
    console.error('エラー:', error);
    setError(error.message);
  }
});

// マッチングキャンセル
await manager.stop();
```

## テストシナリオ

### シナリオ1: 正常なマッチング（2人）

**前提条件:**
- 2人のユーザー（User A, User B）
- どちらもスキルレベル1500

**手順:**
1. User Aがマッチング開始
2. User Bがマッチング開始
3. マッチング成立

**期待結果:**
- User A, Bともに`onMatch`コールバックが呼ばれる
- 同じ`gameId`が返される
- `games`テーブルにレコードが作成される
- 先手・後手がランダムに割り当てられる

### シナリオ2: FIFO順のマッチング（3人）

**前提条件:**
- 3人のユーザー（User A, B, C）
- 全員スキルレベル1500

**手順:**
1. User A マッチング開始（10:00:00）
2. User B マッチング開始（10:00:01）
3. User C マッチング開始（10:00:02）

**期待結果:**
- User AとBがマッチング成立（先着順）
- User Cは待機状態を継続
- `onStateChange`で待機人数が正しく更新される

### シナリオ3: スキルレベルマッチング

**前提条件:**
- User A: スキルレベル1500
- User B: スキルレベル1300（差200）
- User C: スキルレベル1100（差400）

**手順:**
1. User A マッチング開始
2. User C マッチング開始
3. User B マッチング開始

**期待結果:**
- User AとBがマッチング（差200以内）
- User AとCはマッチングしない（差400 > 200）

### シナリオ4: キャンセル処理

**前提条件:**
- User A, B が待機中

**手順:**
1. User A マッチング開始
2. User B マッチング開始
3. User A が`manager.stop()`を呼ぶ

**期待結果:**
- User A の Presence が削除される
- User B は待機状態を継続
- `onStateChange`で待機人数が更新される

### シナリオ5: 同時マッチングのレースコンディション対策

**前提条件:**
- 4人のユーザー（User A, B, C, D）
- ほぼ同時にマッチング開始

**手順:**
1. 4人がほぼ同時にマッチング開始

**期待結果:**
- 重複マッチングが発生しない
- 2組のマッチングが成立（A-B, C-D など）
- `matchingLock`により排他制御が機能

### シナリオ6: エラーハンドリング

**前提条件:**
- Supabase接続エラーをシミュレート

**手順:**
1. ネットワークを切断
2. マッチング開始

**期待結果:**
- `onError`コールバックが呼ばれる
- エラーメッセージが適切に表示される
- アプリケーションがクラッシュしない

## デバッグ方法

### コンソールログ

MatchmakingManagerは詳細なログを出力します：

```
[MatchmakingManager] 初期化完了 { userId, username, skillLevel }
[MatchmakingManager] マッチング開始...
[MatchmakingManager] Presence送信: { userId, status: 'searching', ... }
[MatchmakingManager] チャンネル購読成功
[MatchmakingManager] Presence同期: { ... }
[MatchmakingManager] 待機中のプレイヤー: [...]
[MatchmakingManager] マッチング相手決定: { opponent }
[MatchmakingManager] ゲーム作成成功: { gameId }
[MatchmakingManager] マッチング完了!
```

### Supabase Realtime Inspector

Supabase Dashboardの「Realtime Inspector」で以下を確認：

1. **Presenceチャンネル**: `matchmaking`
2. **接続中のクライアント数**
3. **各クライアントのPresence状態**

### 手動テスト手順

1. 2つのブラウザウィンドウ（または1つはシークレットモード）を開く
2. それぞれで異なるユーザーでログイン
3. 両方でマッチング開始
4. コンソールログでPresence同期とマッチング処理を確認

## 今後の拡張

- [ ] ランク別マッチング（スキルレベル範囲の調整）
- [ ] カスタムルーム作成
- [ ] フレンドマッチ
- [ ] 観戦モード
- [ ] 再マッチ機能
- [ ] マッチングタイムアウト（30秒など）
