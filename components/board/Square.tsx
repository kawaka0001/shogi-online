/**
 * マス（Square）コンポーネント - モダンデザイン
 * 詳細: #7, パフォーマンス最適化, UI Redesign
 */

'use client';

import React, { memo } from 'react';
import type { SquareProps } from '@/types/shogi';
import { Piece } from '@/components/piece/Piece';

/**
 * 将棋盤の1マスを表すコンポーネント（モダンUI版）
 *
 * デザインコンセプト:
 * - フラットデザイン + 控えめなシャドウ
 * - 状態をカラー + アニメーションで表現
 * - ミニマルで洗練された見た目
 */
export const Square = memo(function Square({
  position,
  piece,
  isSelected,
  isValidMove,
  isCheck,
  isLastMove,
  onClick,
}: SquareProps) {
  // 市松模様の背景色を決定（モダンカラー）
  const isEvenSquare = (position.rank + position.file) % 2 === 0;
  const baseColor = isEvenSquare ? 'bg-shogi-board-light' : 'bg-shogi-board-dark';

  // 状態に応じた背景色とスタイル
  let bgColor = baseColor;
  let additionalStyles = '';
  let borderStyle = 'border border-slate-400/20';

  if (isSelected) {
    // 選択中: 青グロー + 控えめなpulse
    bgColor = 'bg-blue-100 dark:bg-blue-900/30';
    additionalStyles = 'ring-2 ring-shogi-status-selected shadow-glow-blue animate-pulseSubtle';
    borderStyle = 'border-2 border-shogi-status-selected';
  } else if (isCheck) {
    // 王手: 赤グロー + シェイク
    bgColor = 'bg-red-100 dark:bg-red-900/30';
    additionalStyles = 'ring-2 ring-shogi-status-check shadow-glow-blue animate-shake';
    borderStyle = 'border-2 border-shogi-status-check';
  } else if (isLastMove) {
    // 最後の手: アンバーのハイライト
    bgColor = 'bg-amber-100 dark:bg-amber-900/30';
    additionalStyles = 'ring-1 ring-shogi-status-lastMove';
    borderStyle = 'border border-shogi-status-lastMove/50';
  } else if (isValidMove) {
    // 移動可能: 緑の半透明オーバーレイ
    additionalStyles = 'relative after:absolute after:inset-0 after:bg-shogi-status-valid/20 after:rounded-sm';
  }

  // クリック可能かどうか（駒がある、または移動可能マス）
  const isClickable = piece !== null || isValidMove;

  // ホバー効果（クリック可能なマスのみ）
  const hoverStyles = isClickable
    ? 'hover:brightness-105 hover:scale-105 transition-all duration-200 ease-out cursor-pointer'
    : 'transition-all duration-200 ease-out cursor-default';

  // フォーカススタイル（クリック可能なマスのみ）
  const focusStyles = isClickable
    ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shogi-accent-primary focus-visible:ring-offset-1'
    : '';

  // アクセシビリティ用のaria-label
  const ariaLabel = `${position.file + 1}筋${position.rank + 1}段${
    piece ? `, ${piece.owner === 'black' ? '先手' : '後手'}の駒` : ', 空マス'
  }${isSelected ? ', 選択中' : ''}${isValidMove ? ', 移動可能' : ''}${
    isCheck ? ', 王手' : ''
  }`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={`
        ${bgColor}
        ${borderStyle}
        ${additionalStyles}
        ${hoverStyles}
        ${focusStyles}
        w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-13 lg:h-13 xl:w-14 xl:h-14
        flex items-center justify-center
        relative
        flex-shrink-0
        rounded-sm
        backdrop-blur-sm
        disabled:cursor-default
      `}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* 移動可能マスのドットインジケーター（モダン版） */}
      {isValidMove && !piece && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 rounded-full bg-shogi-status-valid shadow-soft animate-pulseSubtle" />
        </div>
      )}

      {/* 駒の表示 */}
      {piece && <Piece piece={piece} size="medium" isDraggable={false} />}
    </button>
  );
});
