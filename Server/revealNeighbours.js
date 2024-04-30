import { calculateTileStatus } from './calculateTileStatus.js';
import { coordinateOutOfBounds } from '../util/commonFunctions.js';

import * as C from "../util/constants.js";

let frontier = [];
const visited = new Set();
let tileStatus;
const numberMap = new Map();
let numberMapToArray = [];

export function revealNeighbours(minePlacements, currentX, currentY, rows, columns, cellsRevealed, ws) {
    frontier = [[currentX, currentY].join()];
    visited.clear();
    numberMap.clear();
    numberMapToArray = [];
    while (frontier.length !== 0) {
        [currentX, currentY] = frontier.pop().split(",").map(e => parseInt(e));
        visited.add([currentX, currentY].join());
        for (const [x, y] of C.directionArray) {
            const newX = currentX + x;
            const newY = currentY + y;
            const newCoordinate = [newX, newY];
            if (coordinateOutOfBounds(newCoordinate, rows, columns)) {
                continue;
            }
            tileStatus = calculateTileStatus(minePlacements, newX, newY, rows, columns);
            if (!visited.has(newCoordinate.join()) && tileStatus === 0) {
                frontier.push(newCoordinate.join());
            }
            if (!numberMap.has(newCoordinate.join("_"))) {
                numberMap.set(newCoordinate.join("_"), tileStatus);
                if (tileStatus !== "bomb") {
                    cellsRevealed.add(newCoordinate.join());
                }
            }
        }
    }
    for (const [key, value] of numberMap.entries()) {
        numberMapToArray.push({key, value});
    }
    ws.send(JSON.stringify({type: "revealCells", data: JSON.stringify(numberMapToArray)}));
}