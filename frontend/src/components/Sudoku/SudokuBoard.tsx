import React from 'react';
import SudokuCell from './SudokuCell';
import { GameState } from '../../types/sudoku.types';

interface SudokuBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
}

const SudokuBoard: React.FC<SudokuBoardProps> = ({ gameState, onCellClick }) => {
  const { board, selectedCell, mode } = gameState;

  const isHighlighted = (row: number, col: number): boolean => {
    if (!selectedCell) return false;
    
    // Zvýrazni riadok, stĺpec a 3x3 box
    const sameRow = row === selectedCell.row;
    const sameCol = col === selectedCell.col;
    const sameBox = 
      Math.floor(row / 3) === Math.floor(selectedCell.row / 3) &&
      Math.floor(col / 3) === Math.floor(selectedCell.col / 3);
    
    return sameRow || sameCol || sameBox;
  };

  return (
    <div className="sudoku-board">
      {board.map((row, rowIdx) => (
        <div key={rowIdx} className="sudoku-row">
          {row.map((cell, colIdx) => (
            <SudokuCell
              key={`${rowIdx}-${colIdx}`}
              cell={cell}
              row={rowIdx}
              col={colIdx}
              isSelected={
                selectedCell?.row === rowIdx && 
                selectedCell?.col === colIdx
              }
              isHighlighted={isHighlighted(rowIdx, colIdx)}
              onClick={() => onCellClick(rowIdx, colIdx)}
              mode={mode}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SudokuBoard;