/**
 * 将棋盤コンポーネント
 * 詳細: #5, #6, #7, #12, #13, #17, #18, パフォーマンス最適化
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { Square } from './Square';
import { GameResult } from '@/components/game/GameResult';
import { useGame } from '@/lib/context/GameContext';
import { BOARD_SIZE } from '@/lib/game/constants';
import type { Position } from '@/types/shogi';

/**
 * 将棋盤コンポーネント
 * GameContextから状態を取得し、Squareコンポーネントを使って盤面を表示
 * 成り選択ダイアログはGameContextで一元管理 (#13, #18)
 */
export function Board() {
  const {
    gameState,
    selectSquare: contextSelectSquare,
    newGame,
  } = useGame();

  // マスをクリックした時の処理 - useCallbackでメモ化してSquareの再レンダリングを防止
  // 詳細: #18 - 成り判定はGameContextのSELECT_SQUAREアクション内で処理
  const handleSquareClick = useCallback((position: Position) => {
    // 全ての処理をGameContextに委譲
    contextSelectSquare(position);
  }, [contextSelectSquare]);

  // 筋のラベル（9-1）
  const getFileLabel = (file: number): string => String(9 - file);

  // 段のラベル（一-九）
  const getRankLabel = (rank: number): string => {
    const labels = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return labels[rank];
  };

  // 詳細: #18 - パフォーマンス最適化: positionオブジェクトをメモ化して再生成を防止
  const boardPositions = useMemo(() => {
    const positions: Position[][] = [];
    for (let rank = 0; rank < BOARD_SIZE; rank++) {
      positions[rank] = [];
      for (let file = 0; file < BOARD_SIZE; file++) {
        positions[rank][file] = { rank, file };
      }
    }
    return positions;
  }, []); // 一度だけ作成

  // 詳細: #18 - パフォーマンス最適化: 判定関数をuseMemoでメモ化して毎回の計算を防止
  const isSquareSelected = useMemo(() => {
    return (rank: number, file: number): boolean => {
      if (!gameState.selectedPosition) return false;
      return (
        gameState.selectedPosition.rank === rank &&
        gameState.selectedPosition.file === file
      );
    };
  }, [gameState.selectedPosition]);

  const isSquareValidMove = useMemo(() => {
    return (rank: number, file: number): boolean => {
      return gameState.validMoves.some(
        (move) => move.rank === rank && move.file === file
      );
    };
  }, [gameState.validMoves]);

  const isSquareCheck = useMemo(() => {
    return (rank: number, file: number): boolean => {
      if (!gameState.isCheck) return false;
      const piece = gameState.board[rank][file];
      if (!piece || piece.type !== 'king') return false;
      return piece.owner === gameState.currentTurn;
    };
  }, [gameState.isCheck, gameState.board, gameState.currentTurn]);

  const isSquareLastMove = useMemo(() => {
    return (rank: number, file: number): boolean => {
      if (!gameState.lastMove) return false;
      return (
        (gameState.lastMove.from && gameState.lastMove.from.rank === rank && gameState.lastMove.from.file === file) ||
        (gameState.lastMove.to.rank === rank && gameState.lastMove.to.file === file)
      );
    };
  }, [gameState.lastMove]);

  return (
    <>
      <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
        {/* 筋のラベル（横軸: 9-1） - モダンデザイン */}
        <div className="flex">
          <div className="w-6 sm:w-7 md:w-8 lg:w-9" /> {/* 段ラベル用のスペース */}
          {Array.from({ length: BOARD_SIZE }).map((_, file) => (
            <div
              key={file}
              className="w-10 h-6 sm:w-11 sm:h-7 md:w-12 md:h-8 lg:w-13 lg:h-9 xl:w-14 xl:h-9 flex items-center justify-center text-xs sm:text-sm md:text-base font-semibold text-slate-600 dark:text-slate-400"
            >
              {getFileLabel(file)}
            </div>
          ))}
        </div>

        {/* 盤面本体 - モダンデザイン: 影とボーダーを追加 */}
        <div className="flex">
          {/* 段のラベル（縦軸: 一-九） */}
          <div className="flex flex-col">
            {Array.from({ length: BOARD_SIZE }).map((_, rank) => (
              <div
                key={rank}
                className="w-6 h-10 sm:w-7 sm:h-11 md:w-8 md:h-12 lg:w-9 lg:h-13 xl:w-9 xl:h-14 flex items-center justify-center text-xs sm:text-sm md:text-base font-semibold text-slate-600 dark:text-slate-400"
              >
                {getRankLabel(rank)}
              </div>
            ))}
          </div>

          {/* 9x9のマス - モダンデザイン: シャドウと丸角 */}
          <div className="inline-block rounded-md shadow-strong bg-shogi-board-bg border-2 border-slate-300 dark:border-slate-600 overflow-hidden">
            {gameState.board.map((row, rank) => (
              <div key={rank} className="flex">
                {row.map((piece, file) => {
                  const position = boardPositions[rank][file];
                  return (
                    <Square
                      key={`${rank}-${file}`}
                      position={position}
                      piece={piece}
                      isSelected={isSquareSelected(rank, file)}
                      isValidMove={isSquareValidMove(rank, file)}
                      isCheck={isSquareCheck(rank, file)}
                      isLastMove={isSquareLastMove(rank, file)}
                      onClick={() => handleSquareClick(position)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ゲーム結果モーダル (#17) */}
      <GameResult
        gameStatus={gameState.gameStatus}
        currentTurn={gameState.currentTurn}
        onNewGame={newGame}
      />
    </>
  );
}
