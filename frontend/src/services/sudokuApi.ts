import { Difficulty, GameMode } from '../types/sudoku.types';

// Nastav URL backendu - zmeň podľa potreby
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Typy pre API odpovede
export interface NewGameResponse {
  board: number[][];
  initial_board: number[][];
  solution?: number[][];
}

export interface MakeMoveResponse {
  is_correct: boolean;
  mistakes: number;
  filled_cells: number;
  is_complete: boolean;
  all_correct: boolean;
}

export interface HintResponse {
  row: number;
  col: number;
  value: number;
}

export interface GameStateResponse {
  board: number[][];
  filled_cells: number;
  mistakes: number;
  hints_used: number;
  time: number;
  is_complete: boolean;
}

export interface CompletionResponse {
  time: number;
  mistakes: number;
  difficulty: string;
}

// API funkcie
export const sudokuApi = {
  // Vytvorí novú hru
  async newGame(difficulty: Difficulty, mode: GameMode): Promise<NewGameResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/sudoku/new-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ difficulty, mode }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating new game:', error);
      throw error;
    }
  },

  // Urobí ťah
  async makeMove(row: number, col: number, value: number): Promise<MakeMoveResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/sudoku/make-move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ row, col, value }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error making move:', error);
      throw error;
    }
  },

  // Vymaže bunku
  async erase(row: number, col: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/sudoku/erase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ row, col }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error erasing cell:', error);
      throw error;
    }
  },

  // Získa nápovedu
  async getHint(): Promise<HintResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/sudoku/hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting hint:', error);
      throw error;
    }
  },

  // Spravuje poznámky
  async updateNotes(mode: 'toggle' | 'add', row: number, col: number, value: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/sudoku/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode, row, col, value }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      throw error;
    }
  },

  // Resetuje hru
  async reset(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/sudoku/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error resetting game:', error);
      throw error;
    }
  },

  // Získa aktuálny stav hry
  async getState(): Promise<GameStateResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/sudoku/state`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting state:', error);
      throw error;
    }
  },

  // Získa informácie o dokončení
  async getCompletion(): Promise<CompletionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/sudoku/completion`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting completion:', error);
      throw error;
    }
  },
};

export default sudokuApi;
