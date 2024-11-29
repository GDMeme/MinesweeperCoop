// Copy devserver.js changes to server.js

import { readFileSync, writeFileSync } from 'fs';

function syncReadFile(filename) {
    const contents = readFileSync(filename, 'utf-8');

    const arr = contents.split(/\r?\n/);

    return arr;
}

let arr = syncReadFile('../server/devserver.js');

// * Make sure to update this if imports change
const imports  = `import { WebSocketServer } from 'ws';
import { createServer } from 'http';

import { MinesweeperGame } from './MinesweeperGame.js';
import { revealCell } from './revealCell.js';
import { sendWSEveryone } from '../util/commonFunctions.js';
import { WStoPlayerName } from '../util/constants.js';

`;

// This probably won't change
const server = `// render.com provides tls certs
const server = createServer();

server.listen(10000);

`;

arr.splice(0, 17);

writeFileSync("../server/server.js", imports + server + arr.join("\n"));

// In setup.js, change from ./devconnect.js to ./connect.js

arr = syncReadFile('../setup.js');

arr[3] = `import { connect } from './connect.js'; // * MAKE SURE THIS STAYS ON LINE 4 for BeforeCommit.js`;

writeFileSync("../setup.js", arr.join("\n"));
