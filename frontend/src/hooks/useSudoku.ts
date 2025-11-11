import { useState, useCallback } from 'react';
import { GameState, CellValue } from '../types/sudoku.types';
import { initializeBoard, createBoardFromData, generateTestSudoku } from '../utils/sudoku.utils';

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
    isComplete: false
  });

  // Funkcia pre začatie novej hry
  const startNewGame = useCallback(() => {
    const { board, solution } = generateTestSudoku();
    const newBoard = createBoardFromData(board);
    
    setGameState({
      board: newBoard,
      solution: solution,
      initialBoard: board,
      difficulty: 'medium',
      mode: 'classic',
      filledCells: board.flat().filter(v => v !== 0).length,
      mistakes: 0,
      hintsUsed: 0,
      timeElapsed: 0,
      isNotesMode: false,
      selectedCell: null,
      isComplete: false
    });
  }, []);

  // Výber bunky
  const selectCell = useCallback((row: number, col: number) => {
    setGameState(prev => ({
      ...prev,
      selectedCell: { row, col }
    }));
  }, []);

  // Vloženie čísla
  const makeMove = useCallback((value: CellValue) => {
    if (!gameState.selectedCell) return;
    
    const { row, col } = gameState.selectedCell;
    if (gameState.board[row][col].isInitial) return;

    setGameState(prev => {
      const newBoard = prev.board.map(r => r.map(c => ({...c, notes: new Set(c.notes)})));
      
      if (prev.isNotesMode && value !== 0) {
        // Režim poznámok
        if (newBoard[row][col].notes.has(value)) {
          newBoard[row][col].notes.delete(value);
        } else {
          newBoard[row][col].notes.add(value);
        }
      } else {
        // Normálny režim
        newBoard[row][col].value = value;
        newBoard[row][col].notes.clear();
        
        // Kontrola chyby
        if (value !== 0 && prev.solution[row][col] !== value) {
          newBoard[row][col].isError = true;
          return {
            ...prev,
            board: newBoard,
            mistakes: prev.mistakes + 1
          };
        }
        
        newBoard[row][col].isError = false;
      }
      
      // Kontrola víťazstva
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
  }, [gameState.selectedCell, gameState.board]);

  const toggleNotesMode = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isNotesMode: !prev.isNotesMode
    }));
  }, []);

  const eraseCell = useCallback(() => {
    if (!gameState.selectedCell) return;
    const { row, col } = gameState.selectedCell;
    if (gameState.board[row][col].isInitial) return;
    
    makeMove(0);
  }, [gameState.selectedCell, gameState.board, makeMove]);

  return {
    gameState,
    startNewGame,
    selectCell,
    makeMove,
    toggleNotesMode,
    eraseCell
  };
};