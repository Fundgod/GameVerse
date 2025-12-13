import { useState, useEffect, useRef } from "react";
import ChessGame from "./components/ChessGame";
import ChessSidebar from "./components/ChessSidebar";
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

  const handleToggleTimer = () => {
    setIsTimerActive(!isTimerActive);
  };

  return (
    <div className="chess">
      <ChessSidebar
        moveHistory={moveHistory}
        gameState={gameState}
        whiteTime={whiteTime}
        blackTime={blackTime}
        isTimerActive={isTimerActive}
        onReset={handleReset}
        onToggleTimer={handleToggleTimer}
      />

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
