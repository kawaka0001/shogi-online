/**
 * ゲーム結果表示コンポーネント
 * 詳細: #17, パフォーマンス最適化
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
          message: `${getPlayerName(winner)}の勝ち`,
          emoji: '🎉',
        };
      case 'resignation':
        // 投了の場合、現在の手番のプレイヤーが負け
        const resignationWinner = currentTurn === 'black' ? 'white' : 'black';
        return {
          title: '投了',
          message: `${getPlayerName(resignationWinner)}の勝ち`,
          emoji: '🏳️',
        };
      case 'draw':
        return {
          title: '引き分け',
          message: '千日手により引き分け',
          emoji: '🤝',
        };
      case 'timeout':
        return {
          title: '時間切れ',
          message: `${getPlayerName(currentTurn === 'black' ? 'white' : 'black')}の勝ち`,
          emoji: '⏰',
        };
      default:
        return {
          title: 'ゲーム終了',
          message: '',
          emoji: '🎮',
        };
    }
  };

  const result = getResultMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="text-6xl mb-4">{result.emoji}</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{result.title}</h2>
        <p className="text-xl text-gray-700 mb-6">{result.message}</p>

        <button
          onClick={onNewGame}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          新しい対局を始める
        </button>
      </div>
    </div>
  );
});
