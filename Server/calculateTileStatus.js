import { coordinateOutOfBounds } from './coordinateOutOfBounds.js';

import * as C from './constants.js';

export function calculateTileStatus(minePlacements, currentX, currentY, rows, columns) {
    let tileStatus = 0;
    for (const [x, y] of C.directionArray) {
        const newCoordinate = [currentX + x, currentY + y];
        if (coordinateOutOfBounds(newCoordinate, rows, columns)) {
            continue;
        }
        const id = newCoordinate[1] * columns + newCoordinate[0];
        if (minePlacements.has(id)) {
            tileStatus++;
        }
    }
    // console.log("returning tilestatus of " + tileStatus);
    return tileStatus;
}