# GameVerse

A collection of browser-based games built with React, TypeScript, and FastAPI. Includes Chess, Wordle, and Sudoku.

## What's Inside

- **Chess** - Play chess with move validation and drag-and-drop
- **Wordle** - Word guessing game with different categories (Food, Animals, or full Dictionary)
- **Sudoku** - Number puzzle game

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- react-chessboard
- chess.js

### Backend
- FastAPI
- NLTK (for word validation)
- Uvicorn

## Prerequisites

- Node.js (v16 or higher)
- npm
- Python 3.8+
- pip

## Running the Project

### Quick Start

Just run the startup script:

```bash
./start.sh
```

This will start both the backend and frontend. You can then access:
- Frontend at http://localhost:5173
- Backend API at http://localhost:8000

### Manual Setup

If you want to set things up yourself:

**Backend:**

```bash
cd backend

# Set up virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies from requirements.txt
pip install -r requirements.txt

# Download NLTK word corpus (needed for Wordle)
python -c "import nltk; nltk.download('words')"

# Run the server
uvicorn main:app --reload
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
GameVerse/
├── backend/
│   ├── main.py              # API endpoints
│   ├── requirements.txt     # Python dependencies
│   └── venv/                # Virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── Chess.tsx        # Chess game
│   │   ├── Wordle.tsx       # Wordle game
│   │   ├── App.tsx          # Main app
│   │   └── ...
│   └── package.json         # Node dependencies
└── start.sh                 # Startup script
```

## API Endpoints

The backend has these endpoints (mainly for Wordle):

- `GET /` - Check if backend is running
- `GET /api/categories` - Get word categories
- `POST /api/new_game` - Start new game
- `POST /api/check_word` - Check a guessed word
- `GET /api/status` - Server status

You can see the full API docs at http://localhost:8000/docs when the server is running.

## Development

**Frontend:**
```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run linter
```

**Backend:**
```bash
source venv/bin/activate
uvicorn main:app --reload
```

## Notes

- The NLTK word corpus needs to be downloaded on first run (happens automatically when you import nltk)
- Wordle categories are defined in `backend/main.py`
- Chess uses the chess.js library for move validation

## Authors

Jiří Hronský (xhronsj00)
Savin Ivan (xsavini00)
Natalia Holbikova (xholbin00)

This is an academic project.
