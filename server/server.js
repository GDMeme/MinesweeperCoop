import { WebSocketServer } from 'ws';
import { createServer } from 'http';

import { revealCell } from './revealCell.js';
import { checkWin, generateRandomMines, createBattleBoard, sendToGroup, generateRoomID } from '../util/commonFunctions.js';
import { WStoPlayerName, roomTypes } from '../util/constants.js';
import { CoopRoom } from './room/CoopRoom.js';
import { BattleRoom } from './room/BattleRoom.js';
import { MinesweeperBoard } from './MinesweeperGame.js';

// render.com provides tls certs
const server = createServer();

server.listen(10000);

const wss = new WebSocketServer({ server });

// Don't actually need to store every single room in an object
const WStoRoomID = new Map(); // Maps client websocket to a specific room ID
const roomIDtoRoom = new Map(); // For players joining

// NOTES
// wsIdCounter replaced with string "ws-" + Date.now()
// Anytime someone leaves/joins, should reset all "ready" players
// also need to reset wsToPlayersIndex

wss.on('connection', function (ws) {
    ws.ID = "ws-" + Date.now();
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
        
        const roomID = WStoRoomID.get(ws);
        const room = roomIDtoRoom.get(roomID);
        
        // * Remember to check in certain cases if room is undefined (will cause server crash)
        switch (message.type) {
            case "generateBattleBoard": {
                if (!room) {
                    console.log("room not found");
                    break;
                }
                const board = room.findBoardFromWS.get(ws);
                
                if (!board) {
                    console.log("no board found");
                    break;
                }
                
                const { rows, columns, mines } = board;
                
                room.sendMessage({type: "generateBattleBoard", rows, columns, mines});
                break;
            }
            case "joinTeam": {
                if (!room) {
                    console.log("room not found");
                    break;
                }
                
                // temporary safeguard
                if (!(room instanceof BattleRoom)) {
                    console.log("not battleroom");
                    break;
                }
                
                // message.team is 1 indexed
                const newTeamIndex = parseInt(message.team) - 1;
                
                // Check if already in a team
                if (room.wsToTeamInfo.get(ws)) {
                    room.removePlayer(ws);
                }
                
                // Ensure the new team exists
                if (!room.teams[newTeamIndex]) {
                    room.teams[newTeamIndex] = [];
                }

                // Add to new team
                const playerIndex = room.teams[newTeamIndex].length;
                room.teams[newTeamIndex].push(ws);

                // Update the team info map
                room.wsToTeamInfo.set(ws, { teamIndex: newTeamIndex, playerIndex });

                // Optional: Notify all players of team change
                room.sendMessage({
                    type: "teamUpdate",
                    teams: room.teams.map(team => team.map(ws => WStoPlayerName.get(ws)))
                }, ws);
                console.log("readable teams is now: ", room.teams.map(team => team.map(ws => WStoPlayerName.get(ws))));
                
                break;
            }
            case "updateGamemode": {
                // Only the host should be able to change gamemode
                if (room.wsPlayers[0] !== ws) {
                    console.log("non-host tried to change the gamemode");
                    break;
                }
                const RoomClass = roomTypes[message.gamemode];
                if (RoomClass) {
                    const newRoom = new RoomClass(room.ID, room.wsPlayers, room.roomName);
                    
                    // Overwrite previous key
                    roomIDtoRoom.set(roomID, newRoom);
                    
                    // Send to everyone except person who updated gamemode
                    sendToGroup({type: "updateGamemode", roomType: message.gamemode}, room.wsPlayers.filter(currentWS => currentWS !== ws));                    
                } else {
                    console.log("Unknown gamemode:", message.gamemode);
                }
                break;
            }
            case "startGame": { // For battle mode
                if (!room) {
                    console.log("no room found");
                    break;
                }
                if (!(room instanceof BattleRoom)) {
                    console.log("not a battle room");
                    break;
                }
                
                if (ws !== room.wsPlayers[0]) {
                    console.log("non-host tried to start the game");
                    break;
                }
                
                // Check if everyone is ready
                if (room.ready.filter(e => e === true).length !== room.wsPlayers.length) {
                    console.log("not everyone is ready: ", room.ready);
                    room.wsPlayers[0].send(JSON.stringify({type: "enableStartGameButton"}));
                    break;
                }
                
                // Check if there are at least 2 teams and at least 1 person on each team
                
                const nonEmptyTeams = room.teams.filter(team => team.length > 0);

                if (nonEmptyTeams.length < 2) {
                    console.log("Less than two teams with players");
                    
                    // Re-enable the start game button for the host
                    room.wsPlayers[0].send(JSON.stringify({type: "enableStartGameButton"}));
                    break;
                }
                
                // Start the game
                
                room.ready = [];
                room.inProgress = true;
                const startTime = new Date().getTime() + 5000;
                room.startTime = startTime;
                
                // Randomly generate dimensions and mines within reason
                // 10 - 30
                const rows = Math.floor(Math.random() * 21) + 10;
                const columns = Math.floor(Math.random() * 21) + 10;
                
                const scaledDensity = 0.25 - (rows * columns / 10000);
                
                // Small randomized range, but keep global min and max density
                const minDensity = Math.max(0.15, scaledDensity - 0.02);
                const maxDensity = Math.min(0.25, scaledDensity + 0.02);
                
                // Random number between minDensity and maxDensity
                const density = Math.random() * (maxDensity - minDensity) + minDensity;
                
                const mines = Math.floor(rows * columns * density);
                
                for (let i = 0; i < room.teams.length; i++) {
                    room.boards[i] = createBattleBoard(rows, columns, mines);
                    
                    // Remove wsPlayers property before sending to client
                    const { wsPlayers, ...safeGameData } = room.boards[i];
                    room.sendMessage({type: "startGame", safeGameData, startTime}, room.teams[i][0]);
                }
                break;
            }
            case "ready": { // For battle mode
                if (!room) {
                    console.log("no room found");
                    break;
                }
                if (!(room instanceof BattleRoom)) {
                    console.log("not a battle room");
                    break;
                }
                
                room.ready[room.wsToPlayersIndex.get(ws)] = true;
                console.log("room.ready: ", room.ready);
                
                const nonEmptyTeams = room.teams.filter(team => team.length > 0);

                if (nonEmptyTeams.length < 2) {
                    console.log("Less than two teams with players");
                    break;
                }
                
                // Check if everyone is ready
                if (room.ready.filter(e => e === true).length !== room.wsPlayers.length) {
                    console.log("not everyone is ready");
                    break;
                }
                
                // Enable the start game button for the host
                room.wsPlayers[0].send(JSON.stringify({type: "enableStartGameButton"}));
                    
                break;
            }
            case "unflag": {
                if (room === undefined) {
                    // nice try
                    break;
                }
                
                const board = room.findBoardFromWS(ws);
                
                const flagID = parseInt(message.y) * board.columns + parseInt(message.x);
                board.flaggedIDs.delete(flagID);
                room.sendMessage({type: "unflag", id: `cell${message.x}_${message.y}`, numFlags: board.flaggedIDs.size}, ws);
                break;
            }
            case "placeFlag": {
                if (!room) {
                    // nice try
                    break;
                }
                
                const board = room.findBoardFromWS(ws);
                
                const flagID = parseInt(message.y) * board.columns + parseInt(message.x);
                board.flaggedIDs.add(flagID);
                room.sendMessage({type: "placeFlag", id: `cell${message.x}_${message.y}`, numFlags: board.flaggedIDs.size}, ws);
                break;
            }
            case "newConnection": {
                WStoPlayerName.set(ws, message.playerName);
                break;
            }
            case "createRoom": {
                // * Check if they are in another room
                if (room) {
                    console.log("already in a room");
                    ws.send(JSON.stringify({type: 'niceTry'}));
                    break;
                }
                
                // Default to CoopRoom on initial creation
                const roomID = generateRoomID();
                
                let roomName;
                const playerName = WStoPlayerName.get(ws);
                if (playerName[playerName.length - 1] === "s") {
                    roomName = `${playerName}' Room`;
                } else {
                    roomName = `${playerName}'s Room`;
                }
                
                const newRoom = new CoopRoom(roomID, [ws], message.roomName || roomName);
                roomIDtoRoom.set(roomID, newRoom);
                WStoRoomID.set(ws, roomID);
                break;
            }
            case "joinedRoom": {
                // Check if they are already in a room
                if (room) {
                    console.log("Client was already in a room and tried to join another room");
                    ws.send(JSON.stringify({type: 'niceTry'}));
                    break;
                }
                
                const currentRoom = roomIDtoRoom.get(message.roomID);
                
                // todo don't show games with this condition to UI when trying to join a game
                // if they still clicked this room, send a message back saying to join a different room
                // maybe send games again
                if (currentRoom instanceof BattleRoom && currentRoom.inProgress) {
                    console.log("game already started! try again later");
                    break;
                }
                
                if (!currentRoom) {
                    console.log("unknown roomID: ", roomID);
                    break;
                }
                
                WStoRoomID.set(ws, message.roomID);
                const newPlayerName = WStoPlayerName.get(ws);
                for (const currentWS of currentRoom.wsPlayers) {
                    // Add existing players to new player
                    currentWS.send(JSON.stringify({type: 'addPlayer', name: newPlayerName})); 
                    
                    // Add new player to existing players
                    ws.send(JSON.stringify({type: 'addPlayer', name: WStoPlayerName.get(currentWS)}));
                }
                
                // Joining a game in proress
                if (currentRoom instanceof CoopRoom && currentRoom.inProgress) {
                    const currentGame = currentRoom.board;
                    if (currentGame.cellsRevealed.size > 0 && !checkWin(currentGame)) {
                        // Need to remove wsPlayers property before sending to client
                        const { wsPlayers: _, ...safeGameData } = currentGame;
                        safeGameData.cellsRevealed = Array.from(safeGameData.cellsRevealed);
                        safeGameData.flaggedIDs = Array.from(safeGameData.flaggedIDs);
                        ws.send(JSON.stringify({type: "gameProgress", safeGameData}))
                    }
                } else if (currentRoom instanceof BattleRoom) {
                    // Reset the ready state of all players
                    currentRoom.ready = new Array(currentRoom.wsPlayers.length);
                    
                    currentRoom.sendMessage({type: "unReady"}, ws);
                }
                
                // Add the new player to the game
                currentRoom.wsPlayers.push(ws);
                currentRoom.wsToPlayersIndex.set(ws, currentRoom.wsPlayers.length - 1);
                break;
            }
            case "requestGames": {
                // This is fine because Sets are not JSON-able objects
                console.log("rooms: ", Array.from(roomIDtoRoom.values()));
                ws.send(JSON.stringify({type: "sendGames", rooms: Array.from(roomIDtoRoom.values())}));
            }
            case "mouseMove": {
                if (!room) {
                    console.log("no room detected!");
                    break;
                }
                // If player who moved mouse sent the message, don't send mouseMoved message
                // Send ID of client who moved
                let group;
                if (room instanceof BattleRoom) {
                    group = room?.teams[room.wsToTeamInfo.get(ws)?.teamIndex]?.filter(e => e !== ws);
                } else if (room instanceof CoopRoom) {
                    group = room.wsPlayers.filter(e => e !== ws);
                }
                
                if (group) {
                    sendToGroup({type: "mouseMoved", name: WStoPlayerName.get(ws), scrollY: message.scrollY, scrollX: message.scrollX, x: message.x, y: message.y, wsID: ws.ID}, group);
                }
                break;
            }
            case "revealCell": {
                if (!room) {
                    console.log("no room detected!");
                    // nice try
                    break;
                }
                
                // Check if client is allowed to click
                if (!room.allowClicks()) {
                    console.log("not allowed to click");
                    // nice try
                    break;
                }
                
                const x = parseInt(message.x);
                const y = parseInt(message.y);
                
                revealCell(room, x, y, ws);
                break;
            }
            case "revealChord": {
                if (!room) {
                    console.log("no room detected!");
                    // nice try
                    break;
                }
                if (!room.allowClicks()) {
                    console.log("not allowed to click");
                    ws.send(JSON.stringify({type: "niceTry"}));
                    break;
                }
                const x = parseInt(message.x);
                const y = parseInt(message.y);
                
                const board = room.findBoardFromWS(ws);
                
                if (board.firstClick) { // Cannot chord on first click, just reveal one cell
                    revealCell(board, x, y, ws);
                    break;
                }
                // Reveal all chorded cells even if they hit a mine
                for (const coordinate of message.cellsToReveal) {
                    const [currentX, currentY] = coordinate.split(",").map(e => parseInt(e));
                    revealCell(room, currentX, currentY, ws);
                }
                break;
            }
            case "generateBoard": {
                if (!room) {
                    console.log("no room detected!");
                    // nice try
                    break;
                }
                
                // TODO if battle room, board already exists, just modify it
                // todo if coop room, make a new board. make a class function for this
                
                delete message.type; // Remove the "type" property before copying the properties to game object
                
                // todo fix Default constructor
                const board = room.findBoardFromWS(ws) ?? new MinesweeperBoard(0, 0, 0, false);
                
                // * Adds rows, columns, mines, largeBoard, battleMode
                Object.assign(board, message); // TODO: Add validation to message so the client can't add random properties to game object
                
                board.minePlacements = generateRandomMines(board.rows, board.columns, board.mines);
       
                board.cellsRevealed.clear();
                board.firstClick = true;
                board.flaggedIDs.clear();
                
                room.inProgress = true;
                room.board = board;
                
                // Need to remove wsPlayers property before sending to client
                const { wsPlayers, ...safeGameData } = board;
                
                room.sendMessage({type: "generatedBoard", safeGameData: safeGameData, boardOwnerName: WStoPlayerName.get(ws)}, ws);
                
                break;
            }
            default:
                ws.send(JSON.stringify({type: "niceTry", message}));
        }
    });
    ws.on('close', function () {
        const roomID = WStoRoomID.get(ws);
        const room = roomIDtoRoom.get(roomID);
        if (room) { // Check if the client was in a room
            // If the client was the last player to leave room
            if (room.wsPlayers.length === 1) {
                roomIDtoRoom.delete(roomID);
            } else {
                for (let i = 0; i < room.wsPlayers.length; i++) {
                    // Remove mouse image from everyone else's screen
                    if (room.wsPlayers[i] !== ws) {
                        room.wsPlayers[i].send(JSON.stringify({type: "removePlayer", wsID: ws.ID, playerName: WStoPlayerName.get(ws)}));
                    }
                }
                const indexToRemove = room.wsToPlayersIndex.get(ws);
                room.wsPlayers.splice(indexToRemove, 1); 
                room.wsToPlayersIndex.clear();
                
                // Rebuild wsToPlayersIndex
                room.wsPlayers.forEach((ws, index) => {
                    room.wsToPlayersIndex.set(ws, index);
                });
                
                // Remove them from a team if they were in one
                room.removePlayer(ws);
            }
            WStoRoomID.delete(ws);
            WStoPlayerName.delete(ws);
        }
    });
});