import { WebSocketServer } from 'ws';
//import { readFileSync } from 'fs';
import { createServer } from 'http';

import { calculateTileStatus } from './calculateTileStatus.js';

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
let x;
let y;

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
                console.log(y * columns + x);
                if (minePlacements.has(y * columns + x)) {
                    ws.send(JSON.stringify({type: "revealCell", id: "cell" + x + "_" + y, tileStatus: "bomb"}));
                } else {
                    ws.send(JSON.stringify({type: "revealCell", id: "cell" + x + "_" + y, tileStatus: calculateTileStatus(minePlacements, x, y, rows, columns)})); // TODO: make this better lol
                }
                break;
            case "generateBoard":
                minePlacements.clear();
                rows = message.rows;
                columns = message.columns;
                while (minePlacements.size < message.mines) {
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