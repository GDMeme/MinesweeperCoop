// To run this script on windows, use
// Measure-Command { node Find8And9.js | Out-Default }

import { writeFile } from 'fs';

import { generateRandomMines } from "../util/commonFunctions.js";
import { calculateTileStatus } from "./utils.js"

function formatDivision(numerator, denominator) {
    return Math.round((numerator / denominator) * (10 ** denominator.toString().length)) / (10 ** denominator.toString().length);
}

const columns = 30;
const rows = 16;
const mines = 99;

// For the Roblox Minesweeper board (25x25/99), numIterations = 1000000 took me 2.45 minutes
const numIterations = 1000000;

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
    const minePlacements = generateRandomMines(rows, columns, mines);
    
    currentEightCounter = 0;
    currentNineCounter = 0;
    
    for (let i = 0; i < columns * rows; i++) {
        const currentX = i % columns;
        const currentY = Math.floor(i / columns);
        if (minePlacements.has(i)) { // If the tile itself is a mine, skip it
            if (calculateTileStatus(currentX, currentY, minePlacements, rows, columns) === 8) { // Found a 9
                currentNineCounter++;
                nineCounter++;
            }
            continue;
        }
        const tileStatus = calculateTileStatus(currentX, currentY, minePlacements, rows, columns); // Guaranteed not to be a bomb
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

data += `Probability of 8: ${formatDivision(eightCounter, numIterations)}%, or about 1 in ${Math.round(numIterations / eightCounter)}\n`;
data += `Probability of 9: ${formatDivision(nineCounter, numIterations)}%, or about 1 in ${Math.round(numIterations / nineCounter)}\n`;

writeFile('Find8And9.txt', data, (err) => {
    // In case of a error throw err.
    if (err) {
        throw err;
    }
});

console.log("Find8And9.txt created");