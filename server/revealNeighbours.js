import { calculateTileStatus } from './calculateTileStatus.js';
import { coordinateOutOfBounds } from '../util/commonFunctions.js';

import * as C from "../util/constants.js";

let frontier = [];
const visited = new Set();
let tileStatus;
const numberMap = new Map();
let numberMapToArray = [];

export function revealNeighbours(game, currentX, currentY, wsID) {
    const {rows, columns, cellsRevealed, wsPlayers} = game;
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
            tileStatus = calculateTileStatus(game, newX, newY);
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
    for (const ws of wsPlayers) {
        ws.send(JSON.stringify({type: "revealCells", data: JSON.stringify(numberMapToArray), wsID}));
    }
}