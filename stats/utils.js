import { directionArray } from "../util/constants.js";
import { coordinateOutOfBounds } from "../util/commonFunctions.js";

export function calculateTileStatus(currentX, currentY, minePlacements, rows, columns) {
    let tileStatus = 0;
    if (minePlacements.has(currentY * columns + currentX)) { // For chording, need to know which tiles are bombs
        return "bomb";
    }
    for (const [x, y] of directionArray) {
        const newX = currentX + x;
        const newY = currentY + y;
        if (coordinateOutOfBounds([newX, newY], rows, columns)) {
            continue;
        }
        if (minePlacements.has(newY * columns + newX)) {
            tileStatus++;
        }
    }
    return tileStatus;
}

export function checkWin(cellsRevealed, minePlacements, rows, columns) {
    return cellsRevealed.size === rows * columns - minePlacements.size;
}