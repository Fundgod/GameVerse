import React, { useEffect } from 'react';
import SudokuCell from './SudokuCell';
import SudokuBoard from './SudokuBoard';
import { useSudoku } from '../../hooks/useSudoku';
import { CellValue } from '../../types/sudoku.types';
import '../../styles/Sudoku.css';

const Sudoku: React.FC = () => {
  const { gameState, startNewGame, selectCell, makeMove, toggleNotesMode, eraseCell } = useSudoku();

  useEffect(() => {
    startNewGame();
  }, []);

  const handleNumberClick = (value: CellValue) => {
    makeMove(value);
  };

    const isHighlighted = (row: number, col: number): boolean => {
    if (!gameState.selectedCell) return false;
    
    // Zvýrazni riadok, stĺpec a 3x3 box
    const sameRow = row === gameState.selectedCell.row;
    const sameCol = col === gameState.selectedCell.col;
    const sameBox = 
      Math.floor(row / 3) === Math.floor(gameState.selectedCell.row / 3) &&
      Math.floor(col / 3) === Math.floor(gameState.selectedCell.col / 3);
    
    return sameRow || sameCol || sameBox;
  };


  return (
    <div className="sudoku-container">
      <h1>Ultimate Sudoku</h1>
      
    <SudokuBoard 
        gameState={gameState} 
        onCellClick={selectCell} 
    />  

      <div className="controls">
        <button onClick={() => toggleNotesMode()} className={gameState.isNotesMode ? 'active' : ''}>
          Notes
        </button>
        <button onClick={() => eraseCell()}>Erase</button>
        <button onClick={() => startNewGame()}>New Game</button>
      </div>

      <div className="number-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button key={num} onClick={() => handleNumberClick(num as CellValue)}>
            {num}
          </button>
        ))}
      </div>

      {gameState.isComplete && <div className="win">Gratulujeme!</div>}
    </div>
  );
};

export default Sudoku;