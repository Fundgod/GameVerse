import React, { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

type Move = {
  from: string;
  to: string;
  piece?: string;
  captured?: string;
};

export default function ChessGame() {
  const chessRef = useRef(new Chess());
  // Přidej fen s getterem
  const [fen, setFen] = useState(chessRef.current.fen());
  const [moves, setMoves] = useState<Move[]>([]);
  const [boardWidth, setBoardWidth] = useState(Math.min(window.innerWidth * 0.8, 560));

  const update = () => setFen(chessRef.current.fen());

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

  function onPieceDrop(source: string, target: string) {
    console.log("Tah z", source, "na", target); // debugger log
    const move = chessRef.current.move({
      from: source,
      to: target,
      promotion: "q",
    } as any);

    if (move === null) {
      return false; // tah není povolen
    } else {
      setMoves(m => [...m, { from: source, to: target, piece: move.piece, captured: (move as any).captured }]);
      update();
      fetch("http://localhost:8000/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_square: source, to_square: target }),
      }).catch(() => {});
      return true; // tah povolen
    }
  }

  function onReset() {
    chessRef.current.reset();
    setMoves([]);
    update();
  }

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", maxWidth: "100vw" }}>
      <div style={{ flex: "1 1 auto", minWidth: 280, maxWidth: boardWidth }}>
        <Chessboard position={fen} onPieceDrop={onPieceDrop} boardWidth={boardWidth} />
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
