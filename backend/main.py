from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import nltk # type: ignore
from nltk.corpus import words # type: ignore

app = FastAPI()

# Povolit frontend přístup (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Při prvním spuštění stáhni slovník
try:
    nltk.data.find('corpora/words')
except LookupError:
    nltk.download('words')

# Načti JEN 5písmenná anglická slova
FIVE_LETTER_WORDS = set(
    word.lower() for word in words.words() 
    if len(word) == 5 and word.isalpha()
)

print(f"Načteno {len(FIVE_LETTER_WORDS)} pětipísmenných slov")

class Guess(BaseModel):
    word: str

# Simple global secret word
SECRET_WORD = random.choice(list(FIVE_LETTER_WORDS))

def compute_feedback(secret: str, guess: str) -> list[str]:
    feedback = ["B"] * len(secret)  # B = šedá
    secret_count = {}

    for c in secret:
        secret_count[c] = secret_count.get(c, 0) + 1

    # zelené (G)
    for i in range(len(secret)):
        if guess[i] == secret[i]:
            feedback[i] = "G"
            secret_count[guess[i]] -= 1

    # žluté (Y)
    for i in range(len(secret)):
        if feedback[i] == "B" and guess[i] in secret_count and secret_count[guess[i]] > 0:
            feedback[i] = "Y"
            secret_count[guess[i]] -= 1

    return feedback

@app.get("/")
def root():
    return {"message": "Wordle backend běží!"}

print(f"Slovo je: {SECRET_WORD}")

@app.post("/api/check_word")
def check_word(guess: Guess):
    global SECRET_WORD  # <-- musí být jako první ve funkci

    word = guess.word.lower()
    
    if len(word) != 5:
        raise HTTPException(status_code=400, detail="Slovo musí mít 5 písmen")
    if not word.isalpha():
        raise HTTPException(status_code=400, detail="Slovo musí obsahovat jen písmena")
    if word not in FIVE_LETTER_WORDS:
        raise HTTPException(status_code=400, detail="Neplatné anglické slovo")
    
    result = compute_feedback(SECRET_WORD, word)
    is_correct = word == SECRET_WORD

    # Pokud je slovo správné, vygeneruj nové
    if is_correct:
        SECRET_WORD = random.choice(list(FIVE_LETTER_WORDS))
        print(f"Nové tajné slovo je: {SECRET_WORD}")

    return {
        "word": word,
        "result": result,
        "is_correct": is_correct
    }

@app.get("/api/status")
async def status():
    return {"status": "ok", "message": "FastAPI backend is up"}
