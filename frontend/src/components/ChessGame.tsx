import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard, type PieceDropHandlerArgs } from "react-chessboard";

type Move = {
  from: string;
  to: string;
  piece?: string;
  captured?: string;
};

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [moves, setMoves] = useState<Move[]>([]);
  const [boardWidth, setBoardWidth] = useState(Math.min(window.innerWidth * 0.8, 560));

  useEffect(() => {
    const handleResize = () => setBoardWidth(Math.min(window.innerWidth * 0.8, 560));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/api/status")
      .then(r => r.json())
      .then(d => {
        const el = document.getElementById("status");
        if (el) el.innerText = `Server: ${d.status}`;
      })
      .catch(() => {
        const el = document.getElementById("status");
        if (el) el.innerText = "Server: offline";
      });
  }, []);

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    console.log("Tah z", sourceSquare, "na", targetSquare); // debugger log

    // targetSquare can be null if piece is dropped off board
    if (!targetSquare) return false;

    // Create a new Chess instance and load current game state
    // (This is made this way so react-chessboard can update the board (newer version requires this))
    const gameCopy = new Chess();
    gameCopy.loadPgn(game.pgn());

    const move = gameCopy.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    } as any);

    if (move === null) {
      return false; // tah není povolen
    } else {
      // Update state with new game instance
      setGame(gameCopy);
      setFen(gameCopy.fen());
      setMoves(m => [...m, { from: sourceSquare, to: targetSquare, piece: move.piece, captured: (move as any).captured }]);

      fetch("http://localhost:8000/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_square: sourceSquare, to_square: targetSquare }),
      }).catch(() => { });
      return true; // tah povolen
    }
  }

  function onReset() {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setMoves([]);
  }

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", maxWidth: "100vw" }}>
      <div style={{ flex: "1 1 auto", minWidth: 280, maxWidth: boardWidth }}>
        <Chessboard
          options={{
            position: fen,
            onPieceDrop: onPieceDrop,
            boardStyle: { width: `${boardWidth}px` }
          }}
        />
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button onClick={onReset}>Reset</button>
          <div id="status" style={{ marginLeft: "auto", alignSelf: "center" }}></div>
        </div>
      </div>
      <div style={{ flexShrink: 0, width: 220, minWidth: 200 }}>
        <h3>Moves</h3>
        <ol>
          {moves.map((mv, i) => (
            <li key={i}>
              {mv.from} → {mv.to} {mv.captured ? `(x ${mv.captured})` : ""}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
