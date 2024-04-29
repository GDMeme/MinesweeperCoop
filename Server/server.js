import { WebSocketServer } from 'ws';
import { createServer } from 'http';

import { MinesweeperGame } from './MinesweeperGame.js';
import { calculateTileStatus } from './calculateTileStatus.js';
import { revealNeighbours } from './revealNeighbours.js';
import { checkWin } from './util/commonFunctions.js';

// render.com provides tls certs
const server = createServer();

server.listen(10000);

const wss = new WebSocketServer({ server });

const games = []; // Stores all the current games
const WStoGamesIdx = new Map(); // Maps client websocket to specific index in games

wss.on('connection', function (ws) {
    ws.on('error', console.error);

    ws.on('message', function (message) {
        try {
            message = JSON.parse(message);
        } catch (e) {
            ws.send(JSON.stringify({type: "niceTry"}));
        }
        console.log(message);
        switch (message.type) {
            case "revealCell": {
                const gamesIdx = WStoGamesIdx.get(ws);
                const game = games[gamesIdx];
                if (game.lost) {
                    ws.send(JSON.stringify({type: "niceTry"}));
                    return;
                }
                const x = parseInt(message.x);
                const y = parseInt(message.y);
                const cellID = y * game.columns + x;
                console.log("User revealed a cell, game.cellID: ", cellID);
                if (game.minePlacements.has(cellID) && !game.firstClick) {
                    ws.send(JSON.stringify({type: "revealCell", id: "cell" + x + "_" + y, tileStatus: "bomb"}));
                    game.lost = true;
                } else {
                    if (game.minePlacements.has(cellID) && game.firstClick) { // First click was a mine
                        game.minePlacements.delete(cellID);
                        while (game.minePlacements.size < game.mines) { // Generate a mine in a different place
                            let newMine = Math.floor(Math.random() * (game.rows * game.columns));
                            if (newMine !== cellID) {
                                game.minePlacements.add(newMine);
                            }
                        }
                    }
                    const tileStatus = calculateTileStatus(game.minePlacements, x, y, game.rows, game.columns);
                    ws.send(JSON.stringify({type: "revealCell", id: "cell" + x + "_" + y, tileStatus}));
                    game.cellsRevealed.add([x, y].join());
                    if (tileStatus === 0) {
                        revealNeighbours(game.minePlacements, x, y, game.rows, game.columns, game.cellsRevealed, ws);
                    }
                    checkWin(game, ws);
                }
                console.log("size of game.cellsRevealed: ", game.cellsRevealed.size);
                game.firstClick = false;
                break;
            }
            case "revealChord": {
                const gamesIdx = WStoGamesIdx.get(ws);
                const game = games[gamesIdx];
                const x = parseInt(message.x);
                const y = parseInt(message.y);
                const cellID = y * game.columns + x;
                if (game.minePlacements.has(cellID)) { // Just to be safe, check if the number they chorded was a mine
                    ws.send(JSON.stringify({type: "revealCell", id: "cell" + x + "_" + y, tileStatus: "bomb"}));
                    game.lost = true;
                }
                // Reveal the rest of the chord even if they hit a mine
                revealNeighbours(game.minePlacements, x, y, game.rows, game.columns, game.cellsRevealed, ws);
                checkWin(game, ws);
                console.log("size of game.cellsRevealed: ", game.cellsRevealed.size);
                break;
            }
            case "generateBoard": {
                const gamesLength = games.push(new MinesweeperGame());
                console.log("gamesLength: ", gamesLength);
                WStoGamesIdx.set(ws, gamesLength - 1); // -1 because 0 indexed
                console.log(WStoGamesIdx);
                const game = games[gamesLength - 1];
                game.rows = message.rows;
                game.columns = message.columns;
                game.mines = message.mines;
                while (game.minePlacements.size < game.mines) { // Randomly generate mines
                    game.minePlacements.add(Math.floor(Math.random() * (game.rows * game.columns)));
                }
                console.log("game.minePlacements: ", game.minePlacements)
                ws.send(JSON.stringify({type: "generatedBoard", rows: game.rows, columns: game.columns}));
                break;
            }
            default:
                ws.send(JSON.stringify({type: "niceTry"}));
        }
    });
    ws.on('close', function () {
        const gamesIdx = WStoGamesIdx.get(ws);
        // TODO: Will be different in multiplayer
        if (gamesIdx !== undefined) {
            games.splice(gamesIdx, 1);
            WStoGamesIdx.delete(ws);
            console.log("Removing gamesIdx: ", gamesIdx);
            console.log("games: ", games);
        }
    });
});