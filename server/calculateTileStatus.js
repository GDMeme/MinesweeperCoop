import { coordinateOutOfBounds } from "../util/commonFunctions.js";

import * as C from "../util/constants.js";

export function calculateTileStatus(game, currentX, currentY) {
    const {minePlacements, rows, columns} = game;
    let tileStatus = 0;
    if (minePlacements.has(currentY * columns + currentX)) { // For chording, need to know which tiles are bombs
        return "bomb";
    }
    for (const [x, y] of game.largeBoard ? C.bigDirectionArray : C.directionArray) {
        const newCoordinate = [currentX + x, currentY + y];
        if (coordinateOutOfBounds(newCoordinate, rows, columns)) {
            continue;
        }
        const id = newCoordinate[1] * columns + newCoordinate[0];
        if (minePlacements.has(id)) {
            tileStatus++;
        }
    }
    return tileStatus;
}