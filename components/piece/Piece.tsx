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
  const className = `piece piece-${piece.owner} piece-${size} ${isDraggable ? 'draggable' : ''}`;

  return (
    <div className={className} draggable={isDraggable}>
      <span className="piece-text">{pieceName}</span>
    </div>
  );
}
