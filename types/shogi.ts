/**
 * 将棋の型定義
 * 詳細: #4, #5
 */

// ========================================
// 基本型定義
// ========================================

/**
 * プレイヤー（先手/後手）
 * black: 先手（下側）
 * white: 後手（上側）
 */
export type Player = 'black' | 'white';

/**
 * 駒の種類
 */
export type PieceType =
  | 'king'    // 玉/王
  | 'rook'    // 飛
  | 'bishop'  // 角
  | 'gold'    // 金
  | 'silver'  // 銀
  | 'knight'  // 桂
  | 'lance'   // 香
  | 'pawn';   // 歩

/**
 * 駒の情報
 */
export type Piece = {
  type: PieceType;
  owner: Player;
  isPromoted: boolean;
};

/**
 * 盤面上の位置
 * rank: 段（0-8, 0が1段目、8が9段目）
 * file: 筋（0-8, 0が1筋、8が9筋）
 */
export type Position = {
  rank: number;  // 0-8
  file: number;  // 0-8
};

// ========================================
// 盤面関連
// ========================================

/**
 * 盤面（9x9）
 * board[rank][file]でアクセス
 * null = 空マス
 */
export type Board = (Piece | null)[][];

/**
 * マスの情報（UI用）
 */
export type Square = {
  position: Position;
  piece: Piece | null;
  isSelected: boolean;
  isValidMove: boolean;
  isCheck: boolean;
};

// ========================================
// 持ち駒
// ========================================

/**
 * プレイヤーごとの持ち駒
 */
export type PlayerCapturedPieces = {
  rook: number;
  bishop: number;
  gold: number;
  silver: number;
  knight: number;
  lance: number;
  pawn: number;
};

/**
 * 両プレイヤーの持ち駒
 */
export type CapturedPieces = {
  black: PlayerCapturedPieces;
  white: PlayerCapturedPieces;
};

// ========================================
// 移動・手
// ========================================

/**
 * 移動の種類
 */
export type MoveType = 'move' | 'drop';

/**
 * 駒の移動情報
 */
export type Move = {
  type: MoveType;
  from: Position | null;  // null = 持ち駒を打つ
  to: Position;
  piece: PieceType;
  isPromoted: boolean;      // 移動前に成っていたか
  shouldPromote: boolean;   // この手で成るか
  capturedPiece: PieceType | null;
  timestamp: Date;
};

// ========================================
// ゲーム状態
// ========================================

/**
 * ゲームの状態
 */
export type GameStatus =
  | 'waiting'      // 開始待ち
  | 'playing'      // 対局中
  | 'check'        // 王手
  | 'checkmate'    // 詰み
  | 'draw'         // 引き分け（千日手）
  | 'resignation'  // 投了
  | 'timeout';     // 時間切れ

/**
 * ゲーム全体の状態
 */
export type GameState = {
  board: Board;
  captured: CapturedPieces;
  currentTurn: Player;
  moveHistory: Move[];
  gameStatus: GameStatus;
  isCheck: boolean;
  selectedPosition: Position | null;
  validMoves: Position[];
  selectedCapturedPiece: PieceType | null;  // #12: 選択中の持ち駒
  lastMove: Move | null;
  errorMessage: string | null;  // 詳細: エラーUI実装
};

// ========================================
// SFEN関連
// ========================================

/**
 * SFEN形式の文字列
 * 例: "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1"
 */
export type SFENString = string;

/**
 * SFEN形式のパース結果
 */
export type SFENData = {
  board: Board;
  currentTurn: Player;
  captured: CapturedPieces;
  moveCount: number;
};

// ========================================
// ユーティリティ型
// ========================================

/**
 * 駒の移動可能な方向
 */
export type Direction = {
  rankDelta: number;  // -1, 0, 1 など
  fileDelta: number;
};

/**
 * 合法手の判定結果
 */
export type MoveValidation = {
  isValid: boolean;
  reason?: string;  // 不正な理由（二歩、打ち歩詰めなど）
};

/**
 * 禁じ手の種類
 */
export type IllegalMoveType =
  | 'nifu'              // 二歩
  | 'uchifuzume'        // 打ち歩詰め
  | 'ikidononai'        // 行き所のない駒
  | 'oute_houchi'       // 王手放置
  | 'invalid_position'  // 不正な位置
  | 'wrong_turn';       // 手番違反

// ========================================
// コンポーネントProps型
// ========================================

/**
 * Boardコンポーネントのprops
 */
export type BoardProps = {
  gameState: GameState;
  onSquareClick: (position: Position) => void;
  onPieceDrop?: (from: Position, to: Position) => void;
};

/**
 * Squareコンポーネントのprops
 */
export type SquareProps = {
  position: Position;
  piece: Piece | null;
  isSelected: boolean;
  isValidMove: boolean;
  isCheck: boolean;
  isLastMove: boolean;
  onClick: () => void;
};

/**
 * Pieceコンポーネントのprops
 */
export type PieceProps = {
  piece: Piece;
  size?: 'small' | 'medium' | 'large';
  isDraggable?: boolean;
};

/**
 * CapturedPiecesコンポーネントのprops
 */
export type CapturedPiecesProps = {
  player: Player;
  pieces: PlayerCapturedPieces;
  onPieceClick?: (pieceType: PieceType) => void;
};

/**
 * GameControlコンポーネントのprops
 */
export type GameControlProps = {
  gameStatus: GameStatus;
  currentTurn: Player;
  onNewGame: () => void;
  onResign: () => void;
  onUndo?: () => void;
};
