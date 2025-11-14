/**
 * 持ち駒表示コンポーネント
 * 詳細: #5, #11
 */

'use client';

import React from 'react';
import type { CapturedPiecesProps } from '@/types/shogi';
import { PIECE_NAMES_JA } from '@/lib/game/constants';

// 持ち駒として表示する駒の順序（玉は持ち駒にならない）
const PIECE_ORDER = ['rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'] as const;

export function CapturedPieces({ player, pieces, onPieceClick }: CapturedPiecesProps) {
  return (
    <div className={`captured-pieces captured-pieces-${player}`}>
      <h3 className="captured-title">{player === 'black' ? '先手の持ち駒' : '後手の持ち駒'}</h3>
      <div className="captured-list">
        {PIECE_ORDER.map((pieceType) => {
          const count = pieces[pieceType];
          if (count === 0) return null;

          return (
            <div
              key={pieceType}
              className="captured-item"
              onClick={() => onPieceClick?.(pieceType)}
            >
              <span className="captured-piece-name">{PIECE_NAMES_JA[pieceType].normal}</span>
              {count > 1 && <span className="captured-count">×{count}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
