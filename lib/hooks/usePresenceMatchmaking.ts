// Realtime Presenceベースのマッチングフック
// 詳細: #54

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/context/AuthContext'
import { MatchmakingManager } from '@/lib/realtime/matchmaking-manager'
import type { PlayerPresence, MatchResult } from '@/types/matchmaking'

/**
 * マッチングステータスの型定義
 * 既存のuseMatchmakingと互換性を持たせる
 */
export type MatchmakingStatus = 'idle' | 'searching' | 'matched' | 'error'

/**
 * マッチング状態の型定義
 * 既存のuseMatchmakingと互換性を持たせる
 */
export type MatchmakingState = {
  status: MatchmakingStatus
  gameId: string | null
  error: string | null
}

/**
 * Realtime Presenceを使用したマッチング機能を管理するカスタムフック
 *
 * 既存のuseMatchmakingと同じインターフェースを提供し、後方互換性を保つ
 * 内部実装ではMatchmakingManagerクラスを使用してRealtime Presenceを管理
 *
 * @returns {Object} マッチング状態と操作関数
 * @property {MatchmakingState} state - 現在のマッチング状態
 * @property {Function} joinMatchmaking - マッチングに参加する（後方互換性用）
 * @property {Function} startSearch - マッチング検索を開始する
 * @property {Function} cancelMatchmaking - マッチングをキャンセルする（後方互換性用）
 * @property {Function} cancelSearch - マッチング検索をキャンセルする
 * @property {boolean} isLoading - ローディング状態
 * @property {PlayerPresence[]} players - 現在待機中のプレイヤー一覧
 *
 * @example
 * ```tsx
 * function MatchmakingPage() {
 *   const { state, startSearch, cancelSearch, players } = usePresenceMatchmaking()
 *
 *   useEffect(() => {
 *     if (state.status === 'matched' && state.gameId) {
 *       router.push(`/game/${state.gameId}`)
 *     }
 *   }, [state])
 *
 *   return (
 *     <div>
 *       <p>待機中: {players.length}人</p>
 *       {state.status === 'idle' && (
 *         <button onClick={startSearch}>マッチング開始</button>
 *       )}
 *       {state.status === 'searching' && (
 *         <button onClick={cancelSearch}>キャンセル</button>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function usePresenceMatchmaking() {
  const { user } = useAuth()
  const supabase = createClient()

  // 状態管理（既存のuseMatchmakingと互換性のある形式）
  const [state, setState] = useState<MatchmakingState>({
    status: 'idle',
    gameId: null,
    error: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [players, setPlayers] = useState<PlayerPresence[]>([])

  // MatchmakingManagerのインスタンス（useRefで永続化）
  const managerRef = useRef<MatchmakingManager | null>(null)

  /**
   * マッチング検索を開始
   * MatchmakingManagerを初期化してPresenceチャンネルに接続
   */
  const startSearch = useCallback(async () => {
    if (!user) {
      setState({
        status: 'error',
        gameId: null,
        error: '認証が必要です。ログインしてください。',
      })
      return
    }

    setIsLoading(true)
    setState({
      status: 'searching',
      gameId: null,
      error: null,
    })

    try {
      // MatchmakingManagerのインスタンスを作成
      const username = user.email?.split('@')[0] || 'ゲスト'
      const skillLevel = 1500 // デフォルトスキルレベル

      managerRef.current = new MatchmakingManager(
        supabase,
        user.id,
        username,
        skillLevel
      )

      // マッチング開始
      await managerRef.current.start({
        // Presence状態変更時のコールバック
        onStateChange: (waitingPlayers: PlayerPresence[]) => {
          console.log('[usePresenceMatchmaking] プレイヤー一覧更新:', waitingPlayers)
          setPlayers(waitingPlayers)
        },

        // マッチング成立時のコールバック
        onMatch: async (result: MatchResult) => {
          console.log('[usePresenceMatchmaking] マッチング成立!', result)

          try {
            // ゲーム作成APIを呼び出し
            const response = await fetch('/api/matchmaking/create-game', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                player1Id: user.id,
                player2Id: result.opponentId,
              }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
              throw new Error(data.error || 'ゲーム作成に失敗しました')
            }

            // ゲームID取得成功
            setState({
              status: 'matched',
              gameId: data.gameId,
              error: null,
            })
            setIsLoading(false)
          } catch (error) {
            console.error('[usePresenceMatchmaking] ゲーム作成エラー:', error)
            setState({
              status: 'error',
              gameId: null,
              error: error instanceof Error ? error.message : 'ゲーム作成に失敗しました',
            })
            setIsLoading(false)
          }
        },

        // エラー発生時のコールバック
        onError: (error: Error) => {
          console.error('[usePresenceMatchmaking] エラー:', error)
          setState({
            status: 'error',
            gameId: null,
            error: error.message,
          })
          setIsLoading(false)
        },
      })

      setIsLoading(false)
    } catch (error) {
      console.error('[usePresenceMatchmaking] startSearch()エラー:', error)
      setState({
        status: 'error',
        gameId: null,
        error: error instanceof Error ? error.message : 'マッチング開始に失敗しました',
      })
      setIsLoading(false)
    }
  }, [user, supabase])

  /**
   * マッチング検索をキャンセル
   * MatchmakingManagerを停止してPresenceチャンネルから退出
   */
  const cancelSearch = useCallback(async () => {
    if (!managerRef.current) {
      console.log('[usePresenceMatchmaking] マネージャーが存在しないためスキップ')
      return
    }

    setIsLoading(true)

    try {
      await managerRef.current.stop()

      setState({
        status: 'idle',
        gameId: null,
        error: null,
      })
      setPlayers([])
      managerRef.current = null
    } catch (error) {
      console.error('[usePresenceMatchmaking] cancelSearch()エラー:', error)
      setState({
        status: 'error',
        gameId: null,
        error: error instanceof Error ? error.message : 'キャンセルに失敗しました',
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 後方互換性用のエイリアス
   * 既存コードとの互換性を保つため、joinMatchmaking/cancelMatchmakingを提供
   */
  const joinMatchmaking = startSearch
  const cancelMatchmaking = cancelSearch

  /**
   * クリーンアップ
   * コンポーネントアンマウント時にマッチング処理を停止
   */
  useEffect(() => {
    return () => {
      if (managerRef.current) {
        console.log('[usePresenceMatchmaking] クリーンアップ実行')
        managerRef.current.stop().catch(console.error)
        managerRef.current = null
      }
    }
  }, [])

  return {
    state,
    joinMatchmaking, // 後方互換性
    startSearch,
    cancelMatchmaking, // 後方互換性
    cancelSearch,
    isLoading,
    players, // 新機能: 待機中のプレイヤー一覧
  }
}
