import { initialSetup } from './setup.js';

import { HTMLtoString } from './util/commonFunctions.js';
import { doAnalysis, dropHandler, startup } from './solver/client/main.js';

// Globals (Nothing will go wrong)
window.leftPressed = false;
window.ws = null;
window.lost = false;
window.won = false;
window.rows = -1; // Temporary default value
window.columns = -1;
window.mines = -1;
window.playerName = null;
window.gameName = null;
window.playerList = [];
window.largeBoard = false;
window.firstClick = true;
window.probabilityStartup = false;

document.getElementById("testbutton").addEventListener('click', async function() {
    const data = HTMLtoString(document.getElementById("game").children);
    if (!window.probabilityStartup) {
        await startup(window.rows, window.columns, window.mines);
    }
    // document.getElementById("cell0_0").innerHTML = 21;
    // document.getElementById("cell0_0").style.color = "#7f888f";
    await dropHandler(data);
    await doAnalysis();
    
    
});

// Setup
initialSetup();