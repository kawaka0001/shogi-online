/**
 * 持ち駒表示コンポーネント
 * 詳細: #5, #11, #18, パフォーマンス最適化
 */

'use client';

import React, { memo } from 'react';
import type { CapturedPiecesProps } from '@/types/shogi';
import { PIECE_NAMES_JA } from '@/lib/game/constants';

// 持ち駒として表示する駒の順序（玉は持ち駒にならない）
const PIECE_ORDER = ['rook', 'bishop', 'gold', 'silver', 'knight', 'lance', 'pawn'] as const;

export const CapturedPieces = memo(function CapturedPieces({ player, pieces, onPieceClick }: CapturedPiecesProps) {
  const hasCapturedPieces = PIECE_ORDER.some(pieceType => pieces[pieceType] > 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 min-w-[200px] sm:min-w-[240px]">
      <h3 className="text-lg font-bold text-gray-800 mb-3 text-center border-b-2 border-gray-200 pb-2">
        {player === 'black' ? '先手の持ち駒' : '後手の持ち駒'}
      </h3>

      {!hasCapturedPieces ? (
        <div className="text-center text-gray-400 py-4 text-sm">
          なし
        </div>
      ) : (
        <div className="space-y-2">
          {PIECE_ORDER.map((pieceType) => {
            const count = pieces[pieceType];
            if (count === 0) return null;

            return (
              <div
                key={pieceType}
                className={`
                  flex items-center justify-between
                  px-3 py-2
                  rounded-md
                  transition-all
                  ${onPieceClick
                    ? 'cursor-pointer hover:bg-blue-50 hover:shadow-sm active:bg-blue-100'
                    : 'bg-gray-50'
                  }
                `}
                onClick={() => onPieceClick?.(pieceType)}
                role={onPieceClick ? 'button' : undefined}
                tabIndex={onPieceClick ? 0 : undefined}
              >
                <span
                  className="text-xl font-bold"
                  style={{
                    fontFamily: 'var(--font-noto-serif-jp), "Noto Serif JP", serif',
                  }}
                >
                  {PIECE_NAMES_JA[pieceType].normal}
                </span>
                {count > 1 && (
                  <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    ×{count}
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
