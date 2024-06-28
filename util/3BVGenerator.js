import { writeFile } from 'fs';

import { directionArray } from "./constants.js";
import { coordinateOutOfBounds } from "./commonFunctions.js";

function calculateTileStatus(currentX, currentY) {
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

const ThreeBVMap = new Map();

let foundMine;
let openings;
let currentX;
let currentY;

const columns = 30;
const rows = 16;
const mines = 99;

let frontier = [];

let cellsRevealed = new Set();

let ThreeBV;

const minePlacements = new Set();
let possibleMinePlacements;

let totalSum = 0;

let data = "";

// numIterations = 1000000 took me 4.8 minutes
const numIterations = 1000000;

console.log("Started iterations");

const date = new Date();
const currentMinute = date.getMinutes();

for (let a = 0; a < numIterations; a++) {
    if (date.getMinutes() !== currentMinute) {
        console.log(`Currently at iteration ${a} out of ${numIterations}`);
        currentMinute = date.getMinutes();
    }
    minePlacements.clear();
    possibleMinePlacements = Array.from(Array(columns * rows - 1).keys());
    for (let i = 0; i < mines; i++) { //
        const randomIndex = Math.floor(Math.random() * (columns * rows - i));
        minePlacements.add(possibleMinePlacements[randomIndex]);
        possibleMinePlacements.splice(randomIndex, 1);
    }

    openings = 0;
    cellsRevealed.clear();
    
    // If next to a 0 tile or itself is a 0 tile, don't count toward 3BV
    for (let i = 0; i < columns * rows; i++) {
        if (minePlacements.has(i)) { // If the tile itself is a mine, skip it
            continue;
        }
        currentX = i % columns;
        currentY = Math.floor(i / columns);
        if (cellsRevealed.has(`${currentX},${currentY}`)) { // Already found this 0 tile
            continue;
        }

        foundMine = false;
        // Check if it's a 0 tile
        for (const [directionX, directionY] of directionArray) {
            const newX = currentX + directionX;
            const newY = currentY + directionY;
            if (coordinateOutOfBounds([newX, newY], rows, columns)) {
                continue;
            }
            if (minePlacements.has(newY * columns + newX)) {
                foundMine = true;
                break;
            }
        }
        
        if (!foundMine) { // Found a 0 tile
            openings++;
            frontier.push(`${currentX},${currentY}`);
            while (frontier.length !== 0) {
                [currentX, currentY] = frontier.pop().split(",").map(e => parseInt(e));
                cellsRevealed.add(`${currentX},${currentY}`);
                for (const [x, y] of directionArray) {
                    const newX = currentX + x;
                    const newY = currentY + y;
                    if (coordinateOutOfBounds([newX, newY], rows, columns)) {
                        continue;
                    }
                    const tileStatus = calculateTileStatus(newX, newY); // Guaranteed not to be a bomb
                    if (!cellsRevealed.has(`${newX},${newY}`) && tileStatus === 0) {
                        frontier.push(`${newX},${newY}`);
                    }
                    cellsRevealed.add(`${newX},${newY}`);
                }
            }
        }
    }
    ThreeBV = columns * rows - cellsRevealed.size - minePlacements.size + openings;
    totalSum += ThreeBV;
    if (ThreeBVMap.has(ThreeBV)) {
        ThreeBVMap.set(ThreeBV, ThreeBVMap.get(ThreeBV) + 1);
    } else {
        ThreeBVMap.set(ThreeBV, 1);
    }
}

const sortedThreeBV = new Map([...ThreeBVMap].sort((a, b) => a[0] - b[0]));

const serialized = Array.from([...sortedThreeBV]);

data += `3BV Counter\n`;

for (const [threeBV, counter] of serialized) {
    data += `${threeBV} => ${counter}\n`;
}
data += `Average 3BV: ${totalSum / numIterations}\n`;

let filteredThreeBV;
let numBoards;

for (const key of sortedThreeBV.keys()) {
    numBoards = 0;
    filteredThreeBV = new Map([...sortedThreeBV].filter(([threeBV, counter]) => threeBV >= key));
    filteredThreeBV.forEach((counter) => {
        numBoards += counter;
    })
    data += `Chance of having a board with ${key} or more 3BV: ${Math.round((numBoards / numIterations * 100) * (10 ** numIterations.toString().length)) / (10 ** numIterations.toString().length)}%\n`; // Round to correct number of decimal places
}

writeFile('output.txt', data, (err) => {
    // In case of a error throw err.
    if (err) {
        throw err;
    }
});