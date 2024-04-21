import { calculateTileStatus } from './calculateTileStatus.js';
import { coordinateOutOfBounds } from './coordinateOutOfBounds.js';

import * as C from './constants.js';

let frontier = [];
const visited = new Set();
let tileStatus;

export function revealNeighbours(minePlacements, currentX, currentY, rows, columns, ws, flag) {
    if (flag) {
        frontier = [[currentX, currentY].join()];
        visited.clear();
    }
    while (frontier.length !== 0) {
        [currentX, currentY] = frontier.pop().split(",").map(e => parseInt(e));
        // console.log("currentx: ", currentX);
        // console.log("currenty: ", currentY);
        // console.log(frontier);
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
            ws.send(JSON.stringify({type: "revealCell", id: "cell" + newCoordinate.join("_"), tileStatus})); // TODO: make this better lol
        }
    }
}