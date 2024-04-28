import { WebSocketServer } from 'ws';
import { createServer } from 'http';

import { calculateTileStatus } from './calculateTileStatus.js';
import { revealNeighbours } from './revealNeighbours.js'

// render.com provides tls certs
const server = createServer();

server.listen(10000);

const wss = new WebSocketServer({ server });

// * Assume 1 game for now
class MinesweeperGame {
    constructor() {
        this.minePlacements = new Set();
        this.rows;
        this.columns;
        this.mines; 
        this.x;
        this.y;
        this.tileStatus;
        this.firstClick = true; // Cannot die on first click
        this.tempMine;
        this.cellID;
        this.cellsRevealed = new Set();
    }
}

let newGame = new MinesweeperGame(); 

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
            case "revealCell":
                newGame.x = parseInt(message.x);
                newGame.y = parseInt(message.y);
                newGame.cellID = newGame.y * newGame.columns + newGame.x;
                console.log("User revealed a cell, newGame.cellID: ", newGame.cellID);
                if (newGame.minePlacements.has(newGame.cellID) && !newGame.firstClick) {
                    ws.send(JSON.stringify({type: "revealCell", id: "cell" + newGame.x + "_" + newGame.y, tileStatus: "bomb"}));
                } else {
                    if (newGame.minePlacements.has(newGame.cellID) && newGame.firstClick) { // First click was a mine
                        newGame.minePlacements.delete(newGame.cellID);
                        while (newGame.minePlacements.size < newGame.mines) { // Generate a mine in a different place
                            newGame.tempMine = Math.floor(Math.random() * (newGame.rows * newGame.columns));
                            if (newGame.tempMine !== newGame.cellID) {
                                newGame.minePlacements.add(newGame.tempMine);
                            }
                        }
                    }
                    newGame.tileStatus = calculateTileStatus(newGame.minePlacements, newGame.x, newGame.y, newGame.rows, newGame.columns);
                    ws.send(JSON.stringify({type: "revealCell", id: "cell" + newGame.x + "_" + newGame.y, tileStatus: newGame.tileStatus}));
                    newGame.cellsRevealed.add([newGame.x, newGame.y].join());
                    if (newGame.tileStatus === 0) {
                        revealNeighbours(newGame.minePlacements, newGame.x, newGame.y, newGame.rows, newGame.columns, newGame.cellsRevealed, ws, true); // true as flag for first tile
                    }
                    if ((newGame.rows * newGame.columns) - newGame.cellsRevealed.size === newGame.minePlacements.size) {
                        console.log("sending win");
                        ws.send(JSON.stringify({type: "win"}));
                    }   
                }
                console.log("size of newGame.cellsRevealed: ", newGame.cellsRevealed.size);
                newGame.firstClick = false;
                break;
            case "generateBoard":
                newGame.minePlacements.clear();
                newGame.cellsRevealed.clear();
                newGame.rows = message.rows;
                newGame.columns = message.columns;
                newGame.mines = message.mines;
                newGame.firstClick = true;
                while (newGame.minePlacements.size < newGame.mines) {
                    newGame.minePlacements.add(Math.floor(Math.random() * (newGame.rows * newGame.columns)));
                }
                console.log("newGame.minePlacements: ", newGame.minePlacements)
                ws.send(JSON.stringify({type: "generatedBoard", rows: newGame.rows, columns: newGame.columns}));
                break;
            default:
                ws.send(JSON.stringify({type: "niceTry"}));
        }
    });
    ws.on('close', function () {
        // TODO: do something.
    });
});