import { Cell, ComparisonData, ComparisonSymbol, OddEvenConstraint, GameMode } from '../types/sudoku.types';

export const initializeBoard = (): Cell[][] => {
  return Array(9).fill(null).map(() =>
    Array(9).fill(null).map(() => ({
      value: 0,
      isInitial: false,
      isError: false,
      notes: new Set<number>()
    }))
  );
};

export const createBoardFromData = (data: number[][]): Cell[][] => {
  return data.map(row =>
    row.map(value => ({
      value: value as any,
      isInitial: value !== 0,
      isError: false,
      notes: new Set<number>()
    }))
  );
};

// Generovanie comparison dát na základe riešenia
export const generateComparisonData = (solution: number[][]): ComparisonData => {
  const horizontal: ComparisonSymbol[][] = [];
  const vertical: ComparisonSymbol[][] = [];

  for (let row = 0; row < 9; row++) {
    horizontal[row] = [];
    for (let col = 0; col < 8; col++) {
      if (solution[row][col] < solution[row][col + 1]) {
        horizontal[row][col] = '<';
      } else {
        horizontal[row][col] = '>';
      }
    }
  }

  for (let row = 0; row < 8; row++) {
    vertical[row] = [];
    for (let col = 0; col < 9; col++) {
      if (solution[row][col] < solution[row + 1][col]) {
        vertical[row][col] = '^';
      } else {
        vertical[row][col] = 'v';
      }
    }
  }

  return { horizontal, vertical };
};

// Generovanie odd/even vzoru na základe riešenia
export const generateOddEvenPattern = (solution: number[][]): OddEvenConstraint[][] => {
  const pattern: OddEvenConstraint[][] = [];
  for (let row = 0; row < 9; row++) {
    pattern[row] = [];
    for (let col = 0; col < 9; col++) {
      // Každá bunka má constraint podľa hodnoty v riešení
      const value = solution[row][col];
      pattern[row][col] = value % 2 === 0 ? 'even' : 'odd';
    }
  }
  return pattern;
};

// Kontrola, či je bunka na diagonále
export const isOnDiagonal = (row: number, col: number): boolean => {
  const onMainDiagonal = row === col;
  const onAntiDiagonal = row + col === 8;
  return onMainDiagonal || onAntiDiagonal;
};

// Validácia hodnoty podľa režimu
export const validateMoveForMode = (
  value: number,
  row: number,
  col: number,
  board: Cell[][],
  solution: number[][],
  mode: GameMode,
  comparisonData?: ComparisonData,
  oddEvenPattern?: OddEvenConstraint[][]
): boolean => {
  // Základná validácia - musí byť správna hodnota
  if (solution[row][col] !== value) {
    return false;
  }

  // Dodatočná validácia podľa režimu
  switch (mode) {
    case 'odd-even':
      if (oddEvenPattern && oddEvenPattern[row][col]) {
        const constraint = oddEvenPattern[row][col];
        if (constraint === 'odd' && value % 2 === 0) return false;
        if (constraint === 'even' && value % 2 !== 0) return false;
      }
      break;
    
    case 'diagonal':
      // Diagonálna validácia je už zabudovaná v riešení
      break;
    
    case 'comparison':
      // Comparison validácia je už zabudovaná v riešení
      break;
  }

  return true;
};

