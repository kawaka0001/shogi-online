# TODO - Issue #54 残作業

## 🚧 即座に修正が必要

### 1. status制約違反の修正
**ファイル**: `lib/realtime/matchmaking-manager.ts:371`

```typescript
// Before
status: 'playing'  // ❌ CHECK制約違反

// After
status: 'active'   // ✅ CHECK (status IN ('active', 'finished', 'abandoned'))
```

**確認方法**:
```sql
-- Supabaseで制約確認済み
SELECT pg_get_constraintdef(c.oid)
FROM pg_constraint c
WHERE conrelid = 'public.games'::regclass
  AND conname = 'games_status_check';
-- 結果: CHECK (status = ANY (ARRAY['active', 'finished', 'abandoned']))
```

## 🧪 テスト項目

### E2Eマッチングテスト
1. 2つのブラウザで `/matchmaking` にアクセス
2. 両方で「対戦相手を探す」をクリック
3. **期待される動作**:
   - Presence同期成功
   - 待機中プレイヤー表示（1人）
   - マッチング成立
   - ゲーム作成成功
   - `/game/{gameId}` へリダイレクト

### エラーケースのテスト
- キャンセル動作
- 接続切断時の挙動
- 同時マッチング（3人以上）

## 📝 ドキュメント更新

- [ ] CLAUDE.mdに新アーキテクチャ追記
- [ ] lib/realtime/README.mdの充実化
- [ ] PR #55の説明を最終更新

## 🔍 コードレビュー観点

1. エラーハンドリングの網羅性
2. 型安全性（database.tsとの整合性）
3. Presenceチャンネルのクリーンアップ
4. RLSポリシーのセキュリティ

## 📊 完了条件（DoD）

- [ ] status修正完了
- [ ] E2Eテスト成功（2ユーザーマッチング）
- [ ] 型エラーなし
- [ ] プロダクションビルド成功
- [ ] PR #55 レビュー待ち

---

**作成日**: 2025-11-15
**Issue**: #54
**PR**: #55
