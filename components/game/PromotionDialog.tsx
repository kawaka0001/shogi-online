/**
 * 駒の成りを選択するダイアログ
 * 詳細: #13, #18, パフォーマンス最適化
 */

'use client';

import React, { memo } from 'react';
import type { PieceType, Player } from '@/types/shogi';
import { isPromotablePieceType } from '@/types/shogi';
import { getPieceName, getPromotedPieceName } from '@/lib/utils/piece';

export interface PromotionDialogProps {
  isOpen: boolean;
  pieceType: PieceType | null;
  player: Player | null;
  onPromote: () => void;
  onNotPromote: () => void;
}

export const PromotionDialog = memo(function PromotionDialog({
  isOpen,
  pieceType,
  player,
  onPromote,
  onNotPromote,
}: PromotionDialogProps) {
  if (!isOpen || !pieceType || !player) {
    return null;
  }

  // 型ガードで安全性を確保 - 詳細: #18
  if (!isPromotablePieceType(pieceType)) {
    return null;
  }

  const pieceName = getPieceName(pieceType);
  const promotedName = getPromotedPieceName(pieceType);
  const playerName = player === 'black' ? '先手' : '後手';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      {/* 詳細: #18 レスポンシブ対応 */}
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 md:p-8 max-w-xs sm:max-w-sm md:max-w-md w-full mx-4 animate-scaleIn">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
          駒を成りますか？
        </h2>

        <div className="text-center mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-gray-700 mb-1 sm:mb-2">
            {playerName}の{pieceName}
          </p>
          <p className="text-base sm:text-lg md:text-xl font-semibold text-blue-600">
            {pieceName} → {promotedName}
          </p>
        </div>

        <div className="flex gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={onPromote}
            className="flex-1 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm sm:text-base md:text-lg"
          >
            成る
          </button>
          <button
            onClick={onNotPromote}
            className="flex-1 px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm sm:text-base md:text-lg"
          >
            成らない
          </button>
        </div>

        <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 text-center">
          成った駒は元に戻せません
        </p>
      </div>
    </div>
  );
});
