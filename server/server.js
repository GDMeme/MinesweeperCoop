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

const games = []; // * Push to const is not functional? But who cares
const WStoGameID = new Map(); // Maps client websocket to a specific game ID
const WStoPlayerName = new Map(); // Client must enter their player name before they connect to the server

// * Do these need to be atomic?
let gameIDCounter = 0;
let wsIDCounter = 0; // Unique ws identifier to track mouse movement

wss.on('connection', function (ws) {
    ws.ID = wsIDCounter++;
    console.log("ws.ID: ", ws.ID);
    
    ws.on('error', console.error);

    ws.on('message', function (message) {
        try {
            message = JSON.parse(message);
        } catch (e) {
            ws.send(JSON.stringify({type: "niceTry"}));
        }
        if (message.type !== "mouseMove") { // No spamming logs.
            console.log(message);
        }
        
        // Convoluted but it's fine
        const gameID = WStoGameID.get(ws); 
        let game = undefined;
        if (gameID) {
            const gameIndex = findGameIndex(games, gameID);
            game = games[gameIndex];
        }
        
        switch (message.type) {
            case "newConnection": {
                WStoPlayerName.set(ws, message.playerName);
                break;
            }
            case "createRoom": {
                // * * Check if they are in another room
                if (WStoGameID.get(ws) !== undefined) {
                    ws.send(JSON.stringify({type: 'niceTry'}));
                    break;
                }
                const gamesLength = games.push(new MinesweeperGame()); // No race condition
                console.log("gamesLength: ", gamesLength);
                const game = games[gamesLength - 1];
                game.ID = ++gameIDCounter;
                console.log("game.ID: ", game.ID);
                console.log("gameIDCounter: ", gameIDCounter);
                game.wsPlayers.push(ws);
                WStoGameID.set(ws, game.ID);
                break;
            }
            case "joinedRoom": {
                // Check if they are already in a room
                if (game !== undefined) {
                    console.log("Client was already in a room and tried to join another room");
                    ws.send(JSON.stringify({type: 'niceTry'}));
                    break;
                }
                WStoGameID.set(ws, message.gameID);
                console.log("message.gameID: ", message.gameID);
                const gameIndex = findGameIndex(games, message.gameID);
                game = games[gameIndex];
                for (const currentWS of game.wsPlayers) {
                    // Send message to new player as well
                    currentWS.send(JSON.stringify({type: 'addPlayer', name: WStoPlayerName.get(ws)})); 
                    ws.send(JSON.stringify({type: 'addPlayer', name: WStoPlayerName.get(currentWS)}));
                }
                game.wsPlayers.push(ws); // Add the new player to the game
                break;
            }
            case "requestGames": { // TODO: Don't send the entire games object because it contains minePlacements
                ws.send(JSON.stringify({type: "sendGames", games}));
            }
            case "mouseMove": {
                if (!game) {
                    console.log("no game detected!");
                    break;
                }
                for (const currentWS of game.wsPlayers) {
                    if (currentWS !== ws) { // If player who moved mouse sent the message, don't send mouseMoved message
                        currentWS.send(JSON.stringify({type: "mouseMoved", x: message.x, y: message.y, wsID: ws.ID})); // Send ID of client who moved
                    }
                }
                break;
            }
            case "revealCell": {
                if (game.lost) {
                    ws.send(JSON.stringify({type: "niceTry"}));
                    break;
                }
                const x = parseInt(message.x);
                const y = parseInt(message.y);
                const cellID = y * game.columns + x;
                console.log("User revealed a cell, game.cellID: ", cellID);
                if (game.minePlacements.has(cellID) && !game.firstClick) {
                    for (const currentWS of game.wsPlayers) {
                        currentWS.send(JSON.stringify({type: "revealCell", id: "cell" + x + "_" + y, tileStatus: "bomb"}));
                        game.lost = true;
                    }
                } else {
                    if (game.minePlacements.has(cellID) && game.firstClick) { // First click was a mine
                        game.minePlacements.delete(cellID);
                        while (game.minePlacements.size < game.mines) { // Generate a mine in a different place
                            let newMine = Math.floor(Math.random() * (game.rows * game.columns));
                            if (newMine !== cellID) {
                                game.minePlacements.add(newMine); // Try to add the new mine (could still be duplicate)
                            }
                        }
                    }
                    const tileStatus = calculateTileStatus(game, x, y);
                    for (const currentWS of game.wsPlayers) {
                        currentWS.send(JSON.stringify({type: "revealCell", id: "cell" + x + "_" + y, tileStatus}));
                    }
                    game.cellsRevealed.add([x, y].join()); // adds a comma in between
                    if (tileStatus === 0) {
                        revealNeighbours(game, x, y, ws.ID);
                    }
                    checkWin(game);
                }
                console.log("size of game.cellsRevealed: ", game.cellsRevealed.size);
                game.firstClick = false;
                break;
            }
            case "revealChord": {
                const x = parseInt(message.x);
                const y = parseInt(message.y);
                const cellID = y * game.columns + x;
                if (game.minePlacements.has(cellID)) { // Just to be safe, check if the number they chorded was a mine
                    ws.send(JSON.stringify({type: "revealCell", id: "cell" + x + "_" + y, tileStatus: "bomb"}));
                    game.lost = true;
                }
                // Reveal the rest of the chord even if they hit a mine
                revealNeighbours(game, x, y, ws.ID);
                checkWin(game);
                console.log("size of game.cellsRevealed: ", game.cellsRevealed.size);
                break;
            }
            case "generateBoard": {
                game.rows = message.rows;
                game.columns = message.columns;
                game.mines = message.mines;
                while (game.minePlacements.size < game.mines) { // Randomly generate mines
                    game.minePlacements.add(Math.floor(Math.random() * (game.rows * game.columns)));
                }
                console.log("game.minePlacements: ", game.minePlacements);
                // TODO: Make a function like "sendWSEveryone" instead of for loop
                for (const currentWS of game.wsPlayers) {
                    currentWS.send(JSON.stringify({type: "generatedBoard", rows: game.rows, columns: game.columns, ws}));
                }
                break;
            }
            default:
                ws.send(JSON.stringify({type: "niceTry"}));
        }
    });
    ws.on('close', function () {
        const gameID = WStoGameID.get(ws); 
        if (gameID) {
            const gameIndex = findGameIndex(games, gameID);
            const game = games[gameIndex];
            
            // If not the last player to leave room
            if (game.wsPlayers.length === 1) {
                games.splice(gameIndex, 1); // No race condition
            } else {
                game.wsPlayers.splice(game.wsPlayers.findIndex(e => e === ws) , 1); // Remove player from wsPlayers array
            }
            
            WStoGameID.delete(ws);
            WStoPlayerName.delete(ws);
        }
        if (WStoPlayerName.size === 0) { // This works because clients must enter their name before connecting to the server
            wsIDCounter = 0; // Reset ID counter if no one is connected
        }
        if (games.length === 0) {
            gameIDCounter = 0; // Reset ID counter if there are no games
        }
    });
});