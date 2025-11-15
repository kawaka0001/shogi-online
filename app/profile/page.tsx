'use client'

// プロフィールページ
// 詳細: #19

import { useAuth } from '@/lib/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8">プロフィール</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                ユーザーID
              </label>
              <div className="text-lg font-mono bg-gray-100 dark:bg-gray-700 p-3 rounded">
                {user.id}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                メールアドレス
              </label>
              <div className="text-lg bg-gray-100 dark:bg-gray-700 p-3 rounded">
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                登録日時
              </label>
              <div className="text-lg bg-gray-100 dark:bg-gray-700 p-3 rounded">
                {new Date(user.created_at).toLocaleString('ja-JP')}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                ログアウト
              </button>
            </div>

            <div className="pt-2">
              <a
                href="/"
                className="block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                ホームに戻る
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
