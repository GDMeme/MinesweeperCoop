// To run this script on windows, use
// Measure-Command { node Find8And9.js | Out-Default }

import { writeFile } from 'fs';

import { directionArray } from "../util/constants.js";
import { coordinateOutOfBounds } from "../util/commonFunctions.js";

function calculateTileStatus(currentX, currentY) {
    let tileStatus = 0;
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

function formatDivision(numerator, denominator) {
    return Math.round((numerator / denominator) * (10 ** denominator.toString().length)) / (10 ** denominator.toString().length);
}

let currentX;
let currentY;

const columns = 25;
const rows = 25;
const mines = 99;

const minePlacements = new Set();
let possibleMinePlacements;

// For the Roblox Minesweeper board (25x25/99), numIterations = 1000000 took me 2.45 minutes
const numIterations = Number.MAX_SAFE_INTEGER;

console.log("Started iterations");

let currentMinute = new Date().getMinutes();

let eightCounter = 0;
let nineCounter = 0;

let currentEightCounter;
let currentNineCounter;

let eightMap = new Map();
let nineMap = new Map();

for (let a = 0; a < numIterations; a++) {
    if (new Date().getMinutes() !== currentMinute) {
        console.log(`Currently at iteration ${a} of ${numIterations}`);
        currentMinute = new Date().getMinutes();
    }
    minePlacements.clear();
    possibleMinePlacements = Array.from(new Array(columns * rows).keys());
    for (let i = 0; i < mines; i++) { //
        const randomIndex = Math.floor(Math.random() * (columns * rows - i));
        minePlacements.add(possibleMinePlacements[randomIndex]);
        possibleMinePlacements.splice(randomIndex, 1);
    }
    
    currentEightCounter = 0;
    currentNineCounter = 0;
    
    for (let i = 0; i < columns * rows; i++) {
        currentX = i % columns;
        currentY = Math.floor(i / columns);
        if (minePlacements.has(i)) { // If the tile itself is a mine, skip it
            if (calculateTileStatus(currentX, currentY) === 8) { // Found a 9
                currentNineCounter++;
                nineCounter++;
            }
            continue;
        }
        const tileStatus = calculateTileStatus(currentX, currentY); // Guaranteed not to be a bomb
        if (tileStatus === 8) {
            eightCounter++;
            currentEightCounter++;
        }
    }
    eightMap.set(currentEightCounter, eightMap.get(currentEightCounter) === undefined ? 1 : eightMap.get(currentEightCounter) + 1);
    nineMap.set(currentNineCounter, nineMap.get(currentNineCounter) === undefined ? 1 : nineMap.get(currentNineCounter) + 1);
}

let data = `Columns: ${columns}, Rows: ${rows}, Mines: ${mines}, numIterations: ${numIterations}\n`;

const sortedEightMap = new Map([...eightMap].sort((a, b) => a[0] - b[0]));

data += `Number of 8's per Game\n`;
sortedEightMap.forEach((value, key) => {
    data += `${key} => ${value}\n`;
});

const sortedNineMap = new Map([...nineMap].sort((a, b) => a[0] - b[0]));

data += `Number of 9's per Game\n`;
sortedNineMap.forEach((value, key) => {
    data += `${key} => ${value}\n`;
});

data += `Probability of 8: ${formatDivision(eightCounter, numIterations)}, or about 1/${Math.round(numIterations / eightCounter)}\n`;
data += `Probability of 9: ${formatDivision(nineCounter, numIterations)}, or about 1/${Math.round(numIterations / nineCounter)}\n`;

writeFile('Find8And9.txt', data, (err) => {
    // In case of a error throw err.
    if (err) {
        throw err;
    }
});

console.log("Find8And9.txt created");