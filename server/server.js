import { WebSocketServer } from 'ws';
import { createServer } from 'http';

import { MinesweeperGame } from './MinesweeperGame.js';
import { revealCell } from './revealCell.js';
import { sendWSEveryone } from '../util/commonFunctions.js';

// render.com provides tls certs
const server = createServer();

server.listen(10000);

const wss = new WebSocketServer({ server });

// * Don't need to store all the games in one array, just use gameIDtoGame.values()
const gameIDtoGame = new Map(); // Maps game ID to game object
const WStoGameID = new Map(); // Maps client websocket to a specific game ID
const WStoPlayerName = new Map(); // Maps client websocket to player name

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
        
        const gameID = WStoGameID.get(ws);
        const game = gameID ? gameIDtoGame.get(gameID) : undefined;
        
        // * Remember to check in certain cases if game is undefined (will cause server crash)
        switch (message.type) {
            case "unflag": {
                if (game === undefined) {
                    // nice try
                    break;
                }
                game.flaggedIDs.delete([message.x, message.y].join()); // TODO: Maybe less efficient than just concatenating the strings using backtick
                console.log("size 1: ", game.flaggedIDs.size);
                sendWSEveryone(game.wsPlayers, {type: "unflag", id: `cell${message.x}_${message.y}`, numFlags: game.flaggedIDs.size});
                break;
            }
            case "placeFlag": {
                if (game === undefined) {
                    // nice try
                    break;
                }
                game.flaggedIDs.add([message.x, message.y].join());
                sendWSEveryone(game.wsPlayers, {type: "placeFlag", id: `cell${message.x}_${message.y}`, numFlags: game.flaggedIDs.size});
                break;
            }
            case "newConnection": {
                WStoPlayerName.set(ws, message.playerName);
                break;
            }
            case "createRoom": {
                // * Check if they are in another room
                if (game !== undefined) {
                    ws.send(JSON.stringify({type: 'niceTry'}));
                    break;
                }
                const newGame = new MinesweeperGame();
                const gameID = ++gameIDCounter;
                WStoGameID.set(ws, gameID);
                gameIDtoGame.set(gameID, newGame);
                newGame.ID = WStoGameID.get(ws); // * Do I still need this property?
                newGame.name = message.gameName; // TODO: Default to "${playerName}'s room" if gameName is empty
                console.log("game.ID: ", newGame.ID);
                newGame.wsPlayers.push(ws);
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
                game = gameIDtoGame.get(message.gameID);
                for (const currentWS of game.wsPlayers) {
                    // Send message to new player as well
                    currentWS.send(JSON.stringify({type: 'addPlayer', name: WStoPlayerName.get(ws)})); 
                    ws.send(JSON.stringify({type: 'addPlayer', name: WStoPlayerName.get(currentWS)}));
                }
                game.wsPlayers.push(ws); // Add the new player to the game
                break;
            }
            case "requestGames": { // This is fine because Sets are not JSON-able objects
                console.log("games: ", Array.from(gameIDtoGame.values()));
                ws.send(JSON.stringify({type: "sendGames", games: Array.from(gameIDtoGame.values())}));
            }
            case "mouseMove": {
                if (game === undefined) {
                    console.log("no game detected!");
                    break;
                }
                // If player who moved mouse sent the message, don't send mouseMoved message
                // Send ID of client who moved
                sendWSEveryone(game.wsPlayers.filter(e => e !== ws), {type: "mouseMoved", name: WStoPlayerName.get(ws), scrollY: message.scrollY, scrollX: message.scrollX, x: message.x, y: message.y, wsID: ws.ID});
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
                delete message.type; // Remove the "type" property before copying the properties to game object
                Object.assign(game, message); // TODO: Maybe add validation so the client can't add random properties to game object
                console.log("game is now: ", game);
                // game.rows = message.rows;
                // game.columns = message.columns;
                // game.mines = message.mines;
                // game.largeBoard = message.largeBoard;
                game.minePlacements.clear();
                game.cellsRevealed.clear();
                game.firstClick = true;
                game.lost = false;
                game.flaggedIDs.clear();
                while (game.minePlacements.size < game.mines) { // Randomly generate mines
                    game.minePlacements.add(Math.floor(Math.random() * (game.rows * game.columns)));
                }
                console.log("game.minePlacements: ", game.minePlacements);
                sendWSEveryone(game.wsPlayers, {type: "generatedBoard", rows: game.rows, columns: game.columns, mines: game.mines, largeBoard: game.largeBoard, ws});
                break;
            }
            default:
                ws.send(JSON.stringify({type: "niceTry"}));
        }
    });
    ws.on('close', function () {
        numConnected--;
        const gameID = WStoGameID.get(ws); 
        const game = gameID ? gameIDtoGame.get(gameID) : undefined;
        if (game) {
            // If the client is the last player to leave room
            if (game.wsPlayers.length === 1) {
                gameIDtoGame.delete(gameID);
            } else {
                // TODO: This is a linear search, could use a map instead but lots of thinking
                game.wsPlayers.splice(game.wsPlayers.findIndex(e => e === ws) , 1); // Remove player from wsPlayers array
            }
            
            WStoGameID.delete(ws);
            WStoPlayerName.delete(ws);
        }
        if (numConnected === 0) {
            wsIDCounter = 0; // Reset ws ID counter if no one is connected
        }
        if (gameIDtoGame.size === 0) {
            gameIDCounter = 0; // Reset game ID counter if there are no games
        }
    });
});