// ログインページ
// 詳細: #19

import AuthForm from '@/components/auth/AuthForm'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <AuthForm mode="signin" />
    </div>
  )
}
