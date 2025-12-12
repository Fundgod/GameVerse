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
  
  // NOVÉ: Stav pro barvy klávesnice (aby se aktualizovaly postupně)
  const [keyboardStatus, setKeyboardStatus] = useState<Record<string, Feedback>>({});

  const [currentRow, setCurrentRow] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeout = useRef<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Stavy hry
  const [hasWon, setHasWon] = useState(false);
  const [gameId, setGameId] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isGameStopped, setIsGameStopped] = useState(false);
  
  const [showResultModal, setShowResultModal] = useState(false);

  const dataFetchedRef = useRef(false);

  const startNewGame = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/new_game", {
        method: "POST"
      });
      const data = await res.json();
      setGameId(data.game_id);
      
      // Reset
      setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
      setFeedbackGrid(Array.from({ length: ROWS }, () => Array(COLS).fill("B")));
      setKeyboardStatus({}); // Reset klávesnice
      setCurrentRow(0);
      setCurrentWord("");
      setHasWon(false);
      setIsGameStopped(false);
      setShowResultModal(false);
      setTimeLeft(GAME_DURATION);
    } catch (err) {
      console.error("Nepodařilo se nastartovat hru:", err);
    }
  };

  useEffect(() => {
    if (dataFetchedRef.current) return;
    dataFetchedRef.current = true;
    startNewGame();
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
    if (isGameStopped) return; 

    if (timeLeft <= 0) {
      setIsGameStopped(true);
      showToast("Čas vypršel!");
      setTimeout(() => {
        setShowResultModal(true);
      }, 3000);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, isGameStopped]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameStopped) return;

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
  }, [currentWord, currentRow, isGameStopped]);

  const handleSubmit = async () => {
    if (isGameStopped) return;
    
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

      // 1. Aktualizace gridu (spustí CSS animace na kartičkách)
      const newGrid = grid.map((row, r) =>
        r === currentRow ? currentWord.split("") : row
      );
      setGrid(newGrid);

      const newFeedbackGrid = feedbackGrid.map((row, r) =>
        r === currentRow ? data.result : row
      );
      setFeedbackGrid(newFeedbackGrid);

      // 2. Postupná aktualizace klávesnice (synchronizovaná s CSS)
      const resultColors: Feedback[] = data.result;
      const letters = currentWord.split("");

      letters.forEach((letter, index) => {
        const color = resultColors[index];
        // Výpočet zpoždění: (index * 300ms delay mezi kartami) + 250ms (polovina flip animace)
        const delay = (index * 300) + 300;

        setTimeout(() => {
          setKeyboardStatus((prev) => {
            const currentStatus = prev[letter];
            
            // Logika priorit: Green > Yellow > Black
            // Pokud je nová barva zelená, přepsat cokoliv
            if (color === "G") return { ...prev, [letter]: "G" };
            
            // Pokud je nová barva žlutá a současná není zelená, přepsat
            if (color === "Y" && currentStatus !== "G") return { ...prev, [letter]: "Y" };
            
            // Pokud je nová barva černá a klávesa ještě nemá barvu, nastavit černou
            if (color === "B" && !currentStatus) return { ...prev, [letter]: "B" };
            
            return prev;
          });
        }, delay);
      });

      // 3. Posun na další řádek a kontrola konce hry
      const nextRow = currentRow + 1;
      setCurrentRow(nextRow);
      setCurrentWord("");

      if (data.is_correct) {
        setIsGameStopped(true);
        showToast("🎉 Gratuluji! Uhodl jsi slovo!");
        setTimeout(() => {
          setHasWon(true);
          setShowResultModal(true); 
        }, 3000); // Čeká se déle než trvají všechny animace (cca 1700ms)
      } 
      else if (nextRow >= ROWS) {
        setIsGameStopped(true);
        showToast("Konec hry! Došly pokusy.");
        setTimeout(() => {
            setShowResultModal(true); 
        }, 3000);
      }

    } catch (err) {
      console.error("Chyba:", err);
      showToast("Chyba spojení se serverem!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upravená funkce: čte přímo z uloženého stavu klávesnice
  const getKeyClassName = (key: string) => {
    const status = keyboardStatus[key];
    if (status === "G") return " green";
    if (status === "Y") return " yellow";
    if (status === "B") return " black";
    return "";
  };

  const handleKeyClick = (key: string) => {
     if (isSubmitting || isGameStopped) return;
     if (currentWord.length < COLS) {
       setCurrentWord((prev) => prev + key);
     }
  };

  const handleBackspace = () => {
    if (isGameStopped) return;
    setCurrentWord((prev) => prev.slice(0, -1));
  };

  const handleEnter = () => {
    if (isSubmitting || isGameStopped) return;
    handleSubmit();
  };

  if (showResultModal) {
    const isTimeOut = timeLeft <= 0 && !hasWon;
    
    return (
      <div className="win-screen">
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

         {hasWon ? (
            <>
              <h2 className="result-title green">CONGRATULATIONS, YOU GUESSED IT!</h2>
              <p className="win-subtitle">You used {currentRow} of {ROWS} guesses</p>
              <p className="win-subtitle">Time remaining: {formatTime(timeLeft)}</p>
            </>
         ) : (
            <>
              <h2 className="result-title red">
                {isTimeOut ? "TIME'S UP!" : "GAME OVER"}
              </h2>
              <p className="win-subtitle">
                {isTimeOut ? "You ran out of time." : "You ran out of guesses."}
              </p>
              <p className="win-subtitle">Don't worry, try again!</p>
            </>
         )}

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
              style={{ marginLeft: "5px" }}
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

      <div className="game-content">
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

        <div className="side-panel">
          <div className="info-container">
            <div className="info-label">REMAINING TIME</div>
            <div className="info-box">
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="info-container">
            <div className="info-label">REMAINING MOVES</div>
            <div className="info-box">
              {Math.min(ROWS, currentRow)}/{ROWS}
            </div>
          </div>

          <div className="info-container">
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
    </div>
  );
}

export default App;