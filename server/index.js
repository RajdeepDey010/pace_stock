const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(
    cors({
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    })
);

let activeGames = {}; 

const checkWinner = (board) => {
    for (let i = 0; i < 3; i++) {
        if (board[i][0] === board[i][1] && board[i][1] === board[i][2] && board[i][0] !== '') return board[i][0];
        if (board[0][i] === board[1][i] && board[1][i] === board[2][i] && board[0][i] !== '') return board[0][i];
    }
    if (board[0][0] === board[1][1] && board[1][1] === board[2][2] && board[0][0] !== '') return board[0][0];
    if (board[0][2] === board[1][1] && board[1][1] === board[2][0] && board[0][2] !== '') return board[0][2];
    return null;
};

io.on('connection', (socket) => {
    console.log('a user connected: ' + socket.id);

    socket.on('join_game', (gameID) => {
        let game = activeGames[gameID];

        if (!game) {
            game = { player1: socket, player2: null, currentTurn: 'player1', board: [['', '', ''], ['', '', ''], ['', '', '']] };
            activeGames[gameID] = game;
            socket.emit('game_joined', { player: 'player1', board: game.board });
        } else if (!game.player2) {
            game.player2 = socket;
            socket.emit('game_joined', { player: 'player2', board: game.board });
            game.player1.emit('game_start', { player: 'player1', board: game.board });
        } else {
            socket.emit('game_full');
        }
    });

    socket.on('make_move', (gameID, row, col, player) => {
        const game = activeGames[gameID];
        if (game && game.currentTurn === player && game.board[row][col] === '') {

            game.board[row][col] = player === 'player1' ? 'O' : 'X';
            game.currentTurn = player === 'player1' ? 'player2' : 'player1';

            const winner = checkWinner(game.board);
            if (winner) {
                game.player1.emit('game_over', { winner });
                game.player2.emit('game_over', { winner });
                delete activeGames[gameID];
            } else {

                game.player1.emit('update_board', game.board);
                game.player2.emit('update_board', game.board);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected: ' + socket.id);
    });
});

app.get('/', (req, res) => {
    res.send('Game server is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});