/**
 * 持ち駒表示コンポーネント - モダンデザイン
 * 詳細: #5, #11, #18, パフォーマンス最適化, UI Redesign
 */

'use client';

import React, { memo } from 'react';
import type { CapturedPiecesProps } from '@/types/shogi';
import { PIECE_NAMES_JA } from '@/lib/game/constants';

// 持ち駒として表示する駒の順序（玉は持ち駒にならない）
const PIECE_ORDER = ['rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'] as const;

export const CapturedPieces = memo(function CapturedPieces({ player, pieces, selectedPiece, onPieceClick }: CapturedPiecesProps) {
  const hasCapturedPieces = PIECE_ORDER.some(pieceType => pieces[pieceType] > 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-medium p-3 sm:p-4 md:p-5 min-w-[180px] sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px] xl:min-w-[260px] border border-slate-200 dark:border-slate-700">
      {/* ヘッダー - モダンデザイン */}
      <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 sm:mb-3 text-center border-b border-slate-200 dark:border-slate-700 pb-2">
        {player === 'black' ? '☗ 先手' : '☖ 後手'}
      </h3>

      {!hasCapturedPieces ? (
        <div className="text-center text-slate-400 dark:text-slate-500 py-4 sm:py-5 text-xs sm:text-sm font-medium">
          持ち駒なし
        </div>
      ) : (
        <div className="space-y-1 sm:space-y-1.5">
          {PIECE_ORDER.map((pieceType) => {
            const count = pieces[pieceType];
            if (count === 0) return null;

            // 選択中の持ち駒をハイライト + 控えめなpulse
            const isSelected = selectedPiece === pieceType;

            return (
              <div
                key={pieceType}
                className={`
                  flex items-center justify-between
                  px-2 py-1.5 sm:px-3 sm:py-2 md:px-3.5 md:py-2.5
                  rounded-lg
                  transition-all duration-200
                  ${isSelected
                    ? 'bg-shogi-accent-primary/20 dark:bg-shogi-accent-primary/30 ring-2 ring-shogi-accent-primary shadow-glow-blue animate-pulseSubtle'
                    : onPieceClick
                      ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-soft active:scale-95'
                      : 'bg-slate-50 dark:bg-slate-750'
                  }
                `}
                onClick={() => onPieceClick?.(pieceType)}
                role={onPieceClick ? 'button' : undefined}
                tabIndex={onPieceClick ? 0 : undefined}
                aria-label={`${PIECE_NAMES_JA[pieceType].normal} ${count}枚`}
              >
                <span
                  className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 font-serif"
                  style={{
                    fontFamily: 'var(--font-noto-serif-jp), "Noto Serif JP", serif',
                    textShadow: '0 1px 1px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {PIECE_NAMES_JA[pieceType].normal}
                </span>
                {count > 1 && (
                  <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full min-w-[28px] text-center">
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
