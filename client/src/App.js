import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5000');

function App() {
    const [gameID, setGameID] = useState('');
    const [player, setPlayer] = useState('');
    const [board, setBoard] = useState([['', '', ''], ['', '', ''], ['', '', '']]);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState('');

    useEffect(() => {
        socket.on('game_joined', (data) => {
            setPlayer(data.player);
            setBoard(data.board);
        });

        socket.on('game_start', (data) => {
            setPlayer(data.player);
            setBoard(data.board);
        });

        socket.on('game_full', () => {
            alert('Game is full, please try again later.');
        });

        socket.on('update_board', (newBoard) => {
            setBoard(newBoard);
        });

        socket.on('game_over', (data) => {
            setGameOver(true);
            setWinner(data.winner);
        });
    }, []);

    const joinGame = () => {
        socket.emit('join_game', gameID);
    };

    const handleCellClick = (row, col) => {
        if (board[row][col] || gameOver) return;
        const symbol = player === 'player1' ? 'O' : 'X';
        socket.emit('make_move', gameID, row, col, player);
    };

    return (
        <div className="App">
            <h1>Two-Player Game</h1>
            <input
                type="text"
                placeholder="Enter Game ID"
                value={gameID}
                onChange={(e) => setGameID(e.target.value)}
            />
            <button onClick={joinGame}>Join Game</button>
            {gameOver && <h2>Game Over! Winner: {winner}</h2>}
            <div className="board">
                {board.map((row, rowIndex) => (
                    <div key={rowIndex} className="row">
                        {row.map((cell, colIndex) => (
                            <button
                                key={colIndex}
                                className="cell"
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                            >
                                {cell}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;