import { useState, useCallback, useEffect } from 'react';
import { GameState, CellValue, GameMode, Difficulty } from '../types/sudoku.types';
import { initializeBoard, createBoardFromData, generateSudoku, validateMoveForMode } from '../utils/sudoku.utils';
import { sudokuApi } from '../services/sudokuApi';

export const useSudoku = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: initializeBoard(),
    solution: [],
    initialBoard: [],
    difficulty: 'medium',
    mode: 'classic',
    filledCells: 0,
    mistakes: 0,
    hintsUsed: 0,
    timeElapsed: 0,
    isNotesMode: false,
    selectedCell: null,
    isComplete: false,
    undosRemaining: 3,
    maxMistakes: 0,
    isGameOver: false,
    comparisonData: undefined,
    oddEvenPattern: undefined
  });

  const [history, setHistory] = useState<GameState[]>([]);
  const [useApi, setUseApi] = useState<boolean>(true);
  
  // Ref pre sledovanie či už bola hra inicializovaná
 // const isInitialized = useRef(false);

  // Funkcia pre začatie novej hry
  const startNewGame = useCallback(async (
    overrideMode?: GameMode,
    overrideDifficulty?: Difficulty
  ) => {
    const mode = overrideMode ?? gameState.mode;
    const difficulty = overrideDifficulty ?? gameState.difficulty;
    
    const undosCount = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 0;
    const mistakesLimit = difficulty === 'hard' ? 3 : 0;

    // Skús použiť API
    if (useApi) {
      try {
        const response = await sudokuApi.newGame(difficulty, mode);
        const newBoard = createBoardFromData(response.board);
        const solution = response.solution || response.board;

        // Pre špeciálne režimy potrebujeme dodatočné dáta
        const { comparisonData, oddEvenPattern } = generateSudoku(mode, difficulty);

        setGameState({
          board: newBoard,
          solution: solution,
          initialBoard: response.initial_board,
          difficulty,
          mode,
          filledCells: response.initial_board.flat().filter(v => v !== 0).length,
          mistakes: 0,
          hintsUsed: 0,
          timeElapsed: 0,
          isNotesMode: false,
          selectedCell: null,
          isComplete: false,
          undosRemaining: undosCount,
          maxMistakes: mistakesLimit,
          isGameOver: false,
          comparisonData: mode === 'comparison' ? comparisonData : undefined,
          oddEvenPattern: mode === 'odd-even' ? oddEvenPattern : undefined
        });
        setHistory([]);
        return;
      } catch (error) {
        console.warn('API not available, using local generation:', error);
        setUseApi(false);
      }
    }

    // Lokálne generovanie
    const { board, solution, comparisonData, oddEvenPattern } = generateSudoku(mode, difficulty);
    const newBoard = createBoardFromData(board);

    setGameState({
      board: newBoard,
      solution: solution,
      initialBoard: board,
      difficulty,
      mode,
      filledCells: board.flat().filter(v => v !== 0).length,
      mistakes: 0,
      hintsUsed: 0,
      timeElapsed: 0,
      isNotesMode: false,
      selectedCell: null,
      isComplete: false,
      undosRemaining: undosCount,
      maxMistakes: mistakesLimit,
      isGameOver: false,
      comparisonData: mode === 'comparison' ? comparisonData : undefined,
      oddEvenPattern: mode === 'odd-even' ? oddEvenPattern : undefined
    });
    setHistory([]);
  }, [gameState.difficulty, gameState.mode, useApi]);

  // Výber bunky
  const selectCell = useCallback((row: number, col: number) => {
    setGameState(prev => ({
      ...prev,
      selectedCell: { row, col }
    }));
  }, []);

  // Vloženie čísla
  const makeMove = useCallback(async (value: CellValue) => {
    if (!gameState.selectedCell || gameState.isGameOver) return;
    
    const { row, col } = gameState.selectedCell;
    if (gameState.board[row][col].isInitial) return;

    setHistory(prev => [...prev, gameState]);

    // Lokálna validácia s ohľadom na režim
    setGameState(prev => {
      const newBoard = prev.board.map(r => r.map(c => ({...c, notes: new Set(c.notes)})));
      
      if (prev.isNotesMode && value !== 0) {
        if (newBoard[row][col].notes.has(value)) {
          newBoard[row][col].notes.delete(value);
        } else {
          newBoard[row][col].notes.add(value);
        }
      } else {
        newBoard[row][col].value = value;
        newBoard[row][col].notes.clear();
        
        if (value !== 0) {
          // Validácia podľa režimu
          const isValid = validateMoveForMode(
            value,
            row,
            col,
            prev.board,
            prev.solution,
            prev.mode,
            prev.comparisonData,
            prev.oddEvenPattern
          );
          
          if (!isValid) {
            newBoard[row][col].isError = true;
            const newMistakes = prev.mistakes + 1;
            const gameOver = prev.maxMistakes > 0 && newMistakes >= prev.maxMistakes;

            return {
              ...prev,
              board: newBoard,
              mistakes: newMistakes,
              isGameOver: gameOver
            };
          }
        }
        
        newBoard[row][col].isError = false;
      }
      
      const filledCells = newBoard.flat().filter(c => c.value !== 0).length;
      const isComplete = filledCells === 81 && 
        newBoard.every((row, ri) => 
          row.every((cell, ci) => cell.value === prev.solution[ri][ci])
        );
      
      return {
        ...prev,
        board: newBoard,
        filledCells,
        isComplete
      };
    });
  }, [gameState]);

  const toggleNotesMode = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isNotesMode: !prev.isNotesMode
    }));
  }, []);

  const eraseCell = useCallback(async () => {
    if (!gameState.selectedCell || gameState.isGameOver) return;
    const { row, col } = gameState.selectedCell;
    if (gameState.board[row][col].isInitial) return;
    
    setGameState(prev => {
      const newBoard = prev.board.map(r => r.map(c => ({...c, notes: new Set(c.notes)})));
      newBoard[row][col].value = 0;
      newBoard[row][col].notes.clear();
      newBoard[row][col].isError = false;
      
      return {
        ...prev,
        board: newBoard,
        filledCells: newBoard.flat().filter(c => c.value !== 0).length
      };
    });
  }, [gameState.selectedCell, gameState.isGameOver, gameState.board, gameState.solution]);

  // Timer
  useEffect(() => {
    if (!gameState.isComplete && !gameState.isGameOver && gameState.solution.length > 0) {
      const timer = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeElapsed: prev.timeElapsed + 1
        }));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState.isComplete, gameState.isGameOver, gameState.solution.length]);

  // Undo funkcia
  const undo = useCallback(() => {
    if (history.length === 0 || gameState.undosRemaining === 0) return;
    
    const previousState = history[history.length - 1];
    setGameState(prev => ({
      ...previousState,
      undosRemaining: prev.undosRemaining - 1,
      timeElapsed: prev.timeElapsed
    }));
    setHistory(prev => prev.slice(0, -1));
  }, [history, gameState.undosRemaining]);

  // Hint funkcia
  const giveHint = useCallback(async () => {
    if (gameState.isGameOver) return;
    
    // Nájdi prvú prázdnu bunku ak nie je vybraná
    let targetRow = gameState.selectedCell?.row;
    let targetCol = gameState.selectedCell?.col;
    
    if (targetRow === undefined || targetCol === undefined || 
        gameState.board[targetRow][targetCol].isInitial ||
        gameState.board[targetRow][targetCol].value !== 0) {
      // Nájdi prázdnu bunku
      outer: for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (gameState.board[r][c].value === 0 && !gameState.board[r][c].isInitial) {
            targetRow = r;
            targetCol = c;
            break outer;
          }
        }
      }
    }
    
    if (targetRow === undefined || targetCol === undefined) return;
    
    const correctValue = gameState.solution[targetRow][targetCol];
    
    setGameState(prev => {
      const newBoard = prev.board.map(r => r.map(c => ({...c, notes: new Set(c.notes)})));
      newBoard[targetRow!][targetCol!].value = correctValue as CellValue;
      newBoard[targetRow!][targetCol!].isError = false;
      newBoard[targetRow!][targetCol!].notes.clear();
      
      const filledCells = newBoard.flat().filter(c => c.value !== 0).length;
      const isComplete = filledCells === 81 && 
        newBoard.every((row, ri) => 
          row.every((cell, ci) => cell.value === prev.solution[ri][ci])
        );
      
      return {
        ...prev,
        board: newBoard,
        hintsUsed: prev.hintsUsed + 1,
        filledCells,
        isComplete,
        selectedCell: { row: targetRow!, col: targetCol! }
      };
    });
  }, [gameState]);

  // Reset hry
  const resetGame = useCallback(async () => {
    const newBoard = createBoardFromData(gameState.initialBoard);
    
    const undosCount = gameState.difficulty === 'easy' ? 5 : 
                      gameState.difficulty === 'medium' ? 3 : 0;
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      mistakes: 0,
      hintsUsed: 0,
      timeElapsed: 0,
      filledCells: gameState.initialBoard.flat().filter(v => v !== 0).length,
      isComplete: false,
      isGameOver: false,
      undosRemaining: undosCount,
      selectedCell: null
    }));
    setHistory([]);
  }, [gameState.initialBoard, gameState.difficulty]);

  // Zmena režimu - AUTOMATICKY ZAČNE NOVÚ HRU
  const changeMode = useCallback((mode: GameMode) => {
    if (mode !== gameState.mode) {
      startNewGame(mode, gameState.difficulty);
    }
  }, [gameState.mode, gameState.difficulty, startNewGame]);

  // Zmena obtiažnosti - AUTOMATICKY ZAČNE NOVÚ HRU
  const changeDifficulty = useCallback((difficulty: Difficulty) => {
    if (difficulty !== gameState.difficulty) {
      startNewGame(gameState.mode, difficulty);
    }
  }, [gameState.mode, gameState.difficulty, startNewGame]);

  return {
    gameState,
    startNewGame,
    selectCell,
    makeMove,
    toggleNotesMode,
    eraseCell,
    undo,
    giveHint,
    resetGame,
    changeMode,
    changeDifficulty
  };
};