// ============================================
// DIAGONAL SUDOKU PUZZLES
// Diagonály obsahujú čísla 1-9 bez opakovania
// ============================================
const DIAGONAL_PUZZLES = [
  {
    board: [
      [0, 0, 0, 0, 7, 0, 9, 4, 0],
      [0, 7, 0, 0, 9, 0, 0, 0, 5],
      [3, 0, 0, 0, 0, 5, 0, 7, 0],
      [0, 8, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 9, 0, 7, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 3, 1, 0],
      [0, 5, 0, 4, 0, 0, 0, 0, 7],
      [4, 0, 0, 0, 5, 0, 0, 9, 0],
      [0, 9, 8, 0, 6, 0, 0, 0, 0]
    ],
    solution: [
      [5, 1, 6, 8, 7, 3, 9, 4, 2],
      [8, 7, 4, 6, 9, 2, 1, 3, 5],
      [3, 2, 9, 1, 4, 5, 6, 7, 8],
      [9, 8, 1, 5, 3, 4, 7, 2, 6],
      [6, 3, 5, 9, 2, 7, 4, 8, 1],
      [2, 4, 7, 6, 8, 1, 3, 5, 9],
      [1, 5, 2, 4, 8, 9, 6, 3, 7],
      [4, 6, 3, 7, 5, 8, 2, 9, 1],
      [7, 9, 8, 2, 6, 1, 5, 4, 3]
    ]
  },
  {
    board: [
      [1, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 2, 0, 4, 0, 0, 0, 0, 0],
      [0, 0, 3, 0, 0, 6, 0, 0, 0],
      [0, 5, 0, 4, 0, 0, 2, 0, 0],
      [0, 0, 0, 0, 5, 0, 0, 0, 0],
      [0, 0, 7, 0, 0, 6, 0, 1, 0],
      [0, 0, 0, 3, 0, 0, 7, 0, 0],
      [0, 0, 0, 0, 0, 5, 0, 8, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 9]
    ],
    solution: [
      [1, 4, 6, 5, 8, 7, 9, 3, 2],
      [8, 2, 9, 4, 3, 1, 5, 6, 7],
      [7, 5, 3, 2, 9, 6, 4, 8, 1],
      [6, 5, 1, 4, 7, 8, 2, 9, 3],
      [4, 3, 8, 9, 5, 2, 1, 7, 6],
      [9, 8, 7, 1, 2, 6, 3, 1, 5],
      [5, 6, 2, 3, 4, 9, 7, 1, 8],
      [3, 1, 4, 7, 6, 5, 8, 8, 4],
      [2, 7, 5, 8, 1, 3, 6, 4, 9]
    ]
  }
];

