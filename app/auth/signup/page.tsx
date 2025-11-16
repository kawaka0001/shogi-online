// サインアップページ
// 詳細: #19

import AuthForm from '@/components/auth/AuthForm'

// 動的レンダリングを強制（静的生成を無効化）
export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <AuthForm mode="signup" />
    </div>
  )
}
