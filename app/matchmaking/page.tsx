// マッチング待機画面
// 詳細: #20, #54

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePresenceMatchmaking } from '@/lib/hooks/usePresenceMatchmaking'
import { useAuth } from '@/lib/context/AuthContext'
import Link from 'next/link'

export default function MatchmakingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { state, startSearch, cancelSearch, isLoading, players } = usePresenceMatchmaking()

  // 未認証の場合はログインページへリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
    }
  }, [authLoading, user, router])

  // マッチング成立時にゲーム画面へリダイレクト
  useEffect(() => {
    if (state.status === 'matched' && state.gameId) {
      // 成功メッセージを表示してからリダイレクト
      const timer = setTimeout(() => {
        router.push(`/game/${state.gameId}`)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [state.status, state.gameId, router])

  // ローディング中
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未認証
  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            オンライン対戦
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            対戦相手を探してオンライン将棋を楽しもう
          </p>
        </div>

        {/* メインカード */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* アイドル状態 */}
          {state.status === 'idle' && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <svg
                  className="w-10 h-10 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                対戦相手を探す
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                ボタンをクリックして対戦相手を探します。
                <br />
                マッチングが成立すると自動的にゲームが開始されます。
              </p>
              <button
                onClick={startSearch}
                disabled={isLoading}
                className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? '参加中...' : '対戦相手を探す'}
              </button>
            </div>
          )}

          {/* 検索中状態 */}
          {state.status === 'searching' && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600 dark:border-yellow-400"></div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                対戦相手を探しています...
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                対戦相手が見つかるまでお待ちください。
                <br />
                通常、数秒から数分で見つかります。
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                現在 <strong>{players.length}</strong> 人が待機中です
              </p>
              <div className="flex justify-center space-x-2 py-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <button
                onClick={cancelSearch}
                disabled={isLoading}
                className="w-full md:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold rounded-xl transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {isLoading ? 'キャンセル中...' : 'キャンセル'}
              </button>
            </div>
          )}

          {/* マッチング成立 */}
          {state.status === 'matched' && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <svg
                  className="w-10 h-10 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400">
                マッチング成立！
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                対戦相手が見つかりました。
                <br />
                ゲーム画面に移動します...
              </p>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          )}

          {/* エラー状態 */}
          {state.status === 'error' && (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <svg
                  className="w-10 h-10 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                エラーが発生しました
              </h2>
              <p className="text-slate-600 dark:text-slate-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                {state.error || '不明なエラーが発生しました'}
              </p>
              <button
                onClick={startSearch}
                disabled={isLoading}
                className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-lg rounded-xl transition-colors duration-200 disabled:cursor-not-allowed"
              >
                {isLoading ? '再試行中...' : '再試行'}
              </button>
            </div>
          )}
        </div>

        {/* ナビゲーション */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            トップページに戻る
          </Link>
        </div>

        {/* 注意事項 */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            ご注意
          </h3>
          <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>マッチングには数秒から数分かかる場合があります</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>先手・後手はランダムで決定されます</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>対戦中にページを離れると対戦が中断されます</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
