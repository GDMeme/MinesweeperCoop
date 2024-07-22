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

// * Probability testing
document.getElementById("testbutton").addEventListener('click', async function() {
    const data = HTMLtoString(document.getElementById("game").children);
    if (!window.probabilityStartup) {
        await startup(window.rows, window.columns, window.mines);
        window.probabilityStartup = true;
    }
    
    // const ACTION_CLEAR = 1;
    // const ACTION_FLAG = 2;
    // const ACTION_CHORD = 3;

    // document.getElementById("cell0_0").innerHTML = 21;
    // document.getElementById("cell0_0").style.color = "#7f888f";
    await dropHandler(data);
    const bestMove = (await doAnalysis())[0];
    if (bestMove.action === 1) {
        document.getElementById(`cell${bestMove.x}_${bestMove.y}`).style.color = "#00FF00";
    } else if (bestMove.action === 2) {
        document.getElementById(`cell${bestMove.x}_${bestMove.y}`).style.color = "#FF0000";
        // Maybe want to show the flag(s) and then the chord
    } else if (bestMove.action === 3) {
        // Immediately chord
        // Need some way to highlight to click here
    }
    
    
    
});

// Setup
initialSetup();