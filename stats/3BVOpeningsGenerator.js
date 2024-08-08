import { writeFile } from 'fs';

import { directionArray } from "../util/constants.js";
import { coordinateOutOfBounds } from "../util/commonFunctions.js";

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

function formatDivision(numerator, denominator) {
    return Math.round((numerator / denominator) * (10 ** denominator.toString().length)) / (10 ** denominator.toString().length);
}

const ThreeBVMap = new Map();
const openingsMap = new Map();
const openingSizeMap = new Map();
const currentOpeningSize = new Set();
const maxSizeOpeningMap = new Map();
const minSizeOpeningMap = new Map();

let foundMine;
let openings;
let currentX;
let currentY;

const columns = 30;
const rows = 16;
const mines = 99;

let frontier = [];

const boardOpenings = new Set();

let ThreeBV;

const minePlacements = new Set();
let possibleMinePlacements;

let total3BVSum = 0;
let totalOpeningsSum = 0;

let minSizeOpening;
let maxSizeOpening;

// For an expert board, numIterations = 1000000 took me 5.95 minutes
const numIterations = 1000000;

let data = `Columns: ${columns}, Rows: ${rows}, Mines: ${mines}, numIterations: ${numIterations}\n`;

console.log("Started iterations");

let currentMinute = new Date().getMinutes();

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

    openings = 0;
    boardOpenings.clear();
    
    minSizeOpening = Number.MAX_SAFE_INTEGER;
    maxSizeOpening = -1;
    
    // If next to a 0 tile or itself is a 0 tile, don't count toward 3BV
    for (let i = 0; i < columns * rows; i++) {
        if (minePlacements.has(i)) { // If the tile itself is a mine, skip it
            continue;
        }
        currentX = i % columns;
        currentY = Math.floor(i / columns);
        if (boardOpenings.has(`${currentX},${currentY}`)) { // Already found this 0 tile
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
                boardOpenings.add(`${currentX},${currentY}`);
                currentOpeningSize.add(`${currentX},${currentY}`);
                for (const [x, y] of directionArray) {
                    const newX = currentX + x;
                    const newY = currentY + y;
                    if (coordinateOutOfBounds([newX, newY], rows, columns)) {
                        continue;
                    }
                    const tileStatus = calculateTileStatus(newX, newY); // Guaranteed not to be a bomb
                    if (!boardOpenings.has(`${newX},${newY}`) && tileStatus === 0) {
                        frontier.push(`${newX},${newY}`);
                    }
                    boardOpenings.add(`${newX},${newY}`);
                    currentOpeningSize.add(`${newX},${newY}`);
                }
            }
            if (currentOpeningSize.size > maxSizeOpening) {
                maxSizeOpening = currentOpeningSize.size;
            }
            if (currentOpeningSize.size < minSizeOpening) {
                minSizeOpening = currentOpeningSize.size;
            }
            currentOpeningSize.clear();
        }
    }
    ThreeBV = columns * rows - boardOpenings.size - minePlacements.size + openings;
    total3BVSum += ThreeBV;
    totalOpeningsSum += openings;
    ThreeBVMap.set(ThreeBV, ThreeBVMap.get(ThreeBV) === undefined ? 1 : ThreeBVMap.get(ThreeBV) + 1);
    openingsMap.set(openings, openingsMap.get(openings) === undefined ? 1 : openingsMap.get(openings) + 1);
    
    // Maps to [Sum of openings, # of boards with this specific number of openings]
    const [sumOfOpenings, numBoards] = openingSizeMap.get(openings) ?? [0, 0];
    openingSizeMap.set(openings, [sumOfOpenings + boardOpenings.size, numBoards + 1]);
    
    const currentMin = minSizeOpeningMap.get(openings) ?? Number.MAX_SAFE_INTEGER;
    if (minSizeOpening < currentMin) {
        minSizeOpeningMap.set(openings, minSizeOpening);
    }
    const currentMax = maxSizeOpeningMap.get(openings) ?? -1;
    if (maxSizeOpening > currentMax) {
        maxSizeOpeningMap.set(openings, maxSizeOpening);
    }
}

const sortedThreeBV = new Map([...ThreeBVMap].sort((a, b) => a[0] - b[0]));

data += `3BV Counter\n`;

sortedThreeBV.forEach((value, key) => {
   data += `${key} => ${value}\n`;
});

data += `Average 3BV: ${formatDivision(total3BVSum, numIterations)}\n`;

let numBoards;

for (const threeBV of sortedThreeBV.keys()) {
    numBoards = 0;
    sortedThreeBV.forEach((value, key) => {
        if (key >= threeBV) {
            numBoards += value;
        }
    });
    data += `Chance of having a board with ${threeBV} or more 3BV: ${formatDivision(numBoards * 100, numIterations)}%\n`; // Round to correct number of decimal places
}

const sortedOpenings = new Map([...openingsMap].sort((a, b) => a[0] - b[0]));

data += `Openings Counter\n`;

sortedOpenings.forEach((value, key) => {
    data += `${key} => ${value}\n`;
});

data += `Average openings: ${formatDivision(totalOpeningsSum, numIterations)}\n`;

for (const openings of sortedOpenings.keys()) {
    numBoards = 0;
    sortedOpenings.forEach((value, key) => {
        if (key >= openings) {
            numBoards += value;
        }
    });
    data += `Chance of having a board with ${openings} or more openings: ${formatDivision(numBoards * 100, numIterations)}%\n`; // Round to correct number of decimal places
}

const sortedOpeningSize = new Map([...openingSizeMap].sort((a, b) => a[0] - b[0]));

sortedOpeningSize.forEach((value, key) => {
    const denominator = value[1] * key;
    data += `Average opening size for ${key} openings: ${formatDivision(value[0], denominator)}\n`;
});

const sortedMinSizeOpening = new Map([...minSizeOpeningMap].sort((a, b) => a[0] - b[0]));

sortedMinSizeOpening.forEach((value, key) => {
    data += `Smallest size opening for ${key} openings: ${value}\n`;
});

const sortedMaxSizeOpening = new Map([...maxSizeOpeningMap].sort((a, b) => a[0] - b[0]));

sortedMaxSizeOpening.forEach((value, key) => {
    data += `Biggest size opening for ${key} openings: ${value}\n`;
});


writeFile('3BVOpeningsGenerator.txt', data, (err) => {
    // In case of a error throw err.
    if (err) {
        throw err;
    }
});

console.log("3BVOpeningsGenerator.txt created");