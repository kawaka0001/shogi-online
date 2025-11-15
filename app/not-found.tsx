// 詳細: Next.js推奨ファイル実装 - 404ページ
// 存在しないページにアクセスした際に表示

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="text-center max-w-lg">
        {/* 404表示 */}
        <div className="text-8xl font-bold text-slate-300 mb-4 select-none">
          404
        </div>

        {/* タイトル */}
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
          ページが見つかりません
        </h2>

        {/* 説明文 */}
        <p className="text-slate-600 mb-8 text-base md:text-lg">
          お探しのページは存在しないか、移動した可能性があります。
        </p>

        {/* 将棋の駒デザイン要素 */}
        <div className="mb-8 flex justify-center gap-2 text-4xl opacity-20 select-none">
          <span>🎴</span>
          <span>🎴</span>
          <span>🎴</span>
        </div>

        {/* トップページへのリンク */}
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg
                     hover:bg-amber-700 active:bg-amber-800
                     transition-colors duration-200
                     focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          aria-label="トップページへ移動"
        >
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}
