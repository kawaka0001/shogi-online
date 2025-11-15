/**
 * 駒コンポーネント
 * 詳細: #5, #6, パフォーマンス最適化
 */

'use client';

import React, { memo } from 'react';
import type { PieceProps } from '@/types/shogi';
import { getPieceName } from '@/lib/utils/piece';

export const Piece = memo(function Piece({ piece, size = 'medium', isDraggable = false }: PieceProps) {
  const pieceName = getPieceName(piece);
  const isBlack = piece.owner === 'black';

  // サイズに応じたクラス - 詳細: #18 レスポンシブ対応
  const sizeClasses = {
    small: 'w-6 h-6 text-xs sm:text-sm',
    medium: 'w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl',
    large: 'w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 text-xl sm:text-2xl md:text-3xl',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        font-bold
        select-none
        ${isBlack ? 'text-gray-900' : 'text-gray-900 rotate-180'}
        ${isDraggable ? 'cursor-move' : ''}
      `}
      style={{
        // 将棋駒の伝統的なスタイル
        fontFamily: 'var(--font-noto-serif-jp), "Noto Serif JP", serif',
      }}
      draggable={isDraggable}
    >
      {pieceName}
    </div>
  );
});
