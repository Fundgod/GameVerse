import { useState, useEffect, useRef } from "react";
import ChessGame from "./components/ChessGame";
import type { Move } from "chess.js";
import "./Chess.css";

export default function App() {
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [gameState, setGameState] = useState({
    isGameOver: false,
    isCheckmate: false,
    isDraw: false,
    turn: 'w' as 'w' | 'b'
  });
  const [whiteTime, setWhiteTime] = useState(600); // 10 minutes in seconds
  const [blackTime, setBlackTime] = useState(600);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<number | null>(null);
  const chessGameKey = useRef(0);

  // Timer logic
  useEffect(() => {
    if (isTimerActive && !gameState.isGameOver) {
      timerRef.current = window.setInterval(() => {
        if (gameState.turn === 'w') {
          setWhiteTime(prev => {
            if (prev <= 0) {
              setIsTimerActive(false);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime(prev => {
            if (prev <= 0) {
              setIsTimerActive(false);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, gameState.turn, gameState.isGameOver]);

  // Stop timer when game is over
  useEffect(() => {
    if (gameState.isGameOver) {
      setIsTimerActive(false);
    }
  }, [gameState.isGameOver]);

  const handleMove = (_move: Move, history: Move[]) => {
    setMoveHistory(history);
    // Start timer on first move
    if (history.length === 1 && !isTimerActive) {
      setIsTimerActive(true);
    }
  };

  const handleGameStateChange = (newState: typeof gameState) => {
    setGameState(newState);
  };

  const handleReset = () => {
    setMoveHistory([]);
    setWhiteTime(600);
    setBlackTime(600);
    setIsTimerActive(false);
    setGameState({
      isGameOver: false,
      isCheckmate: false,
      isDraw: false,
      turn: 'w'
    });
    // Force re-render of ChessGame component
    chessGameKey.current += 1;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMove = (move: Move, index: number) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const isWhiteMove = index % 2 === 0;

    let notation = move.san;
    if (move.captured) {
      notation = move.san;
    }

    return { moveNumber, isWhiteMove, notation };
  };

  return (
    <div className="chess">
      <div className="sidebar">
        <h2>Chess Hub</h2>

        {/* Timer Section */}
        <div className="timerSection">
          <div className={`timer ${gameState.turn === 'b' ? 'active' : ''}`}>
            <div className="playerLabel">Black</div>
            <div className="timeDisplay">{formatTime(blackTime)}</div>
          </div>
          <div className={`timer ${gameState.turn === 'w' ? 'active' : ''}`}>
            <div className="playerLabel">White</div>
            <div className="timeDisplay">{formatTime(whiteTime)}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="controls">
          <button onClick={handleReset} className="controlButton">
            Reset Game
          </button>
          <button
            onClick={() => setIsTimerActive(!isTimerActive)}
            className="controlButton"
            disabled={gameState.isGameOver}
          >
            {isTimerActive ? 'Pause' : 'Start'} Timer
          </button>
        </div>

        {/* Game Status */}
        {gameState.isGameOver && (
          <div className="gameStatus">
            {gameState.isCheckmate
              ? `Checkmate! ${gameState.turn === 'w' ? 'Black' : 'White'} wins!`
              : gameState.isDraw
                ? 'Draw!'
                : 'Game Over'}
          </div>
        )}

        {/* Move List */}
        <div className="moveList">
          <h3>Move History</h3>
          <div className="moveListContent">
            {moveHistory.length === 0 ? (
              <div className="emptyMoves">No moves yet</div>
            ) : (
              <div className="moves">
                {moveHistory.map((move, index) => {
                  const { moveNumber, isWhiteMove, notation } = formatMove(move, index);

                  if (isWhiteMove) {
                    return (
                      <div key={index} className="moveRow">
                        <span className="moveNumber">{moveNumber}.</span>
                        <span className="moveNotation">{notation}</span>
                        {moveHistory[index + 1] && (
                          <span className="moveNotation">
                            {moveHistory[index + 1].san}
                          </span>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="boardWrapper">
        <ChessGame
          key={chessGameKey.current}
          onMove={handleMove}
          onGameStateChange={handleGameStateChange}
        />
      </div>
    </div>
  );
}
