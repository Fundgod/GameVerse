export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'classic' | 'comparison' | 'odd-even' | 'diagonal';
export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type ComparisonSymbol = '<' | '>' | '^' | 'v' | null;
export type OddEvenConstraint = 'odd' | 'even' | null; // null = žiadne obmedzenie

export interface Cell {
  value: CellValue;
  isInitial: boolean;
  isError: boolean;
  notes: Set<number>;
}

export interface Position {
  row: number;
  col: number;
}

// Symboly pre comparison režim medzi bunkami
export interface ComparisonData {
  horizontal: ComparisonSymbol[][]; // 9x8 - symboly medzi stĺpcami
  vertical: ComparisonSymbol[][];   // 8x9 - symboly medzi riadkami
}

export interface GameState {
  board: Cell[][];
  solution: number[][];
  initialBoard: number[][];
  difficulty: Difficulty;
  mode: GameMode;
  filledCells: number;
  mistakes: number;
  hintsUsed: number;
  timeElapsed: number;
  isNotesMode: boolean;
  selectedCell: Position | null;
  isComplete: boolean;
  undosRemaining: number;
  maxMistakes: number;
  isGameOver: boolean;
  comparisonData?: ComparisonData;  // Pre comparison režim
  oddEvenPattern?: OddEvenConstraint[][];  // Pre odd/even režim - 'odd', 'even', alebo null
}