/**
 * 駒コンポーネント - モダンデザイン
 * 詳細: #5, #6, パフォーマンス最適化, UI Redesign
 */

'use client';

import React, { memo } from 'react';
import type { PieceProps } from '@/types/shogi';
import { getPieceName } from '@/lib/utils/piece';

export const Piece = memo(function Piece({ piece, size = 'medium', isDraggable = false }: PieceProps) {
  const pieceName = getPieceName(piece);
  const isBlack = piece.owner === 'black';

  // サイズに応じたクラス - レスポンシブ対応 + モダンデザイン
  const sizeClasses = {
    small: 'w-6 h-6 text-xs sm:text-sm',
    medium: 'w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-13 lg:h-13 xl:w-14 xl:h-14 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-2xl',
    large: 'w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 text-xl sm:text-2xl md:text-3xl',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        font-serif font-bold
        select-none
        ${isBlack ? 'text-shogi-piece-black' : 'text-shogi-piece-white rotate-180'}
        ${isDraggable ? 'cursor-move' : ''}
        transition-transform duration-150 ease-out
        drop-shadow-sm
      `}
      style={{
        // 将棋駒の伝統的な明朝体フォント
        fontFamily: 'var(--font-noto-serif-jp), "Noto Serif JP", serif',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        letterSpacing: '-0.02em',
      }}
      draggable={isDraggable}
    >
      {pieceName}
    </div>
  );
});
