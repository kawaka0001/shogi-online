/**
 * 駒の成りを選択するダイアログ - モダンデザイン
 * 詳細: #13, #18, パフォーマンス最適化, UI Redesign
 */

'use client';

import React, { memo } from 'react';
import type { PieceType, Player } from '@/types/shogi';
import { isPromotablePieceType } from '@/types/shogi';
import { getPieceName, getPromotedPieceName } from '@/lib/utils/piece';

export interface PromotionDialogProps {
  isOpen: boolean;
  pieceType: PieceType | null;
  player: Player | null;
  onPromote: () => void;
  onNotPromote: () => void;
}

export const PromotionDialog = memo(function PromotionDialog({
  isOpen,
  pieceType,
  player,
  onPromote,
  onNotPromote,
}: PromotionDialogProps) {
  if (!isOpen || !pieceType || !player) {
    return null;
  }

  // 型ガードで安全性を確保
  if (!isPromotablePieceType(pieceType)) {
    return null;
  }

  const pieceName = getPieceName(pieceType);
  const promotedName = getPromotedPieceName(pieceType);
  const playerName = player === 'black' ? '先手' : '後手';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* モダンモーダル */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-strong p-5 sm:p-6 md:p-8 max-w-xs sm:max-w-sm md:max-w-md w-full mx-4 animate-slideUp border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4 sm:mb-5 text-center">
          成りますか？
        </h2>

        <div className="text-center mb-5 sm:mb-6 md:mb-7">
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-2 sm:mb-3">
            {playerName}の駒
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <span
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-slate-100 font-serif"
              style={{
                fontFamily: 'var(--font-noto-serif-jp), "Noto Serif JP", serif',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              {pieceName}
            </span>
            <span className="text-2xl sm:text-3xl text-shogi-accent-primary">→</span>
            <span
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-shogi-accent-primary font-serif"
              style={{
                fontFamily: 'var(--font-noto-serif-jp), "Noto Serif JP", serif',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
            >
              {promotedName}
            </span>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={onPromote}
            className="flex-1 px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4
                       bg-shogi-accent-primary text-white font-bold rounded-xl
                       hover:bg-shogi-accent-primary/90 active:scale-95
                       transition-all duration-200 shadow-medium hover:shadow-strong
                       focus:outline-none focus:ring-2 focus:ring-shogi-accent-primary focus:ring-offset-2
                       text-sm sm:text-base md:text-lg"
          >
            成る
          </button>
          <button
            onClick={onNotPromote}
            className="flex-1 px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4
                       bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl
                       hover:bg-slate-400 dark:hover:bg-slate-500 active:scale-95
                       transition-all duration-200 shadow-soft hover:shadow-medium
                       focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
                       text-sm sm:text-base md:text-lg"
          >
            成らない
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-4 sm:mt-5 text-center">
          ⚠️ 成った駒は元に戻せません
        </p>
      </div>
    </div>
  );
});
