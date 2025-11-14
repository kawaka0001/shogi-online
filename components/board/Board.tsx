/**
 * 将棋盤コンポーネント
 * 詳細: #5, #6
 */

'use client';

import React from 'react';
import type { Board as BoardType } from '@/types/shogi';
import { Piece } from '@/components/piece/Piece';
import { BOARD_SIZE } from '@/lib/game/constants';

export type SimpleBoardProps = {
  board: BoardType;
};

export function Board({ board }: SimpleBoardProps) {
  // 筋のラベル（9-1）
  const getFileLabel = (file: number): string => String(9 - file);

  // 段のラベル（一-九）
  const getRankLabel = (rank: number): string => {
    const labels = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return labels[rank];
  };

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-4">
      {/* 後手エリア */}
      <div className="text-sm sm:text-base font-semibold text-gray-700">
        後手
      </div>

      {/* 筋のラベル（横軸: 9-1） */}
      <div className="flex">
        <div className="w-6 sm:w-8" /> {/* 段ラベル用のスペース */}
        {Array.from({ length: BOARD_SIZE }).map((_, file) => (
          <div
            key={file}
            className="w-10 h-6 sm:w-12 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-semibold"
          >
            {getFileLabel(file)}
          </div>
        ))}
      </div>

      {/* 盤面本体 */}
      <div className="flex">
        {/* 段のラベル（縦軸: 一-九） */}
        <div className="flex flex-col">
          {board.map((_, rank) => (
            <div
              key={rank}
              className="w-6 h-10 sm:w-8 sm:h-12 flex items-center justify-center text-xs sm:text-sm font-semibold"
            >
              {getRankLabel(rank)}
            </div>
          ))}
        </div>

        {/* 9x9のマス */}
        <div className="inline-block border-2 border-gray-800 bg-amber-50">
          {board.map((row, rank) => (
            <div key={rank} className="flex">
              {row.map((piece, file) => (
                <div
                  key={`${rank}-${file}`}
                  className="
                    w-10 h-10
                    sm:w-12 sm:h-12
                    border border-gray-400
                    flex items-center justify-center
                    bg-amber-50
                    hover:bg-amber-100
                    transition-colors
                    cursor-pointer
                  "
                >
                  {piece && <Piece piece={piece} size="medium" />}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 先手エリア */}
      <div className="text-sm sm:text-base font-semibold text-gray-700">
        先手
      </div>
    </div>
  );
}
