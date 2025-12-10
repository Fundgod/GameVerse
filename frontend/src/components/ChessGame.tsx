import { useRef, useState, useEffect } from "react";
import { Chess, type Square, type Move } from "chess.js";
import { Chessboard, type PieceDropHandlerArgs, type SquareHandlerArgs } from "react-chessboard";

interface ChessGameProps {
  onMove?: (move: Move, history: Move[]) => void;
  onGameStateChange?: (gameState: {
    isGameOver: boolean;
    isCheckmate: boolean;
    isDraw: boolean;
    turn: 'w' | 'b';
  }) => void;
}

export default function ChessGame({ onMove, onGameStateChange }: ChessGameProps) {
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState('');
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});

  // notify parent of game state changes
  useEffect(() => {
    if (onGameStateChange) {
      onGameStateChange({
        isGameOver: chessGame.isGameOver(),
        isCheckmate: chessGame.isCheckmate(),
        isDraw: chessGame.isDraw(),
        turn: chessGame.turn()
      });
    }
  }, [chessPosition, onGameStateChange, chessGame]);

  // get the move options for a square to show valid moves
  function getMoveOptions(square: Square) {
    const moves = chessGame.moves({
      square,
      verbose: true
    });

    // if no moves, clear the option squares (may continue to show last touched piece)
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    // create a new object to store the option squares
    const newSquares: Record<string, React.CSSProperties> = {};

    // show all possible moves with this piece
    for (const move of moves) {
      newSquares[move.to] = {
        background: chessGame.get(move.to) && chessGame.get(move.to)?.color !== chessGame.get(square)?.color
          ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)' // larger circle for capturing
          : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)', // smaller circle for moving
        borderRadius: '50%'
      };
    }

    // set the square clicked to move from to yellow (add to previous return?)
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)'
    };

    setOptionSquares(newSquares);

    return true;
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    // if there is no piece selected and a piece is clicked, get the move options
    if (!moveFrom && piece) {
      const hasMoveOptions = getMoveOptions(square as Square);

      if (hasMoveOptions) {
        setMoveFrom(square);
      }

      return;
    }

    // square clicked to move to, check if valid move
    const moves = chessGame.moves({
      square: moveFrom as Square,
      verbose: true
    });
    const foundMove = moves.find(m => m.from === moveFrom && m.to === square);

    if (!foundMove) {
      // check if clicked on new piece
      const hasMoveOptions = getMoveOptions(square as Square);

      // if new piece, setMoveFrom, otherwise clear moveFrom
      setMoveFrom(hasMoveOptions ? square : '');

      return;
    }

    // is normal move
    try {
      const move = chessGame.move({
        from: moveFrom,
        to: square,
        promotion: 'q'
      });

      // update the position state
      setChessPosition(chessGame.fen());

      // notify parent of the move
      if (onMove && move) {
        onMove(move, chessGame.history({ verbose: true }));
      }

      setMoveFrom('');
      setOptionSquares({});
    } catch {
      // if invalid, setMoveFrom and getMoveOptions
      const hasMoveOptions = getMoveOptions(square as Square);

      if (hasMoveOptions) {
        setMoveFrom(square);
      }

      return;
    }
  }

  // handle piece drop
  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    // catch null targetSquare (if dropped off board)
    if (!targetSquare) {
      return false;
    }

    // try to make the move according to chess.js logic
    try {
      const move = chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // always promote to a queen
      });

      setChessPosition(chessGame.fen());  // re-render chessboard

      // notify parent (sidebar moves) of the move
      if (onMove && move) {
        onMove(move, chessGame.history({ verbose: true }));
      }

      setMoveFrom('');
      setOptionSquares({});

      return true;
    } catch {
      return false;
    }
  }

  // chessboard options
  const chessboardOptions = {
    onPieceDrop,
    onSquareClick,
    position: chessPosition,
    squareStyles: optionSquares,
    id: 'click-or-drag-to-move'
  };

  return <Chessboard options={chessboardOptions} />;
}