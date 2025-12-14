import { useState, useRef } from "react";
import ChessGame from "./components/chess/ChessGame";
import ChessSidebar from "./components/chess/ChessSidebar";
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
  const chessGameKey = useRef(0);

  const handleMove = (_move: Move, history: Move[]) => {
    setMoveHistory(history);
  };

  const handleGameStateChange = (newState: typeof gameState) => {
    setGameState(newState);
  };

  const handleReset = () => {
    setMoveHistory([]);
    setGameState({
      isGameOver: false,
      isCheckmate: false,
      isDraw: false,
      turn: 'w'
    });
    // Force re-render of ChessGame component
    chessGameKey.current += 1;
  };

  return (
    <div className="chess">
      <ChessSidebar
        moveHistory={moveHistory}
        gameState={gameState}
        onReset={handleReset}
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
