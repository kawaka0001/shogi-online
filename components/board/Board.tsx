/**
 * 将棋盤コンポーネント
 * 詳細: #5, #6, #7, #17
 */

'use client';

import React from 'react';
import { Square } from './Square';
import { useGame } from '@/lib/context/GameContext';
import { BOARD_SIZE } from '@/lib/game/constants';
import { GameResult } from '@/components/game/GameResult';

/**
 * 将棋盤コンポーネント
 * GameContextから状態を取得し、Squareコンポーネントを使って盤面を表示
 */
export function Board() {
  const { gameState, selectSquare, newGame } = useGame();

  // 筋のラベル（9-1）
  const getFileLabel = (file: number): string => String(9 - file);

  // 段のラベル（一-九）
  const getRankLabel = (rank: number): string => {
    const labels = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return labels[rank];
  };

  // 指定されたマスが選択中かどうか
  const isSquareSelected = (rank: number, file: number): boolean => {
    if (!gameState.selectedPosition) return false;
    return (
      gameState.selectedPosition.rank === rank &&
      gameState.selectedPosition.file === file
    );
  };

  // 指定されたマスが移動可能かどうか
  const isSquareValidMove = (rank: number, file: number): boolean => {
    return gameState.validMoves.some(
      (pos) => pos.rank === rank && pos.file === file
    );
  };

  // 指定されたマスが王手を受けているかどうか
  const isSquareCheck = (rank: number, file: number): boolean => {
    if (!gameState.isCheck) return false;
    const piece = gameState.board[rank][file];
    if (!piece) return false;
    // 王手を受けているのは現在の手番の玉
    return piece.type === 'king' && piece.owner === gameState.currentTurn;
  };

  // 指定されたマスが最後の手のマスかどうか
  const isSquareLastMove = (rank: number, file: number): boolean => {
    if (!gameState.lastMove) return false;
    const { to } = gameState.lastMove;
    return to.rank === rank && to.file === file;
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
          {Array.from({ length: BOARD_SIZE }).map((_, rank) => (
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
          {gameState.board.map((row, rank) => (
            <div key={rank} className="flex">
              {row.map((piece, file) => {
                const position = { rank, file };
                return (
                  <Square
                    key={`${rank}-${file}`}
                    position={position}
                    piece={piece}
                    isSelected={isSquareSelected(rank, file)}
                    isValidMove={isSquareValidMove(rank, file)}
                    isCheck={isSquareCheck(rank, file)}
                    isLastMove={isSquareLastMove(rank, file)}
                    onClick={() => selectSquare(position)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 先手エリア */}
      <div className="text-sm sm:text-base font-semibold text-gray-700">
        先手
      </div>

      {/* ゲーム結果モーダル (#17) */}
      <GameResult
        gameStatus={gameState.gameStatus}
        currentTurn={gameState.currentTurn}
        onNewGame={newGame}
      />
    </div>
  );
}
