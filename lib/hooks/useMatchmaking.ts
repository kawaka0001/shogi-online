// マッチングフック
// 詳細: #20

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/context/AuthContext'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Tables } from '@/types/database'

export type MatchmakingStatus = 'idle' | 'searching' | 'matched' | 'error'

export type MatchmakingState = {
  status: MatchmakingStatus
  gameId: string | null
  error: string | null
}

/**
 * マッチング機能を管理するカスタムフック
 *
 * @returns {Object} マッチング状態と操作関数
 * @property {MatchmakingState} state - 現在のマッチング状態
 * @property {Function} joinMatchmaking - マッチングに参加する
 * @property {Function} cancelMatchmaking - マッチングをキャンセルする
 * @property {boolean} isLoading - ローディング状態
 */
export function useMatchmaking() {
  const { user } = useAuth()
  const supabase = createClient()
  const [state, setState] = useState<MatchmakingState>({
    status: 'idle',
    gameId: null,
    error: null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  // Realtime Subscriptionの設定
  useEffect(() => {
    if (!user || state.status !== 'searching') {
      // チャンネルをクリーンアップ
      if (channel) {
        channel.unsubscribe()
        setChannel(null)
      }
      return
    }

    // マッチング待機テーブルの変更を監視
    // 詳細: #52
    const newChannel = supabase
      .channel(`matchmaking_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT/UPDATE両方を監視
          schema: 'public',
          table: 'matchmaking_queue',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Matchmaking update:', payload)

          // statusがmatchedでgame_idが存在する場合、マッチング成立
          const newQueue = payload.new as Tables<'matchmaking_queue'>
          if (newQueue && newQueue.status === 'matched' && newQueue.game_id) {
            setState({
              status: 'matched',
              gameId: newQueue.game_id,
              error: null,
            })
          }
        }
      )
      .subscribe()

    setChannel(newChannel)

    // クリーンアップ
    return () => {
      newChannel.unsubscribe()
    }
    // channelは内部でのみ使用するため、依存配列に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, state.status, supabase])

  /**
   * マッチングに参加
   */
  const joinMatchmaking = useCallback(async () => {
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
      const response = await fetch('/api/matchmaking/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'マッチング参加に失敗しました')
      }

      // 即座にマッチングした場合
      // 詳細: #52
      if (data.status === 'matched' && data.gameId) {
        setState({
          status: 'matched',
          gameId: data.gameId,
          error: null,
        })
      } else {
        // 待機中（Realtime Subscriptionで通知を待つ）
        setState({
          status: 'searching',
          gameId: null,
          error: null,
        })
      }
    } catch (error) {
      console.error('Matchmaking join error:', error)
      setState({
        status: 'error',
        gameId: null,
        error: error instanceof Error ? error.message : 'マッチング参加に失敗しました',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user])

  /**
   * マッチングをキャンセル
   */
  const cancelMatchmaking = useCallback(async () => {
    if (!user) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/matchmaking/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'マッチングキャンセルに失敗しました')
      }

      setState({
        status: 'idle',
        gameId: null,
        error: null,
      })
    } catch (error) {
      console.error('Matchmaking cancel error:', error)
      setState({
        status: 'error',
        gameId: null,
        error: error instanceof Error ? error.message : 'マッチングキャンセルに失敗しました',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user])

  return {
    state,
    joinMatchmaking,
    cancelMatchmaking,
    isLoading,
  }
}
