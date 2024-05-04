import { initialSetup } from './setup.js';

// Globals (Nothing will go wrong)
window.leftPressed = false;
window.ws = null;
window.lost = false;
window.won = false;
window.rows = -1; // Temporary default value
window.columns = -1;
window.playerName = null;
window.roomName = null;
window.playerList = [];

// Setup
initialSetup();