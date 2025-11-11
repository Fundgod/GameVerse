export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'classic' | 'comparison' | 'odd-even' | 'diagonal';
export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

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
}