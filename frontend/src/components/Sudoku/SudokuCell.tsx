import React from 'react';
import { Cell, GameMode } from '../../types/sudoku.types';

interface Props {
  cell: Cell;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  row: number;
  col: number;
  mode: GameMode;
}

const SudokuCell: React.FC<Props> = ({ cell, isSelected, isHighlighted, onClick, row, col, mode }) => {
  const getClassName = () => {
    let className = 'sudoku-cell';
    if (isSelected) className += ' selected';
    if (isHighlighted) className += ' highlighted';
    if (cell.isInitial) className += ' initial';
    if (cell.isError) className += ' error';

    if (col === 2 || col === 5) className += ' border-right';
    if (row === 2 || row === 5) className += ' border-bottom';

    return className;
  };

  return (
    <div className={getClassName()} onClick={onClick}>
      {cell.value !== 0 ? (
        <span>{cell.value}</span>
      ) : (
        <div className="notes">
          {Array.from(cell.notes).map(note => (
            <span key={note} className="note">{note}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SudokuCell;