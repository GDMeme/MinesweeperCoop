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

// Setup
initialSetup();