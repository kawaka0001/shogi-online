/**
 * ゲーム制御コンポーネント
 * 詳細: #5, #18
 */

'use client';

import React from 'react';
import type { GameControlProps } from '@/types/shogi';
import { getPlayerName } from '@/lib/utils/piece';

export function GameControl({
  gameStatus,
  currentTurn,
  onNewGame,
  onResign,
  onUndo,
}: GameControlProps) {
  const getStatusText = () => {
    switch (gameStatus) {
      case 'waiting':
        return '対局準備中';
      case 'playing':
        return `${getPlayerName(currentTurn)}の手番`;
      case 'check':
        return `王手！（${getPlayerName(currentTurn)}の手番）`;
      case 'checkmate':
        return `詰み - ${getPlayerName(currentTurn === 'black' ? 'white' : 'black')}の勝ち`;
      case 'draw':
        return '引き分け（千日手）';
      case 'resignation':
        return `投了 - ${getPlayerName(currentTurn === 'black' ? 'white' : 'black')}の勝ち`;
      case 'timeout':
        return '時間切れ';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (gameStatus) {
      case 'check':
        return 'text-red-600 font-bold';
      case 'checkmate':
      case 'resignation':
        return 'text-blue-600 font-bold';
      case 'draw':
        return 'text-gray-600 font-bold';
      default:
        return 'text-gray-800';
    }
  };

  const isGameOver = gameStatus === 'checkmate' || gameStatus === 'resignation' || gameStatus === 'draw' || gameStatus === 'timeout';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* ステータス表示 */}
      <div className="text-center mb-4">
        <h2 className={`text-xl sm:text-2xl ${getStatusColor()}`}>
          {getStatusText()}
        </h2>

        {/* ゲーム終了時の追加メッセージ (#17) */}
        {isGameOver && (
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            「新規対局」で再度対局できます
          </p>
        )}
      </div>

      {/* コントロールボタン */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        <button
          onClick={onNewGame}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg
                     hover:bg-blue-700 active:bg-blue-800 transition-colors
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     text-sm sm:text-base"
        >
          新規対局
        </button>

        {gameStatus === 'playing' && (
          <>
            <button
              onClick={onResign}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-red-600 text-white font-semibold rounded-lg
                         hover:bg-red-700 active:bg-red-800 transition-colors
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                         text-sm sm:text-base"
            >
              投了
            </button>

            {onUndo && (
              <button
                onClick={onUndo}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-600 text-white font-semibold rounded-lg
                           hover:bg-gray-700 active:bg-gray-800 transition-colors
                           focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                           text-sm sm:text-base"
              >
                1手戻す
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
