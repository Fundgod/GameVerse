import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import nltk 
from nltk.corpus import words 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Ujistíme se, že máme stažený korpus slov
try:
    nltk.data.find('corpora/words')
except LookupError:
    nltk.download('words')

# Načteme slovník anglických slov
VALID_GUESSES = set(
    word.lower() for word in words.words() 
    if len(word) == 5 and word.isalpha()
)

# Zjednodušený slovník pro výběr tajného slova
SECRET_CANDIDATES = list(set(
    word.lower() for word in words.words('en-basic') 
    if len(word) == 5 and word.isalpha()
))

# Debug výpisy
print(f"{len(VALID_GUESSES)} five-letter words loaded in secret dictionary, of which {len(SECRET_CANDIDATES)} are in the simplified.")

# Ukládáme hry do paměti pomocí slovníku
GAMES = {} 

# Model pro příchozí hádání slova
class Guess(BaseModel):
    word: str
    game_id: str

# Funkce pro výpočet zpětné vazby
def compute_feedback(secret: str, guess: str) -> list[str]:
    feedback = ["B"] * len(secret)
    secret_count = {}
    for c in secret:
        secret_count[c] = secret_count.get(c, 0) + 1
    for i in range(len(secret)):
        if guess[i] == secret[i]:
            feedback[i] = "G"
            secret_count[guess[i]] -= 1
    for i in range(len(secret)):
        if feedback[i] == "B" and guess[i] in secret_count and secret_count[guess[i]] > 0:
            feedback[i] = "Y"
            secret_count[guess[i]] -= 1
    return feedback

# Running Endpoint
@app.get("/")
def root():
    return {"message": "Wordle backend running!"}

# Endpoint pro vytvoření nové hry
@app.post("/api/new_game")
def new_game():
    game_id = str(uuid.uuid4())
    if not SECRET_CANDIDATES:
        # Kdyby seznam prázdný - použijeme pevné slovo pro testování
        secret_word = "apple" 
    else:
        secret_word = random.choice(SECRET_CANDIDATES)
        
    GAMES[game_id] = secret_word
    print(f"New game: {game_id}: {secret_word}")
    return {"game_id": game_id}

# Endpoint pro kontrolu hádaného slova
@app.post("/api/check_word")
def check_word(guess: Guess):
    # Najdeme tajné slovo pro tuto konkrétní hru
    secret_word = GAMES.get(guess.game_id)

    if not secret_word:
        raise HTTPException(status_code=404, detail="Game not found (probably expired or does not exist)")

    word = guess.word.lower()
    # Validace vstupu
    if len(word) != 5:
        raise HTTPException(status_code=400, detail="The word must have 5 letters.")
    if not word.isalpha():
        raise HTTPException(status_code=400, detail="The word must contain only letters")
    if word not in VALID_GUESSES:
        raise HTTPException(status_code=400, detail="Invalid English word")
    
    result = compute_feedback(secret_word, word)
    is_correct = word == secret_word

    # Debug výpis
    return {
        "word": word,
        "result": result,
        "is_correct": is_correct
    }

# Endpoint pro získání stavu serveru
@app.get("/api/status")
async def status():
    return {"status": "ok", "active_games": len(GAMES)}