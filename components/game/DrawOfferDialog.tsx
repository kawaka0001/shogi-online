/**
 * 引き分け提案ダイアログ
 * 詳細: #58
 */

'use client';

import { useEffect, useCallback } from 'react';
import type { Player } from '@/types/shogi';

/**
 * DrawOfferDialogコンポーネントのProps
 */
export type DrawOfferDialogProps = {
  isOpen: boolean;                      // ダイアログの表示状態
  offerFrom: Player;                    // 提案者（'black' | 'white'）
  onAccept: () => void;                 // 承認時のコールバック
  onDecline: () => void;                // 拒否時のコールバック
};

/**
 * 引き分け提案ダイアログコンポーネント
 *
 * @description
 * - 引き分け提案を受信した側に表示するモーダル
 * - 「承認」「拒否」ボタンを提供
 * - ESCキーで拒否できる（アクセシビリティ）
 * - レスポンシブ対応
 *
 * @example
 * ```tsx
 * <DrawOfferDialog
 *   isOpen={gameState.drawOfferFrom !== null}
 *   offerFrom={gameState.drawOfferFrom || 'black'}
 *   onAccept={acceptDraw}
 *   onDecline={declineDraw}
 * />
 * ```
 */
export function DrawOfferDialog({
  isOpen,
  offerFrom,
  onAccept,
  onDecline
}: DrawOfferDialogProps) {
  // ESCキーで拒否
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onDecline();
    }
  }, [onDecline]);

  // キーボードイベントリスナーの登録
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // フォーカストラップ（モーダルが開いている間、背景をスクロールさせない）
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const offerPlayerName = offerFrom === 'black' ? '先手' : '後手';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="draw-offer-title"
      onClick={onDecline} // 背景クリックで拒否
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-strong max-w-md w-full p-6 sm:p-8 transform transition-all animate-fadeIn"
        onClick={(e) => e.stopPropagation()} // 内側のクリックは伝播させない
      >
        {/* タイトル */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🤝</div>
          <h2
            id="draw-offer-title"
            className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2"
          >
            引き分け提案
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
            {offerPlayerName}から引き分けが提案されました
          </p>
        </div>

        {/* メッセージ */}
        <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 text-center">
            引き分けを承認しますか？
          </p>
        </div>

        {/* ボタン */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onDecline}
            className="flex-1 px-6 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium text-base sm:text-lg shadow-soft hover:shadow-medium focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            autoFocus
          >
            拒否
          </button>
          <button
            onClick={onAccept}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-base sm:text-lg shadow-soft hover:shadow-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
          >
            承認
          </button>
        </div>

        {/* ESCキーのヒント */}
        <p className="mt-4 text-xs text-center text-slate-500 dark:text-slate-400">
          ESCキーまたは背景クリックで拒否できます
        </p>
      </div>
    </div>
  );
}
