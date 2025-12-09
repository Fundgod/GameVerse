import ChessGame from "./components/ChessGame";
import "./Chess.css";

export default function App() {
  return (
    <div className="chess">
      <div className="sidebar">
        <h2>Chess Hub</h2>
        <p>Controls, timer, move list etc. will be here.</p>
      </div>

      <div className="boardWrapper">
        <ChessGame />
      </div>
    </div>
  );
}
