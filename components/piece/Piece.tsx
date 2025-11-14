/**
 * 駒コンポーネント
 * 詳細: #5, #6
 */

'use client';

import React from 'react';
import type { PieceProps } from '@/types/shogi';
import { getPieceName } from '@/lib/utils/piece';

export function Piece({ piece, size = 'medium', isDraggable = false }: PieceProps) {
  const pieceName = getPieceName(piece);
  const isBlack = piece.owner === 'black';

  // サイズに応じたクラス
  const sizeClasses = {
    small: 'text-sm w-6 h-6',
    medium: 'text-xl w-10 h-10 sm:w-12 sm:h-12',
    large: 'text-2xl w-14 h-14',
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
}
