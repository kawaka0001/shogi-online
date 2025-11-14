/**
 * ゲーム制御コンポーネント
 * 詳細: #5
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

  return (
    <div className="game-control">
      <div className="status-display">
        <h2>{getStatusText()}</h2>
      </div>

      <div className="control-buttons">
        <button onClick={onNewGame} className="btn btn-primary">
          新規対局
        </button>

        {gameStatus === 'playing' && (
          <>
            <button onClick={onResign} className="btn btn-danger">
              投了
            </button>

            {onUndo && (
              <button onClick={onUndo} className="btn btn-secondary">
                1手戻す
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
