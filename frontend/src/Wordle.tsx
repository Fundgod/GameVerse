import { useState, useEffect, useRef } from "react";
import "./Wordle.css";
type Feedback = "G" | "Y" | "B";

const ROWS = 6;
const COLS = 5;

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

  // Toast notifikace
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

  // Klávesnice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentRow >= ROWS) return;

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
  }, [currentWord, currentRow]);

  // Odeslání slova
  const handleSubmit = async () => {
    if (currentWord.length !== COLS) {
      showToast("Nedostatek písmen! Zadej 5 písmen.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/check_word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: currentWord }),
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

      // Kontrola výhry
      if (data.is_correct) {
        setHasWon(true);
        showToast("🎉 Gratuluji! Uhodl jsi slovo!");
      }
    } catch (err) {
      console.error("Chyba při odesílání:", err);
      showToast("Chyba spojení se serverem!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClickLetter = (letter: string) => {
    if (isSubmitting) return;
    if (currentWord.length < COLS && currentRow < ROWS) {
      setCurrentWord((prev) => prev + letter);
    }
  };

  const handleClickBackspace = () => {
    setCurrentWord((prev) => prev.slice(0, -1));
  };

  const handleClickEnter = () => {
    if (isSubmitting) return;
    handleSubmit();
  };

  if (hasWon) {
    return (
      <div className="win-screen">
        <h2>Gratuluji, vyhrál jsi!</h2>
        <button
          onClick={() => {
            // Reset hry
            setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill("")));
            setFeedbackGrid(Array.from({ length: ROWS }, () => Array(COLS).fill("B")));
            setCurrentRow(0);
            setCurrentWord("");
            setHasWon(false);
          }}
        >
          Hrát znovu
        </button>

        <button
          onClick={() => {
            // Přejdi do menu - případně použij router, např. navigate("/")
            window.location.href = "/";
          }}
        >
          Zpět do menu
        </button>
      </div>
    );
  }

  return (
    <div className="wordle-app-container" tabIndex={-1}>
      {toast && <div className="toast">{toast}</div>}

      <h1>WORDLE UNLIMITED</h1>

      {/* Herní mřížka */}
      <div>
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
                    // Aktuální řádek, před Enterem
                    className += " filled";
                  } else if (currentRow > r || feedback !== "B") {
                    // Minulé řádky (po Enteru) s barvou podle feedbacku
                    if (feedback === "G") {
                      className += " green";
                    } else if (feedback === "Y") {
                      className += " yellow";
                    } else {
                      className += " black";
                    }
                  }
                }

                return (
                  <span key={c} className={className}>
                    {cell.toUpperCase()}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Klávesnice */}
      <div className="keyboard">
        <div className="keyboard-row">
          {ROW1.map((key) => (
            <button
              key={key}
              onClick={(e) => {
                handleClickLetter(key);
                (e.currentTarget as HTMLButtonElement).blur();
              }}
              className={key.length === 1 ? "key key-big" : "key"}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="keyboard-row">
          {ROW2.map((key) => (
            <button
              key={key}
              onClick={(e) => {
                handleClickLetter(key);
                (e.currentTarget as HTMLButtonElement).blur();
              }}
              className={key.length === 1 ? "key key-big" : "key"}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="keyboard-row keyboard-row-last">
          <button
            onClick={(e) => {
              handleClickEnter();
              (e.currentTarget as HTMLButtonElement).blur();
            }}
            className="key key-wide"
          >
            Enter
          </button>
          {ROW3.map((key) => (
            <button
              key={key}
              onClick={(e) => {
                handleClickLetter(key);
                (e.currentTarget as HTMLButtonElement).blur();
              }}
              className={key.length === 1 ? "key key-big" : "key"}
            >
              {key}
            </button>
          ))}
          <button
            onClick={(e) => {
              handleClickBackspace();
              (e.currentTarget as HTMLButtonElement).blur();
            }}
            className="key key-wide"
          >
            Backspace
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
