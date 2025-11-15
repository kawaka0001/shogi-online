/**
 * エラーメッセージ表示コンポーネント - モダンデザイン
 * 詳細: エラーUI実装, #18 パフォーマンス最適化, UI Redesign
 */

'use client';

import { useEffect, memo } from 'react';

type ErrorMessageProps = {
  message: string | null;
  onClose: () => void;
};

/**
 * エラーメッセージをトースト型UIで表示（モダン版）
 *
 * Features:
 * - 自動で5秒後に消える
 * - 閉じるボタン付き
 * - レスポンシブ対応
 * - モダンなデザイン
 */
export const ErrorMessage = memo(function ErrorMessage({ message, onClose }: ErrorMessageProps) {
  // 5秒後に自動的にエラーメッセージをクリア
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  // エラーがない場合は何も表示しない
  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 max-w-md mx-auto sm:mx-0 animate-slideInDown">
      <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-shogi-accent-danger rounded-lg shadow-strong px-4 py-3 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          {/* エラーアイコン - モダンデザイン */}
          <div className="flex-shrink-0 w-6 h-6 bg-shogi-accent-danger rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <div className="flex-1 pt-0.5">
            <p className="font-bold text-sm text-red-800 dark:text-red-200">エラー</p>
            <p className="text-sm mt-1 text-red-700 dark:text-red-300">{message}</p>
          </div>

          {/* 閉じるボタン - モダンデザイン */}
          <button
            onClick={onClose}
            className="flex-shrink-0 inline-flex text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100
                       focus:outline-none focus:ring-2 focus:ring-shogi-accent-danger rounded-full p-1
                       transition-colors duration-200 hover:bg-red-100 dark:hover:bg-red-800/50"
            aria-label="閉じる"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});
