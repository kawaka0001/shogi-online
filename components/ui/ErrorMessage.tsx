/**
 * エラーメッセージ表示コンポーネント
 * 詳細: エラーUI実装
 */

'use client';

import { useEffect } from 'react';

type ErrorMessageProps = {
  message: string | null;
  onClose: () => void;
};

/**
 * エラーメッセージをトースト型UIで表示
 *
 * Features:
 * - 自動で5秒後に消える
 * - 閉じるボタン付き
 * - レスポンシブ対応
 *
 * Usage:
 * <ErrorMessage
 *   message={errorMessage}
 *   onClose={() => clearError()}
 * />
 */
export function ErrorMessage({ message, onClose }: ErrorMessageProps) {
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
    <div className="fixed top-4 right-4 z-50 max-w-md animate-fadeIn">
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {/* エラーアイコン */}
            <svg
              className="h-5 w-5 text-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="font-semibold text-sm">エラー</p>
            <p className="text-sm mt-1">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="inline-flex text-red-700 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded"
              aria-label="閉じる"
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
