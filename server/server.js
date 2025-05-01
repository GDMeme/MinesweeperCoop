import { WebSocketServer } from 'ws';
import { createServer } from 'http';

import { MinesweeperGame } from './MinesweeperGame.js';
import { revealCell } from './revealCell.js';
import { sendWSEveryone, checkWin } from '../util/commonFunctions.js';
import { WStoPlayerName } from '../util/constants.js';

// render.com provides tls certs
const server = createServer();

server.listen(10000);

const wss = new WebSocketServer({ server });

// * Don't need to store all the games in one array, just use gameIDtoGame.values()
const gameIDToGame = new Map(); // Maps game ID to game object
const WStoGameID = new Map(); // Maps client websocket to a specific game ID

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
        
        const gameID = WStoGameID.get(ws);
        const game = gameID ? gameIDToGame.get(gameID) : undefined;
        
        // * Remember to check in certain cases if game is undefined (will cause server crash)
        switch (message.type) {
            case "startGame": { // For battle mode
                if (!game) {
                    // nice try
                    break;
                }
                if (game.playersReady.every(e => e === true)) {
                    // Start 5 seconds after the server message
                    game.startTime = new Date().getTime() + 5000;
                    sendWSEveryone(game.wsPlayers, {type: "startGame", startTime: game.startTime});
                    game.playersReady = [];
                }
                break;
            }
            case "ready": { // For battle mode
                if (!game) {
                    // nice try
                    break;
                }
                game.playersReady[game.wsPlayers.findIndex(e => e === ws)] = true;
                console.log("playersReady: ", playersReady);
                if (game.playersReady.every(e => e === true)) {
                    // Enable "Start Game" button for host
                    game.wsPlayers[0].send(JSON.stringify({type: "enableStartGameButton"}));
                }
                break;
            }
            case "unflag": {
                if (game === undefined) {
                    // nice try
                    break;
                }
                const flagID = parseInt(message.y) * game.columns + parseInt(message.x);
                game.flaggedIDs.delete(flagID);
                sendWSEveryone(game.wsPlayers, {type: "unflag", id: `cell${message.x}_${message.y}`, numFlags: game.flaggedIDs.size});
                break;
            }
            case "placeFlag": {
                if (!game) {
                    // nice try
                    break;
                }
                const flagID = parseInt(message.y) * game.columns + parseInt(message.x);
                game.flaggedIDs.add(flagID);
                sendWSEveryone(game.wsPlayers, {type: "placeFlag", id: `cell${message.x}_${message.y}`, numFlags: game.flaggedIDs.size});
                break;
            }
            case "newConnection": {
                WStoPlayerName.set(ws, message.playerName);
                break;
            }
            case "createRoom": {
                // * Check if they are in another room
                if (game) {
                    ws.send(JSON.stringify({type: 'niceTry'}));
                    break;
                }
                const newGame = new MinesweeperGame();
                const gameID = ++gameIDCounter;
                WStoGameID.set(ws, gameID);
                gameIDToGame.set(gameID, newGame);
                newGame.ID = WStoGameID.get(ws);
                newGame.name = message.gameName; // TODO: Default to "${playerName}'s room" if gameName is empty
                console.log("game.ID: ", newGame.ID);
                newGame.wsPlayers.push(ws);
                break;
            }
            case "joinedRoom": {
                // Check if they are already in a room
                if (game) {
                    console.log("Client was already in a room and tried to join another room");
                    ws.send(JSON.stringify({type: 'niceTry'}));
                    break;
                }
                WStoGameID.set(ws, message.gameID);
                console.log("message.gameID: ", message.gameID);
                const currentGame = gameIDToGame.get(message.gameID);
                for (const currentWS of currentGame.wsPlayers) {
                    // Send message to new player as well
                    currentWS.send(JSON.stringify({type: 'addPlayer', name: WStoPlayerName.get(ws)})); 
                    ws.send(JSON.stringify({type: 'addPlayer', name: WStoPlayerName.get(currentWS), game}));
                }
                // * Joining a game in proress
                if (currentGame.cellsRevealed.size > 0 && !checkWin(currentGame)) {
                    // Need to remove wsPlayers property before sending to client
                    const { wsPlayers: _, ...safeGameData } = currentGame;
                    safeGameData.cellsRevealed = Array.from(safeGameData.cellsRevealed);
                    safeGameData.flaggedIDs = Array.from(safeGameData.flaggedIDs);
                    ws.send(JSON.stringify({type: "gameProgress", safeGameData}))
                }
                currentGame.wsPlayers.push(ws); // Add the new player to the game
                break;
            }
            case "requestGames": {
                // This is fine because Sets are not JSON-able objects
                console.log("games: ", Array.from(gameIDToGame.values()));
                ws.send(JSON.stringify({type: "sendGames", games: Array.from(gameIDToGame.values())}));
            }
            case "mouseMove": {
                if (!game) {
                    console.log("no game detected!");
                    break;
                }
                // If player who moved mouse sent the message, don't send mouseMoved message
                // Send ID of client who moved
                sendWSEveryone(game.wsPlayers.filter(e => e !== ws), {type: "mouseMoved", name: WStoPlayerName.get(ws), scrollY: message.scrollY, scrollX: message.scrollX, x: message.x, y: message.y, wsID: ws.ID});
                break;
            }
            case "revealCell": {
                if (!game) {
                    // nice try
                    break;
                }
                
                // Check if client is allowed to click
                if (!game.inProgress && !game.firstClick) {
                    // nice try
                    break;
                }
                
                // To account for battle mode
                if (new Date().getTime() < game.startTime) {
                    ws.send(JSON.stringify({type: "niceTry"}));
                    break;
                }
                const x = parseInt(message.x);
                const y = parseInt(message.y);
                revealCell(game.battleMode ? game.games[game.wsToGamesIndex.get(ws)] : game, x, y, ws);
                break;
            }
            case "revealChord": {
                if (!game) {
                    // nice try
                    break;
                }
                if (!game.inProgress || new Date().getTime() < game.startTime) {
                    ws.send(JSON.stringify({type: "niceTry"}));
                    break;
                }
                const x = parseInt(message.x);
                const y = parseInt(message.y);
                if (game.firstClick) { // Cannot chord on first click, just reveal one cell
                    revealCell(game.battleMode ? game.games[game.wsToGamesIndex.get(ws)] : game, x, y, ws);
                    break;
                }
                // Reveal the rest of the chord even if they hit a mine
                for (const coordinate of message.cellsToReveal) {
                    const [currentX, currentY] = coordinate.split(",").map(e => parseInt(e));
                    revealCell(game.battleMode ? game.games[game.wsToGamesIndex.get(ws)] : game, currentX, currentY, ws);
                }
                break;
            }
            case "generateBoard": {
                if (!game) {
                    // nice try
                    break;
                }
                
                delete message.type; // Remove the "type" property before copying the properties to game object
                
                // * Adds rows, columns, mines, largeBoard, battleMode
                Object.assign(game, message); // TODO: Add validation to message so the client can't add random properties to game object
                
                game.minePlacements.clear();
                
                // Randomly generate mines
                // Generates an array containing [0, 1, ... , game.rows * game.columns - 1]
                const possibleMinePlacements = Array.from(new Array(game.rows * game.columns).keys());
                for (let i = 0; i < game.mines; i++) {
                    const randomIndex = Math.floor(Math.random() * (game.rows * game.columns - i))
                    game.minePlacements.add(possibleMinePlacements[randomIndex]);
                    possibleMinePlacements.splice(randomIndex, 1);
                }
                
                if (game.battleMode) {
                    game.games = new Array(game.wsPlayers.length);
                    for (let i = 0; i < game.wsPlayers.length; i++) {
                        game.games[i] = new MinesweeperGame();
                        game.wsToGamesIndex.set(game.wsPlayers[i], i);
                        
                        // * Adds rows, columns, mines, largeBoard, battleMode
                        Object.assign(game.games[i], message);
                        console.log("game is now: ", game);
                        game.games[i].cellsRevealed.clear();
                        game.games[i].firstClick = true;
                        game.games[i].inProgress = false;
                        game.games[i].flaggedIDs.clear();
                        game.games[i].minePlacements = game.minePlacements;
                        
                        // Pass by reference, any changes will affect both
                        game.games[i].wsPlayers = game.wsPlayers;
                        
                        // Need to remove wsPlayers property before sending to client
                        const { wsPlayers: _, ...modifiedGame } = game;
                        
                        // * Make sure to account for battleMode (show ready button)
                        game.wsPlayers[i].send(JSON.stringify({type: "generatedBoard", modifiedGame, boardOwnerName: WStoPlayerName.get(ws)}));
                    }
                } else {       
                    game.cellsRevealed.clear();
                    game.firstClick = true;
                    game.inProgress = false;
                    game.flaggedIDs.clear();
                    
                    // Need to remove wsPlayers property before sending to client
                    const { wsPlayers, ...safeGameData } = game;
                    
                    sendWSEveryone(game.wsPlayers, {type: "generatedBoard", safeGameData: safeGameData, boardOwnerName: WStoPlayerName.get(ws)});
                }
                
                break;
            }
            default:
                ws.send(JSON.stringify({type: "niceTry", message}));
        }
    });
    ws.on('close', function () {
        numConnected--;
        const gameID = WStoGameID.get(ws); 
        const game = gameID ? gameIDToGame.get(gameID) : undefined;
        if (game) { // Check if the client was in a game
            // If the client was the last player to leave room
            if (game.wsPlayers.length === 1) {
                gameIDToGame.delete(gameID);
            } else {
                const indexToRemove = game.wsPlayers.findIndex(e => e === ws);
                for (let i = 0; i < game.wsPlayers.length; i++) {
                    // Remove mouse image from everyone else's screen
                    if (game.wsPlayers[i] !== ws) {
                        game.wsPlayers[i].send(JSON.stringify({type: "removePlayer", wsID: ws.ID, playerName: WStoPlayerName.get(ws)}));
                    }
                }
                game.wsPlayers.splice(indexToRemove, 1); 
                game.playersReady.splice(indexToRemove, 1);
                
                // If in battle mode, check if everyone else is ready
                if (game.playersReady.every(e => e === true)) {
                    // Enable "Start Game" button for host
                    game.wsPlayers[0].send(JSON.stringify({type: "enableStartGameButton"}));
                }     
            }
            WStoGameID.delete(ws);
            WStoPlayerName.delete(ws);
        }
        if (numConnected === 0) {
            wsIDCounter = 0; // Reset ws ID counter if no one is connected
        }
        if (gameIDToGame.size === 0) {
            gameIDCounter = 0; // Reset game ID counter if there are no games
        }
    });
});