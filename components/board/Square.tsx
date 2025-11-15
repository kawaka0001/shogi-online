/**
 * マス（Square）コンポーネント
 * 詳細: #7, パフォーマンス最適化
 */

'use client';

import React, { memo } from 'react';
import type { SquareProps } from '@/types/shogi';
import { Piece } from '@/components/piece/Piece';

/**
 * 将棋盤の1マスを表すコンポーネント
 *
 * 機能:
 * - クリック可能なマス表示
 * - 選択状態のハイライト
 * - 移動可能マスのハイライト
 * - 王手マスのハイライト
 * - 最後に動いた駒のハイライト
 * - キーボードナビゲーション対応
 *
 * @param position - マスの位置（rank: 0-8, file: 0-8）
 * @param piece - マス上の駒（null = 空マス）
 * @param isSelected - 選択中のマスかどうか
 * @param isValidMove - 移動可能なマスかどうか
 * @param isCheck - 王手がかかっているマスかどうか
 * @param isLastMove - 最後に動いた駒があるマスかどうか
 * @param onClick - マスクリック時のハンドラ
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
  // 市松模様の背景色を決定
  const isEvenSquare = (position.rank + position.file) % 2 === 0;
  const baseColor = isEvenSquare ? 'bg-amber-100' : 'bg-amber-200';

  // 状態に応じた背景色とスタイル
  let bgColor = baseColor;
  let additionalStyles = '';

  if (isSelected) {
    // 選択中のマス: 青いリング + pulseアニメーション (詳細: #18)
    additionalStyles = 'ring-4 ring-blue-500 ring-inset animate-pulse';
  } else if (isCheck) {
    // 王手がかかっているマス: 赤背景
    bgColor = 'bg-red-200';
  } else if (isLastMove) {
    // 最後に動いた駒があるマス: 黄色背景
    bgColor = 'bg-yellow-200';
  } else if (isValidMove) {
    // 移動可能なマス: 緑の半透明オーバーレイ
    additionalStyles = 'relative after:absolute after:inset-0 after:bg-green-500/30';
  }

  // ホバースタイル + トランジション (詳細: #18)
  const hoverStyles = 'hover:opacity-80 transition-all duration-200 ease-in-out';

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
      className={`
        ${bgColor}
        ${additionalStyles}
        ${hoverStyles}
        w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16
        flex items-center justify-center
        border border-gray-400
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
        cursor-pointer
        relative
        flex-shrink-0
      `}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        // Enterキーまたはスペースキーでクリックと同じ動作
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* 移動可能マスのドットインジケーター - 詳細: #18 レスポンシブ対応 */}
      {isValidMove && !piece && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-4 lg:h-4 xl:w-5 xl:h-5 rounded-full bg-green-600 opacity-70" />
        </div>
      )}

      {/* 駒の表示 */}
      {piece && <Piece piece={piece} size="medium" isDraggable={false} />}
    </button>
  );
});
