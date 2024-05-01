import { WebSocketServer } from 'ws';
import { createServer } from 'http';

import { MinesweeperGame } from './MinesweeperGame.js';
import { calculateTileStatus } from './calculateTileStatus.js';
import { revealNeighbours } from './revealNeighbours.js';
import { checkWin } from '../util/commonFunctions.js';

// render.com provides tls certs
const server = createServer();

server.listen(10000);

const wss = new WebSocketServer({ server });

const games = []; // Stores all the current games
const WStoGamesIdx = new Map(); // Maps client websocket to specific index in games

const allWS = []; // TODO: Refactor this later once game rooms are working
let ID = 0;

wss.on('connection', function (ws) {
    allWS.push(ws); // TODO: Refactor when game rooms work
    ws.ID = ID++; // Unique ws identifier to track mouse movement
    console.log("ws.ID: ", ws.ID);
    console.log("allWS.length: ", allWS.length);
    
    ws.on('error', console.error);

    ws.on('message', function (message) {
        try {
            message = JSON.parse(message);
        } catch (e) {
            ws.send(JSON.stringify({type: "niceTry"}));
        }
        if (message.type !== "mouseMove") { // No spamming.
            console.log(message);
        }
        switch (message.type) {
            case "mouseMove": {
                for (let i = 0; i < allWS.length; i++) {
                    if (allWS[i] !== ws) { // If player who moved mouse sent the message, don't send mouseMoved message
                        console.log('wsID here: ', ws.ID);
                        allWS[i].send(JSON.stringify({type: "mouseMoved", x: message.x, y: message.y, wsID: ws.ID}));
                    }
                }
                break;
            }
            case "revealCell": {
                const gamesIdx = WStoGamesIdx.get(ws);
                const game = games[gamesIdx];
                if (game.lost) {
                    ws.send(JSON.stringify({type: "niceTry"}));
                    break;
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
                const game = games[gamesLength - 1];
                game.rows = message.rows;
                game.columns = message.columns;
                game.mines = message.mines;
                while (game.minePlacements.size < game.mines) { // Randomly generate mines
                    game.minePlacements.add(Math.floor(Math.random() * (game.rows * game.columns)));
                }
                console.log("game.minePlacements: ", game.minePlacements)
                ws.send(JSON.stringify({type: "generatedBoard", rows: game.rows, columns: game.columns, ws}));
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
        
        
        allWS.splice(allWS.indexOf(ws), 1); // TODO: Refactor when game rooms work
        if (allWS.length === 0) {
            ID = 0; // Reset ID counter if no one is connected
        }
    });
});