import { readFileSync, writeFileSync } from 'fs';

function syncReadFile(filename) {
    const contents = readFileSync(filename, 'utf-8');

    const arr = contents.split(/\r?\n/);

    return arr;
}

// Annoying LF and CRLF stuff
function normalizeToCRLF(text) {
    return text.replace(/\r?\n/g, '\r\n');
}

let arr = syncReadFile('../server/server.js');

const imports = `import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { createServer } from 'https';

import { MinesweeperGame } from './MinesweeperGame.js';
import { revealCell } from './revealCell.js';
import { sendWSEveryone, checkWin } from '../util/commonFunctions.js';
import { WStoPlayerName } from '../util/constants.js';

`;

// This probably won't change 
const server = `const server = createServer({
    cert: readFileSync('cert.pem'),
    key: readFileSync('key.pem'),
    passphrase: 'fdsa'
});

server.listen(8080);

`;

// Delete the first 13 lines from server.js, will be replaced by "imports" and "server"
arr.splice(0, 13);

const serverJsContent = normalizeToCRLF(imports + server + arr.join("\n"));
writeFileSync("../server/devserver.js", serverJsContent);

// In setup.js, change from ./connect.js to ./devconnect.js
arr = syncReadFile('../setup.js');

arr[3] = `import { connect } from './devconnect.js'; // * MAKE SURE THIS STAYS ON LINE 4`;

const setupJsContent = normalizeToCRLF(arr.join("\n"));
writeFileSync("../setup.js", setupJsContent);