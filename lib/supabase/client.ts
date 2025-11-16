// Supabase クライアント設定
// 詳細: #19

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 環境変数が設定されていない場合はダミークライアントを返す（ビルド時用）
  if (!supabaseUrl || !supabaseAnonKey) {
    // ビルド時のみ許容（ランタイムでは実際の値が必要）
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      return createBrowserClient(
        'https://placeholder.supabase.co',
        'placeholder-anon-key'
      )
    }
    throw new Error(
      'Supabase環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを設定してください。'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
