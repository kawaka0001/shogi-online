/**
 * ゲーム結果表示コンポーネント - モダンデザイン
 * 詳細: #17, パフォーマンス最適化, UI Redesign
 */

'use client';

import React, { memo } from 'react';
import type { GameStatus, Player } from '@/types/shogi';
import { getPlayerName } from '@/lib/utils/piece';

export type GameResultProps = {
  gameStatus: GameStatus;
  currentTurn: Player;
  onNewGame: () => void;
};

export const GameResult = memo(function GameResult({ gameStatus, currentTurn, onNewGame }: GameResultProps) {
  // ゲーム終了状態でない場合は何も表示しない
  if (gameStatus !== 'checkmate' && gameStatus !== 'resignation' && gameStatus !== 'draw' && gameStatus !== 'timeout') {
    return null;
  }

  const getResultMessage = () => {
    switch (gameStatus) {
      case 'checkmate':
        // 詰みの場合、現在の手番のプレイヤーが負け
        const winner = currentTurn === 'black' ? 'white' : 'black';
        return {
          title: '詰み！',
          message: `${getPlayerName(winner)}の勝利`,
          emoji: '👑',
          color: 'text-shogi-accent-primary',
        };
      case 'resignation':
        // 投了の場合、現在の手番のプレイヤーが負け
        const resignationWinner = currentTurn === 'black' ? 'white' : 'black';
        return {
          title: '投了',
          message: `${getPlayerName(resignationWinner)}の勝利`,
          emoji: '🏳️',
          color: 'text-slate-600 dark:text-slate-400',
        };
      case 'draw':
        return {
          title: '引き分け',
          message: '千日手により引き分け',
          emoji: '🤝',
          color: 'text-slate-600 dark:text-slate-400',
        };
      case 'timeout':
        return {
          title: '時間切れ',
          message: `${getPlayerName(currentTurn === 'black' ? 'white' : 'black')}の勝利`,
          emoji: '⏰',
          color: 'text-shogi-accent-warning',
        };
      default:
        return {
          title: 'ゲーム終了',
          message: '',
          emoji: '🎮',
          color: 'text-slate-800 dark:text-slate-200',
        };
    }
  };

  const result = getResultMessage();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
      {/* モダンな勝利モーダル */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-strong p-7 sm:p-9 md:p-12 max-w-sm sm:max-w-md md:max-w-lg w-full mx-4 text-center animate-slideUp border-2 border-slate-200 dark:border-slate-700">
        <div className="text-6xl sm:text-7xl md:text-8xl mb-4 sm:mb-5 md:mb-6 animate-scaleIn">{result.emoji}</div>
        <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 ${result.color}`}>{result.title}</h2>
        <p className="text-xl sm:text-2xl md:text-3xl text-slate-700 dark:text-slate-300 mb-6 sm:mb-8 font-medium">{result.message}</p>

        <button
          onClick={onNewGame}
          className="w-full bg-shogi-accent-primary hover:bg-shogi-accent-primary/90 text-white font-bold
                     py-3 px-6 sm:py-4 sm:px-8 md:py-5 md:px-10 rounded-xl
                     transition-all duration-200 shadow-medium hover:shadow-strong active:scale-95
                     text-base sm:text-lg md:text-xl
                     focus:outline-none focus:ring-2 focus:ring-shogi-accent-primary focus:ring-offset-2"
        >
          新しい対局を始める
        </button>
      </div>
    </div>
  );
});
