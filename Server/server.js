import { WebSocketServer } from 'ws';
import { createServer } from 'http';

import { calculateTileStatus } from './calculateTileStatus.js';
import { revealNeighbours } from './revealNeighbours.js'

// render.com provides tls certs
const server = createServer();

server.listen(10000);

const wss = new WebSocketServer({ server });

// * Assume 1 game for now
let minePlacements = new Set();
let rows;
let columns;
let mines; 
let x;
let y;
let tileStatus;
let firstClick = true; // Cannot die on first click
let tempMine;
let cellID;
let cellsRevealed = new Set();

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
                x = parseInt(message.x);
                y = parseInt(message.y);
                cellID = y * columns + x;
                console.log("User revealed a cell, cellID: ", cellID);
                if (minePlacements.has(cellID) && !firstClick) {
                    ws.send(JSON.stringify({type: "revealCell", id: "cell" + x + "_" + y, tileStatus: "bomb"}));
                } else {
                    if (minePlacements.has(cellID) && firstClick) { // First click was a mine
                        minePlacements.delete(cellID);
                        while (minePlacements.size < mines) { // Generate a mine that isn't in the same spot
                            tempMine = Math.floor(Math.random() * (rows * columns));
                            if (tempMine !== cellID) {
                                minePlacements.add(tempMine);
                            }
                        }
                    }
                    tileStatus = calculateTileStatus(minePlacements, x, y, rows, columns);
                    ws.send(JSON.stringify({type: "revealCell", id: "cell" + x + "_" + y, tileStatus}));
                    cellsRevealed.add([x, y].join());
                    if (tileStatus === 0) {
                        revealNeighbours(minePlacements, x, y, rows, columns, cellsRevealed, ws, true); // true as flag for first time
                    }
                    if ((rows * columns) - cellsRevealed.size === minePlacements.size) {
                        console.log("sending win");
                        ws.send(JSON.stringify({type: "win"}));
                    }   
                }
                console.log("size of cellsRevealed: ", cellsRevealed.size);
                firstClick = false;
                break;
            case "generateBoard":
                minePlacements.clear();
                cellsRevealed.clear();
                rows = message.rows;
                columns = message.columns;
                mines = message.mines;
                firstClick = true;
                while (minePlacements.size < mines) {
                    minePlacements.add(Math.floor(Math.random() * (rows * columns)));
                }
                console.log("minePlacements: ", minePlacements)
                ws.send(JSON.stringify({type: "generatedBoard", rows, columns}));
                break;
            default:
                ws.send(JSON.stringify({type: "niceTry"}));
        }
    });
    ws.on('close', function () {
        // TODO: do something
    });
});