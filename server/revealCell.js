import { calculateTileStatus as calculateCellStatus } from './calculateCellStatus.js';
import { revealNeighbours } from './revealNeighbours.js';
import { checkWin, sendWSEveryone } from '../util/commonFunctions.js';

export function revealCell(game, x, y, ws) {
    if (x < 0 || y < 0 || x >= game.columns || y >= game.rows) {
        ws.send(JSON.stringify({type: "niceTry"}));
    }
    
    const cellID = y * game.columns + x;
    
    // Trying to reveal a cell that is already flagged (race condition or editing CSS, don't do anything)
    if (game.flaggedIDs.has(cellID)) {
        return;
    }
    
    // If they messed with their css, don't do anything
    if (game.cellsRevealed.has([x, y].join())) {
        return;
    }
    
    if (game.minePlacements.has(cellID) && !game.firstClick) { // Client clicked on a mine, game over
        game.lost = true;
        
        // Find misflags and send to clients
        const misFlags = []; // Pushing to const is not functional but who cares
        for (const flagID of game.flaggedIDs) {
            if (!game.minePlacements.has(flagID)) {
                misFlags.push(flagID);
            }
        }
        sendWSEveryone(game.wsPlayers, {type: "revealMinesMisflags", minePlacements: Array.from(game.minePlacements), deathCellID: cellID, misFlags});
        
        // Early return because the game is lost
        return;
    }
    // First click was a mine
    if (game.minePlacements.has(cellID) && game.firstClick) {
        game.minePlacements.delete(cellID);
        
        // Generates an array containing [0, 1, ... , game.columns * game.rows - game.mines - 1] excluding the IDs of existing mines and current cell (cellID)
        // Number of indices: game.columns * game.rows - game.mines + 1
        
        // Ex. 5x5/23, 2 possible spots to move the mine
        const possibleNewMinePlacements = new Array(game.columns * game.rows - game.mines);
        let cellCounter = 0;
        for (let i = 0; i < possibleNewMinePlacements.length; i++) {
            if (!game.minePlacements.has(cellCounter) && cellCounter !== cellID) {
                possibleNewMinePlacements[i] = cellCounter;
            } else { // Found an existing mine, skip but increment cellCounter
                i--;
            }
            cellCounter++;
        }
        
        // Generate a mine in a different place (will never be duplicate)
        const randomIndex = Math.floor(Math.random() * (possibleNewMinePlacements.length));
        game.minePlacements.add(possibleNewMinePlacements[randomIndex]);
    }
    
    const tileStatus = calculateCellStatus(game, x, y); // Guaranteed not to be a bomb
    sendWSEveryone(game.wsPlayers, {type: "revealCell", id: `cell${x}_${y}`, tileStatus});
    game.cellsRevealed.set(`${x},${y}`, tileStatus);
    if (tileStatus === 0) {
        revealNeighbours(game, x, y);
    }
    
    // Start timer after sending info to client
    if (game.firstClick) {
        game.startTime = new Date().getTime(); // Time in milliseconds
        game.firstClick = false;
    }
    if (checkWin(game)) {
        console.log("sending win");
        
        const secondsPassed = (new Date().getTime() - game.startTime) / 1000;
        
        // Don't send game.minePlacements to client if they weren't the one that won
        if (game.battleMode) {
            sendWSEveryone(game.wsPlayers, {type: "battleWin", playerName: WStoPlayerName.get(ws), secondsPassed});
            ws.send(JSON.stringify({type: "win", minePlacements: Array.from(game.minePlacements), secondsPassed}));
        } else {
            sendWSEveryone(game.wsPlayers, {type: "win", minePlacements: Array.from(game.minePlacements), secondsPassed});
        }
    }
}