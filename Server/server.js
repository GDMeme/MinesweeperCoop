import { WebSocketServer } from 'ws';
//import { readFileSync } from 'fs';
import { createServer } from 'http';

import { calculateTileStatus } from './calculateTileStatus.js';
import { revealNeighbours } from './revealNeighbours.js'

const server = createServer({
    //cert: readFileSync('cert.pem'),
    //key: readFileSync('key.pem'),
    //passphrase: 'fdsa'
});

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
                console.log("User revealed a cell");
                cellID = y * columns + x;
                console.log("cellID: ", cellID);
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
                    if (tileStatus === 0) {
                        revealNeighbours(minePlacements, x, y, rows, columns, ws, true); // true as flag for first time
                    }
                    
                }
                firstClick = false;
                break;
            case "generateBoard":
                minePlacements.clear();
                rows = message.rows;
                columns = message.columns;
                mines = message.mines;
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