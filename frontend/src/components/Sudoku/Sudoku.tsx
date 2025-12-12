import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SudokuBoard from './SudokuBoard';
import { useSudoku } from '../../hooks/useSudoku';
import { CellValue } from '../../types/sudoku.types';
import '../../styles/Sudoku.css';

const Sudoku: React.FC = () => {
  const navigate = useNavigate();
  const { 
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
  } = useSudoku();

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const handleNumberClick = (value: CellValue) => {
    makeMove(value);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyLabel = (diff: string): string => {
    switch(diff) {
      case 'easy': return 'Easy';
      case 'medium': return 'Normal';
      case 'hard': return 'Hard';
      default: return diff;
    }
  };

  return (
    <div className="sudoku-container">
      <h1>ULTIMATE SUDOKU</h1>

      <button onClick={() => navigate('/')} className="btn-back">
        ← Back to Menu
      </button>
      
      <div className="game-layout">
        {/* Ľavá strana - Doska */}
        <div className="board-section">
          <SudokuBoard 
            gameState={gameState} 
            onCellClick={selectCell} 
          />
          
          {/* Tlačidlá pod doskou */}
          <div className="action-buttons">
            <button onClick={eraseCell} className="btn-action">
              Eraser
            </button>
            <button 
              onClick={toggleNotesMode} 
              className={`btn-action ${gameState.isNotesMode ? 'active' : ''}`}
            >
              Notes
            </button>
            <button onClick={giveHint} className="btn-action">
              Hint
            </button>
            <button onClick={undo} className="btn-action btn-undo">
              Undo
            </button>
            <button onClick={resetGame} className="btn-action">
              Reset
            </button>
          </div>
          
          {/* Číselník */}
          <div className="keypad">
            <span className="keypad-label">Keypad:</span>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num} 
                onClick={() => handleNumberClick(num as CellValue)}
                className="keypad-btn"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        
        {/* Pravá strana - Nastavenia */}
        <div className="settings-section">
          {/* MODES */}
          <div className="settings-panel">
            <h3>MODES</h3>
            <button 
              onClick={() => changeMode('classic')}
              className={`mode-btn ${gameState.mode === 'classic' ? 'active' : ''}`}
            >
              <span className="radio"></span> Classic
            </button>
            <button 
              onClick={() => changeMode('comparison')}
              className={`mode-btn ${gameState.mode === 'comparison' ? 'active' : ''}`}
            >
              <span className="radio"></span> Comparison
            </button>
            <button 
              onClick={() => changeMode('odd-even')}
              className={`mode-btn ${gameState.mode === 'odd-even' ? 'active' : ''}`}
            >
              <span className="radio"></span> Odd/Even
            </button>
            <button 
              onClick={() => changeMode('diagonal')}
              className={`mode-btn ${gameState.mode === 'diagonal' ? 'active' : ''}`}
            >
              <span className="radio"></span> Diagonal (X)
            </button>
            
            {/* Info o aktuálnom režime */}
            <div className="mode-info">
              {gameState.mode === 'classic' && '🎯 Klasické Sudoku pravidlá.'}
              {gameState.mode === 'comparison' && '⚖️ Symboly < > ^ v ukazujú, ktoré číslo je väčšie/menšie.'}
              {gameState.mode === 'odd-even' && '🔢 Oranžové = nepárne (1,3,5,7,9), Fialové = párne (2,4,6,8).'}
              {gameState.mode === 'diagonal' && '❌ Diagonály musia obsahovať čísla 1-9 bez opakovania.'}
            </div>
          </div>
          
          {/* DIFFICULTY */}
          <div className="settings-panel">
            <h3>DIFFICULTY</h3>
            <div className="difficulty-buttons">
              <button 
                onClick={() => changeDifficulty('easy')}
                className={`difficulty-btn ${gameState.difficulty === 'easy' ? 'active' : ''}`}
              >
                Easy
              </button>
              <button 
                onClick={() => changeDifficulty('medium')}
                className={`difficulty-btn ${gameState.difficulty === 'medium' ? 'active' : ''}`}
              >
                Normal
              </button>
              <button 
                onClick={() => changeDifficulty('hard')}
                className={`difficulty-btn ${gameState.difficulty === 'hard' ? 'active' : ''}`}
              >
                Hard
              </button>
            </div>
          </div>
          
          {/* TIME / ČAS */}
          <div className="settings-panel">
            <h3>TIME</h3>
            <div className="time-display">
              {formatTime(gameState.timeElapsed)}
            </div>
          </div>
          
          {/* STATS */}
          <div className="settings-panel">
            <h3>STATS</h3>
            <div className="stats-bar">
              <div className="stat-filled" style={{width: `${(gameState.filledCells/81)*100}%`}}></div>
            </div>
            <div className="stats-text">
              <span>Filled: {gameState.filledCells}/81</span>
            </div>
            <div className="stats-details">
              <span className="stat-item">Mistakes: <strong className="mistakes-count">{gameState.mistakes}</strong></span>
              <span className="stat-item">Hints: <strong className="hints-count">{gameState.hintsUsed}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Popup okno pri výhre - CONGRATS */}
      {gameState.isComplete && (
        <div className="modal-overlay">
          <div className="modal congrats-modal">
            <h2>🎉 CONGRATS! 🎉</h2>
            <div className="modal-stats">
              <div className="modal-stat-row">
                <span className="stat-label">Time:</span>
                <span className="stat-value time-value">{formatTime(gameState.timeElapsed)}</span>
              </div>
              <div className="modal-stat-row">
                <span className="stat-label">Mistakes:</span>
                <span className="stat-value mistakes-value">{gameState.mistakes}</span>
              </div>
              <div className="modal-stat-row">
                <span className="stat-label">Hints:</span>
                <span className="stat-value hints-value">{gameState.hintsUsed}</span>
              </div>
              <div className="modal-stat-row">
                <span className="stat-label">Difficulty:</span>
                <span className="stat-value difficulty-value">{getDifficultyLabel(gameState.difficulty)}</span>
              </div>
            </div>
            <div className="modal-buttons">
              <button onClick={() => startNewGame()} className="btn-new-game">New game</button>
              <button onClick={() => navigate('/')} className="btn-menu">Menu</button>
            </div>
          </div>
        </div>
      )}

      {/* Popup okno pri prehre - Try again */}
      {gameState.isGameOver && (
        <div className="modal-overlay">
          <div className="modal gameover-modal">
            <h2 className="gameover-title">Try again</h2>
            <p className="gameover-subtitle">You made too many mistakes</p>
            <div className="modal-stats">
              <div className="modal-stat-row">
                <span className="stat-label">Time</span>
                <span className="stat-value time-value">{formatTime(gameState.timeElapsed)}</span>
              </div>
              <div className="modal-stat-row">
                <span className="stat-label">Mistakes</span>
                <span className="stat-value mistakes-value">{gameState.mistakes}</span>
              </div>
              <div className="modal-stat-row">
                <span className="stat-label">Hints</span>
                <span className="stat-value hints-value">{gameState.hintsUsed}</span>
              </div>
              <div className="modal-stat-row">
                <span className="stat-label">Difficulty</span>
                <span className="stat-value">{getDifficultyLabel(gameState.difficulty)}</span>
              </div>
            </div>
            <div className="modal-buttons">
              <button onClick={() => startNewGame()} className="btn-new-game btn-retry">New game</button>
              <button onClick={() => navigate('/')} className="btn-menu">Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sudoku;