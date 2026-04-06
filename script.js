import { initialSetup } from './initialSetup.js';
import { initFeatureFlags } from './development/featureFlags/featureFlags.js'

// Globals (Nothing will go wrong)
window.leftPressed = false;
window.ws = null;
window.noclicking = true;
window.rows = -1; // Temporary default value
window.columns = -1;
window.mines = -1;
window.playerName = null;
window.roomName = null;
window.playerList = [];
window.largeBoard = false;
window.firstClick = true;
window.mode = "coop"; // Default mode
window.chording = true;
window.numTeams = 0;
window.toggleOn = true; // For delayed mode
window.featureFlags = initFeatureFlags();

// Setup
initialSetup();