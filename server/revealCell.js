import { calculateTileStatus } from './calculateCellStatus.js';
import { revealNeighbours } from './revealNeighbours.js';
import { checkWin } from '../util/commonFunctions.js';

export function revealCell(room, x, y, ws) {
    const board = room.findBoardFromWS(ws);
    console.log("board is: ", board);
    
    if (x < 0 || y < 0 || x >= board.columns || y >= board.rows) {
        console.log("out of bounds");
        ws.send(JSON.stringify({type: "niceTry"}));
    }
    
    const cellID = y * board.columns + x;
    
    // Trying to reveal a cell that is already flagged (race condition or editing CSS, don't do anything)
    if (board.flaggedIDs.has(cellID)) {
        console.log("trying to reveal a cell that is already flagged");
        return;
    }
    
    // If they messed with their css, don't do anything
    if (board.cellsRevealed.has([x, y].join())) {
        console.log("messed with css");
        return;
    }
    
    if (board.minePlacements.has(cellID) && !board.firstClick) { // Client clicked on a mine, game over
        // Find misflags and send to clients
        const misFlags = []; // Pushing to const is not functional but who cares
        for (const flagID of board.flaggedIDs) {
            if (!board.minePlacements.has(flagID)) {
                misFlags.push(flagID);
            }
        }
        room.sendMessage({type: "revealMinesMisflags", minePlacements: Array.from(board.minePlacements), deathCellID: cellID, misFlags}, ws);
        
        // Early return because the game is lost
        return;
    }
    // First click was a mine
    if (board.minePlacements.has(cellID) && board.firstClick) {
        board.minePlacements.delete(cellID);
        
        // Generates an array containing [0, 1, ... , game.columns * game.rows - game.mines - 1] excluding the IDs of existing mines and current cell (cellID)
        // Number of indices: game.columns * game.rows - game.mines + 1
        
        // Ex. 5x5/23, 2 possible spots to move the mine
        const possibleNewMinePlacements = new Array(board.columns * board.rows - board.mines);
        let cellCounter = 0;
        for (let i = 0; i < possibleNewMinePlacements.length; i++) {
            if (!board.minePlacements.has(cellCounter) && cellCounter !== cellID) {
                possibleNewMinePlacements[i] = cellCounter;
            } else { // Found an existing mine, skip but increment cellCounter
                i--;
            }
            cellCounter++;
        }
        
        // Generate a mine in a different place (will never be duplicate)
        const randomIndex = Math.floor(Math.random() * (possibleNewMinePlacements.length));
        board.minePlacements.add(possibleNewMinePlacements[randomIndex]);
    }
    
    const tileStatus = calculateTileStatus(board, x, y); // Guaranteed not to be a bomb
    room.sendMessage({type: "revealCell", id: `cell${x}_${y}`, tileStatus}, ws);
    board.cellsRevealed.set(`${x},${y}`, tileStatus);
    if (tileStatus === 0) {
        revealNeighbours(room, x, y, ws);
    }
    
    // Start timer after sending info to client
    if (board.firstClick) {
        board.startTime = new Date().getTime(); // Time in milliseconds
        board.firstClick = false;
    }
    if (checkWin(board)) {
        console.log("sending win");
        
        const secondsPassed = (new Date().getTime() - board.startTime) / 1000;
        
        // Don't send game.minePlacements to client if they weren't the one that won
        room.sendMessage({type: "win", minePlacements: Array.from(board.minePlacements), secondsPassed}, ws);
    }
}