import { useState, useEffect, useRef } from "react";
import "./Wordle.css";

type Feedback = "G" | "Y" | "B";

const ROWS = 6;
const COLS = 5;
const GAME_DURATION = 120; // 2 minuty

const ROW1 = ["Q","W","E","R","T","Y","U","I","O","P"];
const ROW2 = ["A","S","D","F","G","H","J","K","L"];
const ROW3 = ["Z","X","C","V","B","N","M"];

function App() {
  const [grid, setGrid] = useState<string[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(""))
  );
  const [feedbackGrid, setFeedbackGrid] = useState<Feedback[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill("B"))
  );
  const [currentRow, setCurrentRow] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeout = useRef<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [gameId, setGameId] = useState<string>("");
  const [timeLeft,   setTimeLeft] = useState(GAME_DURATION);
  const dataFetchedRef = useRef(false);
  const [isGameStopped, setIsGameStopped] = useState(false);

  const startNewGame = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/new_game", {
        method: "POST"
      });
      const data = await res.json();
      setGameId(data.game_id);
      
      // Reset vizuálních věcí
      setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
      setFeedbackGrid(Array.from({ length: ROWS }, () => Array(COLS).fill("B")));
      setCurrentRow(0);
      setCurrentWord("");
      setHasWon(false);
      setIsGameStopped(false);
      setTimeLeft(GAME_DURATION);
    } catch (err) {
      console.error("Nepodařilo se nastartovat hru:", err);
    }
  };

  useEffect(() => {
    // Pokud už jsme data načetli (nebo se načítají), nic nedělej
    if (dataFetchedRef.current) return;

    // Jinak nastav příznak na true a zavolej funkci
    dataFetchedRef.current = true;
    startNewGame();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    toastTimeout.current = window.setTimeout(() => {
      setToast(null);
      toastTimeout.current = null;
    }, 3000);
  };

  useEffect(() => {
    if (hasWon || timeLeft <= 0 || isGameStopped) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [hasWon, timeLeft, isGameStopped]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentRow >= ROWS || hasWon || timeLeft <= 0) return;

      if (e.key === "Enter") {
        handleSubmit();
      } else if (e.key === "Backspace") {
        setCurrentWord((prev) => prev.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        setCurrentWord((prev) =>
          prev.length < COLS ? prev + e.key.toUpperCase() : prev
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentWord, currentRow, hasWon, timeLeft]);

  const handleSubmit = async () => {
    if (timeLeft <= 0) {
      showToast("Čas vypršel!");
      return;
    }
    if (currentWord.length !== COLS) {
      showToast("Nedostatek písmen! Zadej 5 písmen.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/check_word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            word: currentWord, 
            game_id: gameId 
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        showToast(error.detail || "Neplatné anglické slovo!");
        return;
      }

      const data = await res.json();
      if (data.error) {
        alert(data.error);
        return;
      }

      const newGrid = grid.map((row, r) =>
        r === currentRow ? currentWord.split("") : row
      );
      setGrid(newGrid);

      const newFeedbackGrid = feedbackGrid.map((row, r) =>
        r === currentRow ? data.result : row
      );
      setFeedbackGrid(newFeedbackGrid);

      setCurrentRow((prev) => prev + 1);
      setCurrentWord("");

      if (data.is_correct) {
        setIsGameStopped(true);
        
        showToast("🎉 Gratuluji! Uhodl jsi slovo!");

        setTimeout(() => {
          setHasWon(true);
        }, 4000);
      }
    } catch (err) {
      console.error("Chyba:", err);
      showToast("Chyba spojení se serverem!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getKeyClassName = (key: string) => {
    let bestStatus = ""; 
    for (let r = 0; r < currentRow; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c] === key) {
          const feedback = feedbackGrid[r][c];
          if (feedback === "G") return " green"; 
          if (feedback === "Y") bestStatus = " yellow";
          if (feedback === "B" && bestStatus === "") bestStatus = " black";
        }
      }
    }
    return bestStatus;
  };

  const handleKeyClick = (key: string) => {
     if (isSubmitting || timeLeft <= 0) return;
     if (currentWord.length < COLS && currentRow < ROWS) {
       setCurrentWord((prev) => prev + key);
     }
  };

  const handleBackspace = () => {
    if (timeLeft <= 0) return;
    setCurrentWord((prev) => prev.slice(0, -1));
  };

  const handleEnter = () => {
    if (isSubmitting || timeLeft <= 0) return;
    handleSubmit();
  };

 // --- NOVÉ: Výherní obrazovka se statickou ikonou ---
// ... zbytek kódu (state, useEffects atd.) zůstává stejný ...

  if (hasWon) {
    // ... kód pro výherní obrazovku zůstává stejný ...
    return (
      <div className="win-screen">
         {/* ... (tady nic neměníme, viz předchozí krok) ... */}
         {/* Jen pro jistotu, aby to fungovalo, zkopíruj si sem svůj funkční win-screen */}
         <h1>WORDLE UNLIMITED</h1>
         <div className="mini-grid-icon">
            <div className="mini-row">
              <div className="mini-cell-static yellow"></div>
              <div className="mini-cell-static green"></div>
              <div className="mini-cell-static black"></div>
            </div>
            <div className="mini-row">
              <div className="mini-cell-static black"></div>
              <div className="mini-cell-static black"></div>
              <div className="mini-cell-static yellow"></div>
            </div>
            <div className="mini-row">
              <div className="mini-cell-static black"></div>
              <div className="mini-cell-static yellow"></div>
              <div className="mini-cell-static green"></div>
            </div>
         </div>
         <h2 className="win-title">Congratulations, you guessed it!</h2>
         <p className="win-subtitle">You used {currentRow} of {ROWS} guesses</p>
         <p className="win-subtitle">Remaining time : {timeLeft}s</p>
         <div className="win-buttons">
            <button className="btn-grey" onClick={() => window.location.href = "/"}>Main Menu</button>
            <button className="btn-grey" onClick={startNewGame}>Play Again <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor" 
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginLeft: "5px" }} // Malá mezera od textu
            >
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg></button>
         </div>
      </div>
    );
  }

  return (
    <div className="wordle-app-container" tabIndex={-1}>
      {toast && <div className="toast">{toast}</div>}

      <h1>WORDLE UNLIMITED</h1>

      {/* --- NOVÁ STRUKTURA: Flex kontejner pro mřížku a panel --- */}
      <div className="game-content">
        
        {/* LEVÁ ČÁST: Herní mřížka */}
        <div className="grid-container">
          {grid.map((row, r) => {
            const isCurrent = r === currentRow;
            const currentLetters = isCurrent
              ? [...currentWord.split(""), ...Array(COLS - currentWord.length).fill("")]
              : row;

            return (
              <div key={r} className="grid-row">
                {currentLetters.map((cell, c) => {
                  const feedback = feedbackGrid[r][c];
                  const entered = cell !== "";
                  let className = "grid-cell";

                  if (entered) {
                    if (currentRow === r) {
                      className += " filled";
                    } else if (currentRow > r || feedback !== "B") {
                      if (feedback === "G") className += " green";
                      else if (feedback === "Y") className += " yellow";
                      else className += " black";
                    }
                  }
                  return <span key={c} className={className}>{cell.toUpperCase()}</span>;
                })}
              </div>
            );
          })}
        </div>

        {/* PRAVÁ ČÁST: Boční panel (Čas, Tahy, Leave) */}
        <div className="side-panel">
          
          {/* Časovač */}
          <div className="info-container">
            <div className="info-label">REMAINING TIME</div>
            <div className="info-box">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Počítadlo tahů */}
          <div className="info-container">
            <div className="info-label">REMAINING MOVES</div>
            <div className="info-box">
              {ROWS - (isGameStopped ? currentRow - 1 : currentRow)}/{ROWS}
            </div>
          </div>

          {/* Tlačítko Leave */}
          <div className="info-container">
            {/* Tento text není vidět, ale drží přesnou výšku mezery */}
            <div className="info-label" style={{ visibility: "hidden" }}>PLACEHOLDER</div>
            <button 
              className="leave-btn" 
              onClick={() => window.location.href = "/"} 
            >
              Leave ←
            </button>
          </div>

        </div>
      </div>

      {/* Klávesnice (zůstává dole pod hlavním obsahem) */}
      <div className="keyboard">
        <div className="keyboard-row">
          {ROW1.map((key) => (
            <button
              key={key}
              onClick={(e) => { handleKeyClick(key); (e.currentTarget as HTMLButtonElement).blur(); }}
              className={(key.length === 1 ? "key key-big" : "key") + getKeyClassName(key)}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="keyboard-row">
          {ROW2.map((key) => (
            <button
              key={key}
              onClick={(e) => { handleKeyClick(key); (e.currentTarget as HTMLButtonElement).blur(); }}
              className={(key.length === 1 ? "key key-big" : "key") + getKeyClassName(key)}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="keyboard-row keyboard-row-last">
          <button 
            onClick={(e) => { handleEnter(); (e.currentTarget as HTMLButtonElement).blur(); }} 
            className="key key-wide"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="9 10 4 15 9 20"></polyline>
              <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
            </svg>
          </button>
          {ROW3.map((key) => (
            <button
              key={key}
              onClick={(e) => { handleKeyClick(key); (e.currentTarget as HTMLButtonElement).blur(); }}
              className={(key.length === 1 ? "key key-big" : "key") + getKeyClassName(key)}
            >
              {key}
            </button>
          ))}
          <button onClick={(e) => { handleBackspace(); (e.currentTarget as HTMLButtonElement).blur(); }} className="key key-wide">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M20 12H4"/>
              <path d="M10 18l-6-6 6-6"/>
            </svg>
          </button>
        </div>
      </div>

      {timeLeft === 0 && !hasWon && (
        <div style={{ marginTop: "20px", color: "red", fontWeight: "bold" }}>
          Čas vypršel!
        </div>
      )}
    </div>
  );
}

export default App;