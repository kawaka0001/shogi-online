// 詳細: Next.js推奨ファイル実装 - エラー画面
// アプリケーション全体のエラーバウンダリ
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをコンソールに出力（デバッグ用）
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-red-100 p-4">
      <div className="text-center max-w-md">
        {/* エラーアイコン */}
        <div className="text-6xl mb-4" role="img" aria-label="エラー">
          ⚠️
        </div>

        {/* エラータイトル */}
        <h2 className="text-2xl font-bold text-red-900 mb-4">
          エラーが発生しました
        </h2>

        {/* エラーメッセージ */}
        <p className="text-red-700 mb-2">
          {error.message || '予期しないエラーが発生しました'}
        </p>

        {/* デバッグ情報（開発環境のみ表示推奨） */}
        {error.digest && (
          <p className="text-xs text-red-600 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        {/* リトライボタン */}
        <button
          onClick={reset}
          className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg
                     hover:bg-amber-700 active:bg-amber-800
                     transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="ページを再読み込み"
        >
          再試行
        </button>

        {/* サポート情報 */}
        <p className="text-sm text-red-600 mt-6">
          問題が解決しない場合は、ページをリロードしてください
        </p>
      </div>
    </div>
  );
}
