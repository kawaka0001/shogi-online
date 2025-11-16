-- Realtime Presence移行に伴う旧マッチング機構の削除
-- 詳細: #54

-- matchmaking_queueテーブルを削除
DROP TABLE IF EXISTS matchmaking_queue CASCADE;

-- find_and_match_opponent関数を削除（存在する場合）
DROP FUNCTION IF EXISTS find_and_match_opponent() CASCADE;
