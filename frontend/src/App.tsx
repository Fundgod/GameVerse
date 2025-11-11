import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Wordle from './Wordle';
import Chess from './Chess';
import Sudoku from './Sudoku';
import sudokuImg from "./assets/sudoku.png"
import wordleImg from "./assets/wordle.png"
import chessImg from "./assets/chess.png"

const App: React.FC = () => {
  return (
<Router>
  <Routes>
    <Route
      path="/"
      element={
        <div className="app-container">
          <HomePage />
        </div>
      }
    />
    <Route path="/wordle" element={<Wordle />} />
    <Route path="/chess" element={<Chess />} />
    <Route path="/sudoku" element={<Sudoku />} />
  </Routes>
</Router>
  );
};

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <header className="header">
        <h1>GameVerse</h1>
      </header>

<div className="games-grid">
  <Link to="/sudoku" className="game-card sudoku-color">
    <div className="card-inner sudoku-color">
      <img src={sudokuImg} alt="Sudoku" className="card-img" />
    </div>
    <h2>Sudoku</h2>
  </Link>
  <Link to="/chess" className="game-card chess-color">
    <div className="card-inner chess-color">
      <img src={chessImg} alt="Chess" className="card-img" />
    </div>
    <h2>Chess</h2>
  </Link>
  <Link to="/wordle" className="game-card wordle-color">
    <div className="card-inner wordle-color">
      <img src={wordleImg} alt="Wordle" className="card-img" />
    </div>
    <h2>Wordle</h2>
  </Link>
</div>


    </div>
  );
};

export default App;