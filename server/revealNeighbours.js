import { calculateTileStatus } from './calculateCellStatus.js';
import { coordinateOutOfBounds, sendWSEveryone } from '../util/commonFunctions.js';

import * as C from "../util/constants.js";

export function revealNeighbours(game, currentX, currentY) {
    const {rows, columns, cellsRevealed, wsPlayers, flaggedIDs} = game;
    const frontier = [[currentX, currentY].join()];
    let tileStatus;
    const newRevealedCellsMap = new Map();
    const newRevealedCellsMapToArray = [];
    let cellID;
    while (frontier.length !== 0) {
        [currentX, currentY] = frontier.pop().split(",").map(e => parseInt(e));
        cellsRevealed.set([currentX, currentY].join(), 0);
        
        // If the client reveals an opening that removes a flag
        cellID = currentY * columns + currentX;
        if (flaggedIDs.has(cellID)) {
            flaggedIDs.delete(cellID);
            sendWSEveryone(game.wsPlayers, {type: "unflag", id: `cell${currentX}_${currentY}`, numFlags: game.flaggedIDs.size});
        }
        
        for (const [x, y] of C.directionArray) {
            const newX = currentX + x;
            const newY = currentY + y;
            const newCoordinate = [newX, newY];
            if (coordinateOutOfBounds(newCoordinate, rows, columns)) {
                continue;
            }
            tileStatus = calculateTileStatus(game, newX, newY); // Guaranteed not to be a bomb
            if (!cellsRevealed.has(newCoordinate.join())) {
                newRevealedCellsMap.set(newCoordinate.join("_"), tileStatus);
                cellsRevealed.set(newCoordinate.join(), tileStatus);
                if (tileStatus === 0) {
                    frontier.push(newCoordinate.join());
                }
            }
            
            // If the client reveals a tile that removes a flag
            cellID = newY * columns + newX;
            if (flaggedIDs.has(cellID)) {
                flaggedIDs.delete(cellID);
                sendWSEveryone(game.wsPlayers, {type: "unflag", id: `cell${newX}_${newY}`, numFlags: game.flaggedIDs.size});
            }
        }
    }
    
    // Send new cells that were revealed
    for (const [key, value] of newRevealedCellsMap.entries()) {
        newRevealedCellsMapToArray.push({key, value});
    }
    
    sendWSEveryone(wsPlayers, {type: "revealCells", data: newRevealedCellsMapToArray});
}