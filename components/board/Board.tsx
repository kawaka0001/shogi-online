/**
 * 将棋盤コンポーネント
 * 詳細: #5, #6
 */

'use client';

import React from 'react';
import type { BoardProps } from '@/types/shogi';
import { BOARD_SIZE } from '@/lib/game/constants';

export function Board({ gameState, onSquareClick }: BoardProps) {
  return (
    <div className="board-container">
      <div className="board-grid">
        {/* TODO: マス目の描画（#6で実装） */}
        {Array.from({ length: BOARD_SIZE }).map((_, rank) => (
          <div key={rank} className="board-row">
            {Array.from({ length: BOARD_SIZE }).map((_, file) => (
              <div
                key={`${rank}-${file}`}
                className="board-square"
                onClick={() => onSquareClick({ rank, file })}
              >
                {/* TODO: 駒の表示（#6で実装） */}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
