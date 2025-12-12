import React from 'react';
import { Cell, GameMode, ComparisonSymbol, OddEvenConstraint } from '../../types/sudoku.types';

interface Props {
  cell: Cell;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  row: number;
  col: number;
  mode: GameMode;
  horizontalComparison?: ComparisonSymbol;
  verticalComparison?: ComparisonSymbol;
  oddEvenConstraint?: OddEvenConstraint;
  isDiagonalCell?: boolean;
}

const SudokuCell: React.FC<Props> = ({ 
  cell, 
  isSelected, 
  isHighlighted, 
  onClick, 
  row, 
  col, 
  mode,
  horizontalComparison,
  verticalComparison,
  oddEvenConstraint,
  isDiagonalCell
}) => {
  const getClassName = () => {
    let className = 'sudoku-cell';
    if (isSelected) className += ' selected';
    if (isHighlighted) className += ' highlighted';
    if (cell.isInitial) className += ' initial';
    if (cell.isError) className += ' error';
    if (isDiagonalCell) className += ' diagonal-cell';
    
    // Odd/Even bunky
    if (mode === 'odd-even' && oddEvenConstraint) {
      className += oddEvenConstraint === 'even' ? ' even-cell' : ' odd-cell';
    }

    if (col === 2 || col === 5) className += ' border-right';
    if (row === 2 || row === 5) className += ' border-bottom';

    return className;
  };

  return (
    <div className={getClassName()} onClick={onClick}>
      {/* Odd/Even indikátor */}
      {mode === 'odd-even' && oddEvenConstraint && cell.value === 0 && (
        <span className="constraint-indicator">
          {oddEvenConstraint === 'odd' ? 'O' : 'E'}
        </span>
      )}
      
      {/* Hodnota alebo poznámky */}
      {cell.value !== 0 ? (
        <span className="cell-value">{cell.value}</span>
      ) : (
        <div className="notes">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(note => (
            <span 
              key={note} 
              className={`note ${cell.notes.has(note) ? 'visible' : ''}`}
            >
              {cell.notes.has(note) ? note : ''}
            </span>
          ))}
        </div>
      )}
      
      {/* Symboly porovnania pre Comparison režim */}
      {mode === 'comparison' && horizontalComparison && (
        <span className="comparison-symbol right">{horizontalComparison}</span>
      )}
      {mode === 'comparison' && verticalComparison && (
        <span className="comparison-symbol bottom">{verticalComparison}</span>
      )}
    </div>
  );
};

export default SudokuCell;
