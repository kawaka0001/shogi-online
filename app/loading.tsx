// 詳細: Next.js推奨ファイル実装 - ローディング画面
// ページ読み込み時に表示されるサーバーコンポーネント

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-amber-100">
      <div className="text-center">
        {/* 将棋の駒をイメージした回転アニメーション */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-amber-600 border-t-transparent rounded-sm animate-spin"></div>
          <div className="absolute inset-2 border-2 border-amber-400 border-b-transparent rounded-sm animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>

        {/* ローディングテキスト */}
        <p className="text-xl font-semibold text-amber-900 mb-2">
          読み込み中...
        </p>
        <p className="text-sm text-amber-700">
          盤面を準備しています
        </p>
      </div>
    </div>
  );
}
