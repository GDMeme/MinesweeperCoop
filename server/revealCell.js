import { calculateTileStatus as calculateCellStatus } from './calculateCellStatus.js';
import { revealNeighbours } from './revealNeighbours.js';
import { checkWin, sendWSEveryone } from '../util/commonFunctions.js';

export function revealCell(game, x, y, ws) {
    if (x < 0 || y < 0 || x >= game.columns || y >= game.rows) {
        ws.send(JSON.stringify({type: "niceTry"}));
    }
    
    // If they messed with their css, don't update the tile for them, too bad
    if (game.cellsRevealed.has([x, y].join())) { // Early return for chording
        return;
    }
    const cellID = y * game.columns + x;
    if (game.minePlacements.has(cellID) && !game.firstClick) { // Client clicked on a mine, game over
        game.lost = true;
        
        // Find misflags and send to clients
        const misFlags = []; // Pushing to const is not functional but who cares
        for (const flagCoordinate of game.flaggedIDs) {
            const [x, y] = flagCoordinate.split(",").map(e => parseInt(e));
            const cellID = y * game.columns + x;
            if (!game.minePlacements.has(cellID)) {
                misFlags.push([x, y].join());
            }
        }
        sendWSEveryone(game.wsPlayers, {type: "revealMinesMisflags", minePlacements: Array.from(game.minePlacements), deathCellID: cellID, misFlags});
        
        // Early return because the game is lost
        return;
    }
    if (game.minePlacements.has(cellID) && game.firstClick) { // First click was a mine
        game.minePlacements.delete(cellID);
        
        // Generates an array containing [0, 1, ... , game.columns * game.rows - game.mines] excluding the IDs of existing mines
        // Number of indices: game.columns * game.rows - game.mines + 1
        const possibleNewMinePlacements = new Array(game.columns * game.rows - game.mines + 1);
        let cellCounter = 0;
        for (let i = 0; i < possibleNewMinePlacements.length; i++) {
            if (!game.minePlacements.has(cellCounter)) {
                possibleNewMinePlacements[i] = cellCounter;
            } else { // Found an existing mine, skip but increment cellCounter
                i--;
            }
            cellCounter++;
        }
        
        // Generate a mine in a different place (will never be duplicate)
        const randomIndex = Math.floor(Math.random() * (game.columns * game.rows - game.mines + 1))
        game.minePlacements.add(possibleNewMinePlacements[randomIndex]);
    }
    
    if (game.firstClick) {
        game.startTime = new Date().getTime(); // Time in milliseconds
    }
    
    // If the client reveals a cell that removes a flag (only possible through editing CSS)
    if (game.flaggedIDs.has(cellID)) {
        game.flaggedIDs.delete(cellID);
        sendWSEveryone(game.wsPlayers, {type: "unflag", id: `cell${newX}_${newY}`, numFlags: game.flaggedIDs.size});
    }
    
    const tileStatus = calculateCellStatus(game, x, y); // Guaranteed not to be a bomb
    sendWSEveryone(game.wsPlayers, {type: "revealCell", id: `cell${x}_${y}`, tileStatus});
    game.cellsRevealed.set(`${x},${y}`, tileStatus);
    if (tileStatus === 0) {
        revealNeighbours(game, x, y);
    }
    checkWin(game, ws);
    game.firstClick = false;
}