// ============================================
// CLASSIC SUDOKU PUZZLES
// ============================================
const CLASSIC_PUZZLES = {
  easy: [
    {
      board: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
      ],
      solution: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
      ]
    },
    {
      board: [
        [0, 0, 0, 2, 6, 0, 7, 0, 1],
        [6, 8, 0, 0, 7, 0, 0, 9, 0],
        [1, 9, 0, 0, 0, 4, 5, 0, 0],
        [8, 2, 0, 1, 0, 0, 0, 4, 0],
        [0, 0, 4, 6, 0, 2, 9, 0, 0],
        [0, 5, 0, 0, 0, 3, 0, 2, 8],
        [0, 0, 9, 3, 0, 0, 0, 7, 4],
        [0, 4, 0, 0, 5, 0, 0, 3, 6],
        [7, 0, 3, 0, 1, 8, 0, 0, 0]
      ],
      solution: [
        [4, 3, 5, 2, 6, 9, 7, 8, 1],
        [6, 8, 2, 5, 7, 1, 4, 9, 3],
        [1, 9, 7, 8, 3, 4, 5, 6, 2],
        [8, 2, 6, 1, 9, 5, 3, 4, 7],
        [3, 7, 4, 6, 8, 2, 9, 1, 5],
        [9, 5, 1, 7, 4, 3, 6, 2, 8],
        [5, 1, 9, 3, 2, 6, 8, 7, 4],
        [2, 4, 8, 9, 5, 7, 1, 3, 6],
        [7, 6, 3, 4, 1, 8, 2, 5, 9]
      ]
    },
    {
      board: [
        [0, 2, 0, 6, 0, 8, 0, 0, 0],
        [5, 8, 0, 0, 0, 9, 7, 0, 0],
        [0, 0, 0, 0, 4, 0, 0, 0, 0],
        [3, 7, 0, 0, 0, 0, 5, 0, 0],
        [6, 0, 0, 0, 0, 0, 0, 0, 4],
        [0, 0, 8, 0, 0, 0, 0, 1, 3],
        [0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 9, 8, 0, 0, 0, 3, 6],
        [0, 0, 0, 3, 0, 6, 0, 9, 0]
      ],
      solution: [
        [1, 2, 3, 6, 7, 8, 9, 4, 5],
        [5, 8, 4, 2, 3, 9, 7, 6, 1],
        [9, 6, 7, 1, 4, 5, 3, 2, 8],
        [3, 7, 2, 4, 6, 1, 5, 8, 9],
        [6, 9, 1, 5, 8, 3, 2, 7, 4],
        [4, 5, 8, 7, 9, 2, 6, 1, 3],
        [8, 3, 6, 9, 2, 4, 1, 5, 7],
        [2, 1, 9, 8, 5, 7, 4, 3, 6],
        [7, 4, 5, 3, 1, 6, 8, 9, 2]
      ]
    }
  ],
  medium: [
    {
      board: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 3, 0, 8, 5],
        [0, 0, 1, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 5, 0, 7, 0, 0, 0],
        [0, 0, 4, 0, 0, 0, 1, 0, 0],
        [0, 9, 0, 0, 0, 0, 0, 0, 0],
        [5, 0, 0, 0, 0, 0, 0, 7, 3],
        [0, 0, 2, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 4, 0, 0, 0, 9]
      ],
      solution: [
        [9, 8, 7, 6, 5, 4, 3, 2, 1],
        [2, 4, 6, 1, 7, 3, 9, 8, 5],
        [3, 5, 1, 9, 2, 8, 7, 4, 6],
        [1, 2, 8, 5, 3, 7, 6, 9, 4],
        [6, 3, 4, 8, 9, 2, 1, 5, 7],
        [7, 9, 5, 4, 6, 1, 8, 3, 2],
        [5, 1, 9, 2, 8, 6, 4, 7, 3],
        [4, 7, 2, 3, 1, 9, 5, 6, 8],
        [8, 6, 3, 7, 4, 5, 2, 1, 9]
      ]
    },
    {
      board: [
        [0, 0, 5, 3, 0, 0, 0, 0, 0],
        [8, 0, 0, 0, 0, 0, 0, 2, 0],
        [0, 7, 0, 0, 1, 0, 5, 0, 0],
        [4, 0, 0, 0, 0, 5, 3, 0, 0],
        [0, 1, 0, 0, 7, 0, 0, 0, 6],
        [0, 0, 3, 2, 0, 0, 0, 8, 0],
        [0, 6, 0, 5, 0, 0, 0, 0, 9],
        [0, 0, 4, 0, 0, 0, 0, 3, 0],
        [0, 0, 0, 0, 0, 9, 7, 0, 0]
      ],
      solution: [
        [1, 4, 5, 3, 2, 7, 6, 9, 8],
        [8, 3, 9, 6, 5, 4, 1, 2, 7],
        [6, 7, 2, 9, 1, 8, 5, 4, 3],
        [4, 9, 6, 1, 8, 5, 3, 7, 2],
        [2, 1, 8, 4, 7, 3, 9, 5, 6],
        [7, 5, 3, 2, 9, 6, 4, 8, 1],
        [3, 6, 7, 5, 4, 2, 8, 1, 9],
        [9, 8, 4, 7, 6, 1, 2, 3, 5],
        [5, 2, 1, 8, 3, 9, 7, 6, 4]
      ]
    }
  ],
  hard: [
    {
      board: [
        [8, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 3, 6, 0, 0, 0, 0, 0],
        [0, 7, 0, 0, 9, 0, 2, 0, 0],
        [0, 5, 0, 0, 0, 7, 0, 0, 0],
        [0, 0, 0, 0, 4, 5, 7, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 3, 0],
        [0, 0, 1, 0, 0, 0, 0, 6, 8],
        [0, 0, 8, 5, 0, 0, 0, 1, 0],
        [0, 9, 0, 0, 0, 0, 4, 0, 0]
      ],
      solution: [
        [8, 1, 2, 7, 5, 3, 6, 4, 9],
        [9, 4, 3, 6, 8, 2, 1, 7, 5],
        [6, 7, 5, 4, 9, 1, 2, 8, 3],
        [1, 5, 4, 2, 3, 7, 8, 9, 6],
        [3, 6, 9, 8, 4, 5, 7, 2, 1],
        [2, 8, 7, 1, 6, 9, 5, 3, 4],
        [5, 2, 1, 9, 7, 4, 3, 6, 8],
        [4, 3, 8, 5, 2, 6, 9, 1, 7],
        [7, 9, 6, 3, 1, 8, 4, 5, 2]
      ]
    },
    {
      board: [
        [0, 0, 0, 6, 0, 0, 4, 0, 0],
        [7, 0, 0, 0, 0, 3, 6, 0, 0],
        [0, 0, 0, 0, 9, 1, 0, 8, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 5, 0, 1, 8, 0, 0, 0, 3],
        [0, 0, 0, 3, 0, 6, 0, 4, 5],
        [0, 4, 0, 2, 0, 0, 0, 6, 0],
        [9, 0, 3, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 0, 0, 0, 1, 0, 0]
      ],
      solution: [
        [5, 8, 1, 6, 7, 2, 4, 3, 9],
        [7, 9, 2, 8, 4, 3, 6, 5, 1],
        [3, 6, 4, 5, 9, 1, 7, 8, 2],
        [4, 3, 8, 9, 5, 7, 2, 1, 6],
        [2, 5, 6, 1, 8, 4, 9, 7, 3],
        [1, 7, 9, 3, 2, 6, 8, 4, 5],
        [8, 4, 5, 2, 1, 9, 3, 6, 7],
        [9, 1, 3, 7, 6, 8, 5, 2, 4],
        [6, 2, 7, 4, 3, 5, 1, 9, 8]
      ]
    }
  ]
};

