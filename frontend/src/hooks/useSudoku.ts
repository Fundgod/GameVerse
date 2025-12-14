/**
 * @file useSudoku.ts
 * @brief Custom React hook pre správu hernej logiky Sudoku
 * @author Natalia Holbikova (xholbin00)
 * @date 2025
 * 
 * Tento hook zapúzdriuje všetku hernú logiku Sudoku vrátane:
 * - Správy herného stavu
 * - Validácie ťahov
 * - Histórie ťahov pre undo funkciu
 * - Časovača
 * - Načítania hier z API alebo lokálneho generátora
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, CellValue, GameMode, Difficulty } from '../types/sudoku.types';
import { initializeBoard, createBoardFromData, generateSudoku, validateMoveForMode } from '../utils/sudoku.utils';
import { sudokuApi } from '../services/sudokuApi';

/**
 * Custom hook pre Sudoku hernú logiku
 * @returns Objekt s herným stavom a funkciami pre manipuláciu hry
 */
export const useSudoku = () => {
  // Hlavný herný stav
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

  // História stavov pre undo funkciu
  const [history, setHistory] = useState<GameState[]>([]);
  
  // Flag pre použitie API (ak je dostupné)
  const [useApi, setUseApi] = useState<boolean>(true);
  
  // Ref pre inicializáciu - zabráni viacnásobnému volaniu
  const isInitialized = useRef(false);

  /**
   * Spustí novú hru s voliteľným režimom a obtiažnosťou
   * Najprv sa pokúsi načítať z API, pri zlyhaní použije lokálny generátor
   * @param mode - Herný režim (povinný)
   * @param difficulty - Obtiažnosť (povinná)
   */
  const startNewGame = useCallback(async (
    mode: GameMode,
    difficulty: Difficulty
  ) => {
    // Nastavenie počtu undo a limitu chýb podľa obtiažnosti
    const undosCount = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 0;
    const mistakesLimit = difficulty === 'hard' ? 3 : 0;

    // Pokus o načítanie z API
    if (useApi) {
      try {
        const response = await sudokuApi.newGame(difficulty, mode);
        const newBoard = createBoardFromData(response.board);
        const solution = response.solution || response.board;

        // Pre špeciálne režimy generujeme dodatočné dáta
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

    // Lokálne generovanie (fallback)
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
  }, [useApi]);

  /**
   * Vyberie bunku na hernej doske
   * @param row - Riadok bunky (0-8)
   * @param col - Stĺpec bunky (0-8)
   */
  const selectCell = useCallback((row: number, col: number) => {
    setGameState(prev => ({
      ...prev,
      selectedCell: { row, col }
    }));
  }, []);

  /**
   * Vloží číslo do vybranej bunky alebo pridá/odstráni poznámku
   * Vykonáva validáciu podľa herného režimu
   * @param value - Hodnota 1-9 alebo 0 pre vymazanie
   */
  const makeMove = useCallback((value: CellValue) => {
    setGameState(prev => {
      if (!prev.selectedCell || prev.isGameOver) return prev;
      
      const { row, col } = prev.selectedCell;
      // Nemožno meniť počiatočné bunky
      if (prev.board[row][col].isInitial) return prev;

      // Uložiť stav do histórie pre undo
      setHistory(hist => [...hist, prev]);

      // Deep copy dosky kvôli Set objektom v poznámkach
      const newBoard = prev.board.map(r => r.map(c => ({...c, notes: new Set(c.notes)})));
      
      // Režim poznámok - pridaj/odoober poznámku
      if (prev.isNotesMode && value !== 0) {
        if (newBoard[row][col].notes.has(value)) {
          newBoard[row][col].notes.delete(value);
        } else {
          newBoard[row][col].notes.add(value);
        }
      } else {
        // Normálny režim - vlož hodnotu
        newBoard[row][col].value = value;
        newBoard[row][col].notes.clear();
        
        if (value !== 0) {
          // Validácia ťahu podľa herného režimu
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
          
          // Ak je ťah nesprávny, označ chybu
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
      
      // Kontrola dokončenia hry
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
  }, []);

  /**
   * Prepne režim poznámok (notes mode)
   */
  const toggleNotesMode = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isNotesMode: !prev.isNotesMode
    }));
  }, []);

  /**
   * Vymaže obsah vybranej bunky (hodnotu aj poznámky)
   */
  const eraseCell = useCallback(() => {
    setGameState(prev => {
      if (!prev.selectedCell || prev.isGameOver) return prev;
      
      const { row, col } = prev.selectedCell;
      if (prev.board[row][col].isInitial) return prev;
      
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
  }, []);

  /**
   * Časovač hry - inkrementuje každú sekundu
   */
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

  /**
   * Vráti jeden ťah späť z histórie
   * Počet undo je limitovaný podľa obtiažnosti
   */
  const undo = useCallback(() => {
    setGameState(prev => {
      if (history.length === 0 || prev.undosRemaining === 0) return prev;
      
      const previousState = history[history.length - 1];
      setHistory(hist => hist.slice(0, -1));
      
      return {
        ...previousState,
        undosRemaining: prev.undosRemaining - 1,
        timeElapsed: prev.timeElapsed
      };
    });
  }, [history]);

  /**
   * Poskytne nápovedu - vyplní správnu hodnotu do vybranej alebo prvej prázdnej bunky
   */
  const giveHint = useCallback(() => {
    setGameState(prev => {
      if (prev.isGameOver) return prev;
      
      // Nájdi cieľovú bunku (vybranú alebo prvú prázdnu)
      let targetRow = prev.selectedCell?.row;
      let targetCol = prev.selectedCell?.col;
      
      if (targetRow === undefined || targetCol === undefined || 
          prev.board[targetRow][targetCol].isInitial ||
          prev.board[targetRow][targetCol].value !== 0) {
        // Nájdi prvú prázdnu bunku
        outer: for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (prev.board[r][c].value === 0 && !prev.board[r][c].isInitial) {
              targetRow = r;
              targetCol = c;
              break outer;
            }
          }
        }
      }
      
      if (targetRow === undefined || targetCol === undefined) return prev;
      
      const correctValue = prev.solution[targetRow][targetCol];
      
      const newBoard = prev.board.map(r => r.map(c => ({...c, notes: new Set(c.notes)})));
      newBoard[targetRow][targetCol].value = correctValue as CellValue;
      newBoard[targetRow][targetCol].isError = false;
      newBoard[targetRow][targetCol].notes.clear();
      
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
        selectedCell: { row: targetRow, col: targetCol }
      };
    });
  }, []);

  /**
   * Resetuje hru do počiatočného stavu (zachová ten istý puzzle)
   */
  const resetGame = useCallback(() => {
    setGameState(prev => {
      const newBoard = createBoardFromData(prev.initialBoard);
      
      const undosCount = prev.difficulty === 'easy' ? 5 : 
                        prev.difficulty === 'medium' ? 3 : 0;
      
      return {
        ...prev,
        board: newBoard,
        mistakes: 0,
        hintsUsed: 0,
        timeElapsed: 0,
        filledCells: prev.initialBoard.flat().filter(v => v !== 0).length,
        isComplete: false,
        isGameOver: false,
        undosRemaining: undosCount,
        selectedCell: null
      };
    });
    setHistory([]);
  }, []);

  /**
   * Zmení herný režim a automaticky spustí novú hru
   * @param mode - Nový herný režim
   */
  const changeMode = useCallback((mode: GameMode) => {
    setGameState(prev => {
      if (mode !== prev.mode) {
        // Spusť novú hru s novým režimom
        startNewGame(mode, prev.difficulty);
      }
      return prev;
    });
  }, [startNewGame]);

  /**
   * Zmení obtiažnosť a automaticky spustí novú hru
   * @param difficulty - Nová obtiažnosť
   */
  const changeDifficulty = useCallback((difficulty: Difficulty) => {
    setGameState(prev => {
      if (difficulty !== prev.difficulty) {
        // Spusť novú hru s novou obtiažnosťou
        startNewGame(prev.mode, difficulty);
      }
      return prev;
    });
  }, [startNewGame]);

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