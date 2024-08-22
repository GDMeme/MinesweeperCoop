import { calculateTileStatus } from './calculateTileStatus.js';
import { coordinateOutOfBounds } from '../util/commonFunctions.js';

import * as C from "../util/constants.js";

let frontier = [];
let tileStatus;
const tileStatusMap = new Map();
let tileStatusMapToArray = [];

export function revealNeighbours(game, currentX, currentY) {
    const {rows, columns, cellsRevealed, wsPlayers, flaggedIDs} = game;
    frontier = [[currentX, currentY].join()];
    tileStatusMap.clear();
    tileStatusMapToArray = [];
    let cellID;
    while (frontier.length !== 0) {
        [currentX, currentY] = frontier.pop().split(",").map(e => parseInt(e));
        cellsRevealed.add([currentX, currentY].join());
        
        // If the user reveals an opening that removes a flag
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
            if (!cellsRevealed.has(newCoordinate.join()) && tileStatus === 0) {
                frontier.push(newCoordinate.join());
            }
            tileStatusMap.set(newCoordinate.join("_"), tileStatus);
            cellsRevealed.add(newCoordinate.join());
            
            // If the user reveals a tile that removes a flag
            cellID = newY * columns + newX;
            if (flaggedIDs.has(cellID)) {
                flaggedIDs.delete(cellID);
                sendWSEveryone(game.wsPlayers, {type: "unflag", id: `cell${newX}_${newY}`, numFlags: game.flaggedIDs.size});
            }
        }
    }
    for (const [key, value] of tileStatusMap.entries()) {
        tileStatusMapToArray.push({key, value});
    }
    for (const ws of wsPlayers) {
        ws.send(JSON.stringify({type: "revealCells", data: JSON.stringify(tileStatusMapToArray)}));
    }
}