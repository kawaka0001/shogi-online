-- gamesテーブルへのINSERTポリシーを追加
-- 詳細: #54

-- 認証済みユーザーがゲームを作成できるようにする
CREATE POLICY "Authenticated users can create games"
ON games
FOR INSERT
TO authenticated
WITH CHECK (
  -- 自分が先手または後手のプレイヤーであること
  auth.uid() = black_player_id OR auth.uid() = white_player_id
);
