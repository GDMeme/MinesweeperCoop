import { WebSocketServer } from 'ws';
import { createServer } from 'http';

import { MinesweeperGame } from './MinesweeperGame.js';
import { revealCell } from './revealCell.js';
import { findGameIndex } from '../util/commonFunctions.js';

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
let numConnected = 0;

wss.on('connection', function (ws) {
    ws.ID = wsIDCounter++;
    console.log("ws.ID: ", ws.ID);
    numConnected++;
    
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
        // * Remember to check in certain cases if game is undefined (will cause server crash)
        switch (message.type) {
            case "unflag": {
                if (game === undefined) {
                    // nice try
                    break;
                }
                game.flaggedIDs.delete([message.x, message.y].join());
                console.log("size 1: ", game.flaggedIDs.size);
                for (const currentWS of game.wsPlayers) {
                    currentWS.send(JSON.stringify({type: "unflag", id: `cell${message.x}_${message.y}`, numFlags: game.flaggedIDs.size}));
                }
                break;
            }
            case "placeFlag": {
                if (game === undefined) {
                    // nice try
                    break;
                }
                console.log("size 2: ", game.flaggedIDs.size);
                game.flaggedIDs.add([message.x, message.y].join());
                for (const currentWS of game.wsPlayers) {
                    currentWS.send(JSON.stringify({type: "placeFlag", id: `cell${message.x}_${message.y}`, numFlags: game.flaggedIDs.size}))
                }
                break;
            }
            case "newConnection": {
                WStoPlayerName.set(ws, message.playerName);
                break;
            }
            case "createRoom": {
                // * Check if they are in another room
                if (WStoGameID.get(ws) !== undefined) {
                    ws.send(JSON.stringify({type: 'niceTry'}));
                    break;
                }
                const gamesLength = games.push(new MinesweeperGame()); // No race condition
                console.log("gamesLength: ", gamesLength);
                const game = games[gamesLength - 1];
                game.ID = ++gameIDCounter;
                game.name = message.gameName;
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
                if (game === undefined) {
                    console.log("no game detected!");
                    break;
                }
                for (const currentWS of game.wsPlayers) {
                    if (currentWS !== ws) { // If player who moved mouse sent the message, don't send mouseMoved message
                        currentWS.send(JSON.stringify({type: "mouseMoved", scrollY: message.scrollY, scrollX: message.scrollX, x: message.x, y: message.y, wsID: currentWS.ID})); // Send ID of client who moved
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
                revealCell(game, x, y);
                break;
            }
            case "revealChord": {
                const x = parseInt(message.x);
                const y = parseInt(message.y);
                if (game.firstClick) { // No cheating.
                    revealCell(game, x, y);
                    break;
                }
                // Reveal the rest of the chord even if they hit a mine
                for (const coordinate of message.cellsToReveal) {
                    const [currentX, currentY] = coordinate.split(",").map(e => parseInt(e));
                    revealCell(game, currentX, currentY);
                }
                break;
            }
            case "generateBoard": {
                game.rows = message.rows;
                game.columns = message.columns;
                game.mines = message.mines;
                game.largeBoard = message.largeBoard;
                game.minePlacements.clear();
                game.cellsRevealed.clear();
                game.firstClick = true;
                game.lost = false;
                game.flaggedIDs.clear();
                while (game.minePlacements.size < game.mines) { // Randomly generate mines
                    game.minePlacements.add(Math.floor(Math.random() * (game.rows * game.columns)));
                }
                console.log("game.minePlacements: ", game.minePlacements);
                // TODO: Make a function like "sendWSEveryone" instead of for loop
                for (const currentWS of game.wsPlayers) {
                    currentWS.send(JSON.stringify({type: "generatedBoard", rows: game.rows, columns: game.columns, mines: game.mines, largeBoard: game.largeBoard, ws}));
                }
                break;
            }
            default:
                ws.send(JSON.stringify({type: "niceTry"}));
        }
    });
    ws.on('close', function () {
        numConnected--;
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
        if (numConnected === 0) {
            wsIDCounter = 0; // Reset ID counter if no one is connected
        }
        if (games.length === 0) {
            gameIDCounter = 0; // Reset ID counter if there are no games
        }
    });
});