#!/bin/bash

# --- 1. Aktivace Python virtuálního prostředí ---
echo "Aktivuji backend virtuální prostředí..."
source ./backend/venv/bin/activate

# --- 2. Spuštění backendu FastAPI ---
echo "Spouštím backend (FastAPI)..."
uvicorn backend.main:app --reload &   # & = na pozadí
BACKEND_PID=$!                        # uložíme PID backend procesu

# --- 3. Spuštění frontend Vite/React ---
echo "Spouštím frontend (Vite/React)..."
cd frontend
npm install
npm run dev
FRONTEND_PID=$!

# --- 4. Čekání na ukončení frontend procesu ---
wait $FRONTEND_PID

# --- 5. Ukončení backendu při zavření frontendu ---
echo "Zastavuji backend..."
kill $BACKEND_PID
