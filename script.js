import { initialSetup } from './setup.js';

// Globals (Nothing will go wrong)
window.leftPressed = false;
window.ws = null;
window.noclicking = true;
window.rows = -1; // Temporary default value
window.columns = -1;
window.mines = -1;
window.playerName = null;
window.gameName = null;
window.playerList = [];
window.largeBoard = false;
window.firstClick = true;
window.battleMode = false;
window.chording = true;
window.probabilityStartup = false;

// Setup
initialSetup();