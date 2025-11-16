/**
 * パフォーマンステスト: 詰み判定の性能検証
 * Issue #58 Warning #5
 */

import { isCheckmate } from '@/lib/game/rules';
import type { Board, Player } from '@/types/shogi';

describe('Checkmate Performance Test', () => {
  // 標準的な中盤の盤面（詰みではない状態）
  const createMidGameBoard = (): Board => {
    const board: Board = Array(9).fill(null).map(() => Array(9).fill(null));

    // 先手の玉
    board[8][4] = { type: 'king', owner: 'black', isPromoted: false };

    // 後手の玉
    board[0][4] = { type: 'king', owner: 'white', isPromoted: false };

    // 先手の駒
    board[7][3] = { type: 'gold', owner: 'black', isPromoted: false };
    board[7][5] = { type: 'gold', owner: 'black', isPromoted: false };
    board[6][2] = { type: 'silver', owner: 'black', isPromoted: false };
    board[6][6] = { type: 'silver', owner: 'black', isPromoted: false };
    board[8][1] = { type: 'rook', owner: 'black', isPromoted: false };
    board[8][7] = { type: 'bishop', owner: 'black', isPromoted: false };

    // 後手の駒
    board[1][3] = { type: 'gold', owner: 'white', isPromoted: false };
    board[1][5] = { type: 'gold', owner: 'white', isPromoted: false };
    board[2][2] = { type: 'silver', owner: 'white', isPromoted: false };
    board[2][6] = { type: 'silver', owner: 'white', isPromoted: false };
    board[0][1] = { type: 'rook', owner: 'white', isPromoted: false };
    board[0][7] = { type: 'bishop', owner: 'white', isPromoted: false };

    return board;
  };

  test('詰み判定が100ms以内に完了すること', () => {
    const board = createMidGameBoard();
    const player: Player = 'black';

    const startTime = performance.now();
    const result = isCheckmate(board, player);
    const endTime = performance.now();

    const duration = endTime - startTime;

    console.log(`詰み判定処理時間: ${duration.toFixed(2)}ms`);

    // 目標: 100ms以内
    expect(duration).toBeLessThan(100);
    expect(result).toBe(false); // 詰みではない
  });

  test('複数回実行しても安定したパフォーマンスを維持すること', () => {
    const board = createMidGameBoard();
    const player: Player = 'black';
    const iterations = 10;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      isCheckmate(board, player);
      const endTime = performance.now();
      durations.push(endTime - startTime);
    }

    const avgDuration = durations.reduce((a, b) => a + b) / iterations;
    const maxDuration = Math.max(...durations);

    console.log(`平均処理時間: ${avgDuration.toFixed(2)}ms`);
    console.log(`最大処理時間: ${maxDuration.toFixed(2)}ms`);
    console.log(`全処理時間: ${durations.map(d => d.toFixed(2)).join('ms, ')}ms`);

    // 平均が100ms以内
    expect(avgDuration).toBeLessThan(100);
    // 最大でも150ms以内（安定性確認）
    expect(maxDuration).toBeLessThan(150);
  });

  test('Immer最適化により盤面コピーが効率的であること', () => {
    const board = createMidGameBoard();
    const player: Player = 'white';

    // メモリ使用量の変化を確認（間接的）
    const startTime = performance.now();

    // 詰み判定を実行（内部で多数の盤面コピーが発生）
    isCheckmate(board, player);

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Immer最適化後の処理時間: ${duration.toFixed(2)}ms`);

    // 最適化により大幅な高速化が期待される
    expect(duration).toBeLessThan(100);
  });
});
