import { calculateTileStatus } from './calculateTileStatus.js';
import { revealNeighbours } from './revealNeighbours.js';
import { checkWin } from '../util/commonFunctions.js';

export function revealCell(game, x, y) {
    // If they messed with their css, don't update the tile for them, too bad
    if (game.cellsRevealed.has([x, y].join())) { // Early return for chording
        return;
    }
    const cellID = y * game.columns + x;
    console.log("User revealed a cell, game.cellID: ", cellID);
    if (game.minePlacements.has(cellID) && !game.firstClick) {
        for (const currentWS of game.wsPlayers) {
            currentWS.send(JSON.stringify({type: "revealCell", id: "cell" + x + "_" + y, tileStatus: "bomb"}));
            game.lost = true;
        }
        return;
    }
    if (game.minePlacements.has(cellID) && game.firstClick) { // First click was a mine
        game.minePlacements.delete(cellID);
        let newMine;
        while (game.minePlacements.size < game.mines) { // Generate a mine in a different place
            newMine = Math.floor(Math.random() * (game.rows * game.columns));
            if (newMine !== cellID) {
                game.minePlacements.add(newMine); // Try to add the new mine (could still be duplicate)
            }
        }
    }
    const tileStatus = calculateTileStatus(game, x, y);
    for (const currentWS of game.wsPlayers) {
        currentWS.send(JSON.stringify({type: "revealCell", id: "cell" + x + "_" + y, tileStatus}));
    }
    game.cellsRevealed.add([x, y].join()); // adds a comma in between
    if (tileStatus === 0) {
        revealNeighbours(game, x, y);
    }
    checkWin(game);
    console.log("size of game.cellsRevealed: ", game.cellsRevealed.size);
    game.firstClick = false;
}