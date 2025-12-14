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
  const [kingSquare, setKingSquare] = useState<string | null>(null);

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
  }, [chessPosition]);

  // detect if king is in check and find its position
  useEffect(() => {
    if (chessGame.inCheck()) {
      const currentTurn = chessGame.turn();
      // find the king
      const board = chessGame.board();
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = board[row][col];
          if (piece && piece.type === 'k' && piece.color === currentTurn) {
            const file = String.fromCharCode(97 + col); // 'a' to 'h'
            const rank = (8 - row).toString(); // '8' to '1'
            setKingSquare(file + rank);
            return;
          }
        }
      }
    } else {
      setKingSquare(null);
    }
  }, [chessPosition, chessGame]);

  function getMoveOptions(square: Square) {
    const moves = chessGame.moves({
      square,
      verbose: true
    });

    // if no moves, clear the option squares
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, React.CSSProperties> = {};

    for (const move of moves) {
      newSquares[move.to] = {
        background: chessGame.get(move.to) && chessGame.get(move.to)?.color !== chessGame.get(square)?.color
          ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)' // large circle for captures
          : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)', // small circle for moves
        borderRadius: '50%'
      };
    }

    // set the square clicked to move from to yellow
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)'
    };

    // add king in check highlight
    if (kingSquare && !newSquares[kingSquare]) {
      newSquares[kingSquare] = {
        background: 'rgba(255, 0, 0, 0.6)'
      };
    }

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

    // normal move
    try {
      const move = chessGame.move({
        from: moveFrom,
        to: square,
        promotion: 'q'
      });

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

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    if (!targetSquare) {
      return false;
    }

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
  // always show king in check if applicable
  const customSquares = { ...optionSquares };
  if (kingSquare && !customSquares[kingSquare]) {
    customSquares[kingSquare] = {
      background: 'rgba(255, 0, 0, 0.6)'
    };
  }

  const chessboardOptions = {
    onPieceDrop,
    onSquareClick,
    position: chessPosition,
    squareStyles: customSquares,
    id: 'click-or-drag-to-move'
  };

  return <Chessboard options={chessboardOptions} />;
}