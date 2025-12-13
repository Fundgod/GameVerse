import { Link } from 'react-router-dom';
import type { Move } from 'chess.js';

interface ChessSidebarProps {
    moveHistory: Move[];
    gameState: {
        isGameOver: boolean;
        isCheckmate: boolean;
        isDraw: boolean;
        turn: 'w' | 'b';
    };
    whiteTime: number;
    blackTime: number;
    isTimerActive: boolean;
    onReset: () => void;
    onToggleTimer: () => void;
}

export default function ChessSidebar({
    moveHistory,
    gameState,
    whiteTime,
    blackTime,
    isTimerActive,
    onReset,
    onToggleTimer
}: ChessSidebarProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatMove = (move: Move, index: number) => {
        const moveNumber = Math.floor(index / 2) + 1;
        const isWhiteMove = index % 2 === 0;
        const notation = move.san;
        return { moveNumber, isWhiteMove, notation };
    };

    return (
        <div className="sidebar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Chess Hub</h2>
                <Link to="/" className="return-button">
                    ← Return
                </Link>
            </div>

            <div className="timerSection">
                <div className={`timer ${gameState.turn === 'b' ? 'active' : ''}`}>
                    <div className="playerLabel">Black</div>
                    <div className="timeDisplay">{formatTime(blackTime)}</div>
                </div>
                <div className={`timer ${gameState.turn === 'w' ? 'active' : ''}`}>
                    <div className="playerLabel">White</div>
                    <div className="timeDisplay">{formatTime(whiteTime)}</div>
                </div>
            </div>

            <div className="controls">
                <button onClick={onReset} className="controlButton">
                    Reset Game
                </button>
                <button
                    onClick={onToggleTimer}
                    className="controlButton"
                    disabled={gameState.isGameOver}
                >
                    {isTimerActive ? 'Pause' : 'Start'} Timer
                </button>
            </div>

            {gameState.isGameOver && (
                <div className="gameStatus">
                    {gameState.isCheckmate
                        ? `Checkmate! ${gameState.turn === 'w' ? 'Black' : 'White'} wins!`
                        : gameState.isDraw
                            ? 'Draw!'
                            : 'Game Over'}
                </div>
            )}

            <div className="moveList">
                <h3>Move History</h3>
                <div className="moveListContent">
                    {moveHistory.length === 0 ? (
                        <div className="emptyMoves">No moves yet</div>
                    ) : (
                        <div className="moves">
                            {moveHistory.map((move, index) => {
                                const { moveNumber, isWhiteMove, notation } = formatMove(move, index);

                                if (isWhiteMove) {
                                    return (
                                        <div key={index} className="moveRow">
                                            <span className="moveNumber">{moveNumber}.</span>
                                            <span className="moveNotation">{notation}</span>
                                            {moveHistory[index + 1] && (
                                                <span className="moveNotation">
                                                    {moveHistory[index + 1].san}
                                                </span>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
