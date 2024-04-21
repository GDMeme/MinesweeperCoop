import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { createServer } from 'https';

const server = createServer({
    cert: readFileSync('cert.pem'),
    key: readFileSync('key.pem'),
    passphrase: 'fdsa'
});

server.listen(8080);

const wss = new WebSocketServer({ server });

wss.on('connection', function (ws) {
    ws.on('error', console.error);

    ws.on('message', function (message) {
        try {
            message = JSON.parse(message);
        } catch (e) {
            ws.send(JSON.stringify({type: "niceTry"}));
        }
        console.log(message);
        if (message.type === "revealCell") {
            console.log("got here");
            if (message.id === 'one') { // TODO: No hardcoding.
                ws.send(JSON.stringify({type: "revealCell", id: "one", tileStatus: 1})); // TODO: make this better lol
            } else if (message.id === 'two') {
                ws.send(JSON.stringify({type: "revealCell", id: "two", tileStatus: "bomb"}));
            } else if (message.id === 'three') {
                ws.send(JSON.stringify({type: "revealCell", id: "three", tileStatus: "bomb"}));
            }
        }
    });
    ws.on('close', function () {
        // do something
    });
});