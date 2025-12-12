import React from 'react';
import SudokuCell from './SudokuCell';
import { GameState, ComparisonSymbol, OddEvenConstraint } from '../../types/sudoku.types';
import { isOnDiagonal } from '../../utils/sudoku.utils';

interface SudokuBoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
}

const SudokuBoard: React.FC<SudokuBoardProps> = ({ gameState, onCellClick }) => {
  const { board, selectedCell, mode, comparisonData, oddEvenPattern } = gameState;

  const isHighlighted = (row: number, col: number): boolean => {
    if (!selectedCell) return false;
    
    const sameRow = row === selectedCell.row;
    const sameCol = col === selectedCell.col;
    const sameBox = 
      Math.floor(row / 3) === Math.floor(selectedCell.row / 3) &&
      Math.floor(col / 3) === Math.floor(selectedCell.col / 3);
    
    return sameRow || sameCol || sameBox;
  };

  const getHorizontalComparison = (row: number, col: number): ComparisonSymbol => {
    if (mode !== 'comparison' || !comparisonData || col >= 8) return null;
    return comparisonData.horizontal[row][col];
  };

  const getVerticalComparison = (row: number, col: number): ComparisonSymbol => {
    if (mode !== 'comparison' || !comparisonData || row >= 8) return null;
    return comparisonData.vertical[row][col];
  };

  const getOddEvenConstraint = (row: number, col: number): OddEvenConstraint => {
    if (mode !== 'odd-even' || !oddEvenPattern) return null;
    return oddEvenPattern[row][col];
  };

  const isDiagonalCell = (row: number, col: number): boolean => {
    if (mode !== 'diagonal') return false;
    return isOnDiagonal(row, col);
  };

  return (
    <div className={`sudoku-board ${mode === 'diagonal' ? 'diagonal-mode' : ''}`}>
      {/* SVG pre diagonálne čiary */}
      {mode === 'diagonal' && (
        <svg className="diagonal-overlay" viewBox="0 0 459 459" preserveAspectRatio="none">
          <line x1="2" y1="2" x2="457" y2="457" stroke="#2196f3" strokeWidth="3" strokeLinecap="round" />
          <line x1="457" y1="2" x2="2" y2="457" stroke="#2196f3" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      
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
              horizontalComparison={getHorizontalComparison(rowIdx, colIdx)}
              verticalComparison={getVerticalComparison(rowIdx, colIdx)}
              oddEvenConstraint={getOddEvenConstraint(rowIdx, colIdx)}
              isDiagonalCell={isDiagonalCell(rowIdx, colIdx)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SudokuBoard;
