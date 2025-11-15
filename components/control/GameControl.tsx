/**
 * ゲーム制御コンポーネント - モダンデザイン
 * 詳細: #5, #18, パフォーマンス最適化, UI Redesign
 */

'use client';

import React, { memo } from 'react';
import type { GameControlProps } from '@/types/shogi';
import { getPlayerName } from '@/lib/utils/piece';

export const GameControl = memo(function GameControl({
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
        return 'text-shogi-status-check dark:text-shogi-status-check font-bold';
      case 'checkmate':
      case 'resignation':
        return 'text-shogi-accent-primary dark:text-shogi-accent-primary font-bold';
      case 'draw':
        return 'text-slate-600 dark:text-slate-400 font-bold';
      default:
        return 'text-slate-800 dark:text-slate-200';
    }
  };

  const isGameOver = gameStatus === 'checkmate' || gameStatus === 'resignation' || gameStatus === 'draw' || gameStatus === 'timeout';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-medium p-4 sm:p-5 md:p-6 lg:p-7 border border-slate-200 dark:border-slate-700">
      {/* ステータス表示 - モダンデザイン */}
      <div className="text-center mb-4 sm:mb-5">
        <h2 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl ${getStatusColor()}`}>
          {getStatusText()}
        </h2>

        {/* ゲーム終了時の追加メッセージ */}
        {isGameOver && (
          <p className="mt-2 sm:mt-2.5 text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400">
            新しい対局を開始できます
          </p>
        )}
      </div>

      {/* コントロールボタン - モダンデザイン */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 md:gap-3">
        <button
          onClick={onNewGame}
          className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 lg:px-7 lg:py-3.5
                     bg-shogi-accent-primary text-white font-semibold rounded-lg
                     hover:bg-shogi-accent-primary/90 active:scale-95
                     transition-all duration-200 shadow-soft hover:shadow-medium
                     focus:outline-none focus:ring-2 focus:ring-shogi-accent-primary focus:ring-offset-2
                     text-xs sm:text-sm md:text-base"
        >
          新規対局
        </button>

        {gameStatus === 'playing' && (
          <>
            <button
              onClick={onResign}
              className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 lg:px-7 lg:py-3.5
                         bg-shogi-accent-danger text-white font-semibold rounded-lg
                         hover:bg-shogi-accent-danger/90 active:scale-95
                         transition-all duration-200 shadow-soft hover:shadow-medium
                         focus:outline-none focus:ring-2 focus:ring-shogi-accent-danger focus:ring-offset-2
                         text-xs sm:text-sm md:text-base"
            >
              投了
            </button>

            {onUndo && (
              <button
                onClick={onUndo}
                className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 lg:px-7 lg:py-3.5
                           bg-slate-600 dark:bg-slate-700 text-white font-semibold rounded-lg
                           hover:bg-slate-700 dark:hover:bg-slate-600 active:scale-95
                           transition-all duration-200 shadow-soft hover:shadow-medium
                           focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                           text-xs sm:text-sm md:text-base"
              >
                1手戻す
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});
