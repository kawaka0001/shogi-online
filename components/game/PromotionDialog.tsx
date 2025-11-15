/**
 * 駒の成りを選択するダイアログ
 * 詳細: #13, パフォーマンス最適化
 */

'use client';

import React, { memo } from 'react';
import type { PieceType, Player } from '@/types/shogi';

export interface PromotionDialogProps {
  isOpen: boolean;
  pieceType: PieceType | null;
  player: Player | null;
  onPromote: () => void;
  onNotPromote: () => void;
}

/**
 * 駒の種類を日本語名に変換
 */
function getPieceName(pieceType: PieceType): string {
  const names: Record<PieceType, string> = {
    king: '玉',
    rook: '飛',
    bishop: '角',
    gold: '金',
    silver: '銀',
    knight: '桂',
    lance: '香',
    pawn: '歩',
  };
  return names[pieceType] || '';
}

/**
 * 成駒の名前を取得
 */
function getPromotedName(pieceType: PieceType): string {
  const promotedNames: Record<string, string> = {
    pawn: 'と金',
    lance: '成香',
    knight: '成桂',
    silver: '成銀',
    rook: '竜王',
    bishop: '竜馬',
  };
  return promotedNames[pieceType] || '';
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

  const pieceName = getPieceName(pieceType);
  const promotedName = getPromotedName(pieceType);
  const playerName = player === 'black' ? '先手' : '後手';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
          駒を成りますか？
        </h2>

        <div className="text-center mb-6">
          <p className="text-gray-700 mb-2">
            {playerName}の{pieceName}
          </p>
          <p className="text-lg font-semibold text-blue-600">
            {pieceName} → {promotedName}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onPromote}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            成る
          </button>
          <button
            onClick={onNotPromote}
            className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            成らない
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          成った駒は元に戻せません
        </p>
      </div>
    </div>
  );
});
