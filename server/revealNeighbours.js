import { calculateTileStatus } from './calculateCellStatus.js';
import { coordinateOutOfBounds } from '../util/commonFunctions.js';

import * as C from "../util/constants.js";

export function revealNeighbours(room, currentX, currentY, ws) {
    const board = room.findBoardFromWS(ws);
    const {rows, columns, cellsRevealed, wsPlayers, flaggedIDs} = board;
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
            room.sendMessage({type: "unflag", id: `cell${currentX}_${currentY}`, numFlags: board.flaggedIDs.size}, ws);
        }
        
        for (const [x, y] of C.directionArray) {
            const newX = currentX + x;
            const newY = currentY + y;
            const newCoordinate = [newX, newY];
            if (coordinateOutOfBounds(newCoordinate, rows, columns)) {
                continue;
            }
            tileStatus = calculateTileStatus(board, newX, newY); // Guaranteed not to be a bomb
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
                room.sendMessage({type: "unflag", id: `cell${newX}_${newY}`, numFlags: board.flaggedIDs.size}, ws);
            }
        }
    }
    
    // Send new cells that were revealed
    for (const [key, value] of newRevealedCellsMap.entries()) {
        newRevealedCellsMapToArray.push({key, value});
    }
    
    room.sendMessage({type: "revealCells", data: newRevealedCellsMapToArray}, ws);
}