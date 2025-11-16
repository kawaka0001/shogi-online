# リアルタイムアーキテクチャレビュー（2025年基準）

## 🔍 現状分析

### 問題: リロードしないと相手の手が反映されない

**根本原因の可能性**:
1. Supabase Realtime Broadcastの設定不足
2. Channel購読のタイミング問題
3. イベントリスナーの登録漏れ

---

## 📊 現在の実装（feature/issue-58）

### ✅ 正しく実装されている点

#### 1. Optimistic UI Update
```typescript
// lib/hooks/useOnlineGame.ts:273-284
// 自分の指し手は即座にローカル更新
setGameState(prev => ({
  ...prev,
  board: newBoard,
  captured: newCaptured,
  currentTurn: nextPlayer,
  moveHistory: newMoves,
  gameStatus: newGameStatus,
  lastMove: move,
}));
```

#### 2. 差分更新（DB再取得を回避）
```typescript
// lib/hooks/useOnlineGame.ts:522-588
// イベントデータから直接状態を更新
setGameState((prev) => {
  const newBoard = prev.board.map(row => [...row]);
  // ... 駒の移動処理 ...
  return { ...prev, board: newBoard, ... };
});
```

#### 3. 型ガードによるランタイム安全性
```typescript
// lib/hooks/useOnlineGame.ts:508-510
if (!isMoveEvent(payload.payload)) {
  console.error('Invalid move event payload:', payload.payload);
  return;
}
```

#### 4. 接続状態監視
```typescript
// lib/hooks/useOnlineGame.ts:679-698
channel.subscribe((status) => {
  switch (status) {
    case 'SUBSCRIBED': setConnectionStatus('connected'); break;
    case 'CHANNEL_ERROR': handleError('connection_lost'); break;
  }
});
```

---

## ❌ Critical Issue: Broadcast設定の不足

### 問題点

Supabase Realtime Broadcastは**デフォルトで無効**です。以下の設定が必要：

```typescript
// 現在の実装（不完全）
const channel = supabaseRef.current.channel(`game:${gameId}`);

// 必要な設定
const channel = supabaseRef.current.channel(`game:${gameId}`, {
  config: {
    broadcast: { self: false, ack: true }, // 👈 これが不足！
  }
});
```

### 説明

- `self: false` - 自分自身には送信しない（Optimistic UIで既に更新済みのため）
- `ack: true` - 送信確認を受け取る（信頼性向上）

---

## 🚨 その他の潜在的問題

### 1. Channel作成のタイミング

```typescript
// lib/hooks/useOnlineGame.ts:484-503
useEffect(() => {
  const initialize = async () => {
    const { data: { user } } = await supabaseRef.current.auth.getUser();
    await fetchGameData(); // 👈 ここで時間がかかる

    // この間にチャンネル作成が遅れる可能性
    channel = supabaseRef.current.channel(`game:${gameId}`);
    channel.on('broadcast', { event: 'move' }, handler);
    channel.subscribe();
  };
}, [gameId]);
```

**問題**: `fetchGameData()`の完了を待ってからチャンネル購読するため、初期化が遅い。

**解決策**: チャンネル購読と初期データ取得を並列化。

---

### 2. 同一user.idによるイベントスキップロジック

```typescript
// lib/hooks/useOnlineGame.ts:517-520
if (moveEvent.playerId === user.id) {
  console.log('Skipping own move');
  return; // 👈 正しいが、user.idが未初期化の場合は？
}
```

**懸念**: `user.id`が`undefined`の場合、全てのイベントがスキップされる可能性。

---

## 🎯 2025年ベストプラクティスとの比較

### ✅ 採用済み

- [x] Optimistic UI
- [x] 差分更新（DB再取得回避）
- [x] 型ガード（ランタイム安全性）
- [x] エラーハンドリング
- [x] 接続状態監視

### ❌ 不足

- [ ] **Broadcast設定の明示的な有効化**
- [ ] チャンネル購読の並列化
- [ ] Presenceによるオンライン状態の追跡
- [ ] 再接続時の自動同期
- [ ] Network Effectの最小化（最適化済みだが更なる改善可能）

---

## 🔧 推奨される修正

### Priority 1: Broadcast設定を追加

```typescript
// lib/hooks/useOnlineGame.ts:502
channel = supabaseRef.current.channel(`game:${gameId}`, {
  config: {
    broadcast: { self: false, ack: true },
    presence: { key: user.id }, // オプション: Presence追加
  }
});
```

### Priority 2: チャンネル購読の並列化

```typescript
const initialize = async () => {
  const { data: { user } } = await supabaseRef.current.auth.getUser();
  if (!user || !mounted) return;

  setCurrentUserId(user.id);

  // チャンネル購読を先に開始（並列化）
  channel = supabaseRef.current.channel(`game:${gameId}`, {
    config: { broadcast: { self: false, ack: true } }
  });

  // イベントリスナー登録
  channel.on('broadcast', { event: 'move' }, handler);
  channel.subscribe();

  // データ取得は並列実行
  await fetchGameData(); // 同期を待たない
};
```

### Priority 3: 再接続時の自動同期

```typescript
channel.on('system', { event: 'reconnect' }, async () => {
  console.log('Reconnected, re-fetching game data');
  await fetchGameData(); // 再接続時にデータを再取得
});
```

---

## 📝 実装の優先順位

1. **High**: Broadcast設定の追加（これが原因の可能性が最も高い）
2. **Medium**: チャンネル購読の並列化
3. **Low**: Presence追加、再接続処理

---

## 🧪 検証方法

### デバッグ手順

1. ブラウザコンソールで以下を確認:
   ```
   Channel status: SUBSCRIBED
   Received move: { ... }
   ```

2. Supabase Dashboardで「Realtime」タブを確認:
   - Broadcastが有効になっているか
   - メッセージが送受信されているか

3. 2つのブラウザウィンドウで同時テスト:
   - Window A: 駒を動かす → consoleに "Sending move broadcast" が表示
   - Window B: "Received move" が表示されるか確認

---

## 🎯 期待される結果

修正後:
- ✅ 相手の手が即座に反映される
- ✅ リロード不要
- ✅ レイテンシ < 100ms
- ✅ ネットワーク効率向上

---

Generated: 2025-11-17
Issue: #58