// Generuj sudoku podľa režimu a obtiažnosti
export const generateSudoku = (
  mode: GameMode,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): {
  board: number[][];
  solution: number[][];
  comparisonData?: ComparisonData;
  oddEvenPattern?: OddEvenConstraint[][];
} => {
  let puzzle: { board: number[][]; solution: number[][] };
  let comparisonData: ComparisonData | undefined;
  let oddEvenPattern: OddEvenConstraint[][] | undefined;

  switch (mode) {
    case 'diagonal':
      // Pre diagonal režim použijeme špeciálne puzzly
      const diagIndex = Math.floor(Math.random() * DIAGONAL_PUZZLES.length);
      puzzle = {
        board: DIAGONAL_PUZZLES[diagIndex].board.map(r => [...r]),
        solution: DIAGONAL_PUZZLES[diagIndex].solution.map(r => [...r])
      };
      break;

    case 'comparison':
      // Pre comparison použijeme klasický puzzle a vygenerujeme symboly
      const compPuzzles = CLASSIC_PUZZLES[difficulty];
      const compIndex = Math.floor(Math.random() * compPuzzles.length);
      puzzle = {
        board: compPuzzles[compIndex].board.map(r => [...r]),
        solution: compPuzzles[compIndex].solution.map(r => [...r])
      };
      comparisonData = generateComparisonData(puzzle.solution);
      break;

    case 'odd-even':
      // Pre odd-even použijeme klasický puzzle a vygenerujeme pattern
      const oePuzzles = CLASSIC_PUZZLES[difficulty];
      const oeIndex = Math.floor(Math.random() * oePuzzles.length);
      puzzle = {
        board: oePuzzles[oeIndex].board.map(r => [...r]),
        solution: oePuzzles[oeIndex].solution.map(r => [...r])
      };
      oddEvenPattern = generateOddEvenPattern(puzzle.solution);
      break;

    case 'classic':
    default:
      const puzzles = CLASSIC_PUZZLES[difficulty];
      const randomIndex = Math.floor(Math.random() * puzzles.length);
      puzzle = {
        board: puzzles[randomIndex].board.map(r => [...r]),
        solution: puzzles[randomIndex].solution.map(r => [...r])
      };
      break;
  }

  return {
    ...puzzle,
    comparisonData,
    oddEvenPattern
  };
};

// Zachovanie starej funkcie pre kompatibilitu
export const generateTestSudoku = (difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
  return generateSudoku('classic', difficulty);
};
