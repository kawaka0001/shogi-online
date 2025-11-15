/**
 * 将棋盤コンポーネント
 * 詳細: #5, #6, #7, #12, #13, #17
 */

'use client';

import React, { useState } from 'react';
import { Square } from './Square';
import { CapturedPieces } from '@/components/captured/CapturedPieces';
import { PromotionDialog } from '@/components/game/PromotionDialog';
import { GameResult } from '@/components/game/GameResult';
import { useGame } from '@/lib/context/GameContext';
import { shouldOfferPromotion, mustPromote } from '@/lib/game/rules';
import { BOARD_SIZE } from '@/lib/game/constants';
import type { Position, Piece } from '@/types/shogi';

/**
 * 将棋盤コンポーネント
 * GameContextから状態を取得し、Squareコンポーネントを使って盤面を表示
 * 成り選択ダイアログも管理 (#13)
 */
export function Board() {
  const {
    gameState,
    selectSquare: contextSelectSquare,
    selectCapturedPiece,
    movePiece,
    newGame,
  } = useGame();

  // 成り選択ダイアログの状態管理 (#13)
  const [promotionState, setPromotionState] = useState<{
    isOpen: boolean;
    from: Position | null;
    to: Position | null;
    piece: Piece | null;
  }>({
    isOpen: false,
    from: null,
    to: null,
    piece: null,
  });

  // マスをクリックした時の処理（成り判定を含む）
  const handleSquareClick = (position: Position) => {
    const { selectedPosition, validMoves, board } = gameState;

    // 駒が選択されており、移動先が有効な場合
    if (selectedPosition) {
      const isValidMoveTarget = validMoves.some(
        (move) => move.rank === position.rank && move.file === position.file
      );

      if (isValidMoveTarget) {
        const piece = board[selectedPosition.rank][selectedPosition.file];

        if (piece) {
          // 成り判定 (#13)
          const canOffer = shouldOfferPromotion(selectedPosition, position, piece);
          const mustPromoteNow = mustPromote(piece.type, position, piece.owner);

          if (mustPromoteNow) {
            // 強制的に成る
            movePiece(selectedPosition, position, true);
          } else if (canOffer) {
            // 成り選択ダイアログを表示
            setPromotionState({
              isOpen: true,
              from: selectedPosition,
              to: position,
              piece,
            });
          } else {
            // 成らずに移動
            movePiece(selectedPosition, position, false);
          }
          return;
        }
      }
    }

    // 通常の駒選択処理
    contextSelectSquare(position);
  };

  // 成り選択ダイアログで「成る」を選択
  const handlePromote = () => {
    if (promotionState.from && promotionState.to) {
      movePiece(promotionState.from, promotionState.to, true);
      setPromotionState({
        isOpen: false,
        from: null,
        to: null,
        piece: null,
      });
    }
  };

  // 成り選択ダイアログで「成らない」を選択
  const handleNotPromote = () => {
    if (promotionState.from && promotionState.to) {
      movePiece(promotionState.from, promotionState.to, false);
      setPromotionState({
        isOpen: false,
        from: null,
        to: null,
        piece: null,
      });
    }
  };

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
    <>
      <div className="flex flex-col items-center gap-2 sm:gap-4">
        {/* 後手エリア */}
        <div className="w-full max-w-md mb-2">
          <CapturedPieces
            player="white"
            pieces={gameState.captured.white}
            onPieceClick={selectCapturedPiece}
          />
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
                      onClick={() => handleSquareClick(position)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 先手エリア */}
        <div className="w-full max-w-md mt-2">
          <CapturedPieces
            player="black"
            pieces={gameState.captured.black}
            onPieceClick={selectCapturedPiece}
          />
        </div>
      </div>

      {/* 成り選択ダイアログ (#13) */}
      <PromotionDialog
        isOpen={promotionState.isOpen}
        pieceType={promotionState.piece?.type || null}
        player={promotionState.piece?.owner || null}
        onPromote={handlePromote}
        onNotPromote={handleNotPromote}
      />

      {/* ゲーム結果モーダル (#17) */}
      <GameResult
        gameStatus={gameState.gameStatus}
        currentTurn={gameState.currentTurn}
        onNewGame={newGame}
      />
    </>
  );
}
