import { writeFile } from 'fs';

import { directionArray } from "../util/constants.js";
import { coordinateOutOfBounds } from "../util/commonFunctions.js";

function calculateTileStatus(currentX, currentY, minePlacements, rows, columns) {
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
    if (denominator === 0) {
        console.log(`Trying to divide by 0, returning 0. Numerator: ${numerator}, Denominator: ${denominator}`);
        return 0;
    }
    return Math.round((numerator / denominator) * (10 ** denominator.toString().length)) / (10 ** denominator.toString().length);
}

const ThreeBVOccurrenceMap = new Map(); // 3BV => Number of occurrences
const openingsOccurrenceMap = new Map(); // Openings => Number of occurrences
const openingSizeMap = new Map(); // Openings => [Sum of openings, # of boards with this specific number of openings] to get average size of opening
const maxSizeOpeningMap = new Map(); // Openings => Max size opening encountered
const minSizeOpeningMap = new Map(); // Openings => Min size opening encountered
const ThreeBVOpeningMap = new Map(); // Openings => [Sum of 3BV, # of boards with this specific number of openings] to get average 3BV
const maxThreeBVOpeningMap = new Map(); // Openings => Max 3BV encountered
const minThreeBVOpeningMap = new Map(); // Openings => Min 3BV encountered

const columns = 30;
const rows = 16;
const mines = 99;

let globalThreeBVSum = 0;
let globalOpeningsSum = 0;

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
    
    let possibleMinePlacements = Array.from(new Array(columns * rows).keys());
    for (let i = possibleMinePlacements.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [possibleMinePlacements[i], possibleMinePlacements[j]] = [possibleMinePlacements[j], possibleMinePlacements[i]];
    }
    const minePlacements = new Set(possibleMinePlacements.slice(0, mines));

    let numOpenings = 0;
    const zeroTilesSet = new Set();
    
    let minSizeOpening = Number.MAX_SAFE_INTEGER;
    let maxSizeOpening = -1;
    
    // If next to a 0 tile or itself is a 0 tile, don't count toward 3BV
    for (let i = 0; i < columns * rows; i++) {
        if (minePlacements.has(i)) { // If the tile itself is a mine, skip it
            continue;
        }
        let currentX = i % columns;
        let currentY = Math.floor(i / columns);
        if (zeroTilesSet.has(`${currentX},${currentY}`)) { // Already found this 0 tile
            continue;
        }

        let foundMine = false;
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
            numOpenings++;
            const currentOpeningSize = new Set();
            let frontier = [`${currentX},${currentY}`];
            while (frontier.length !== 0) {
                [currentX, currentY] = frontier.pop().split(",").map(e => parseInt(e));
                zeroTilesSet.add(`${currentX},${currentY}`);
                currentOpeningSize.add(`${currentX},${currentY}`);
                for (const [x, y] of directionArray) {
                    const newX = currentX + x;
                    const newY = currentY + y;
                    if (coordinateOutOfBounds([newX, newY], rows, columns)) {
                        continue;
                    }
                    
                    const key = `${newX},${newY}`;
                    if (zeroTilesSet.has(key)) {
                        continue;
                    }
                    
                    const tileStatus = calculateTileStatus(newX, newY, minePlacements, rows, columns); // Guaranteed not to be a bomb
                    if (tileStatus === 0) {
                        frontier.push(key);
                    }
                    
                    zeroTilesSet.add(key);
                    currentOpeningSize.add(key);
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
    const ThreeBV = columns * rows - zeroTilesSet.size - minePlacements.size + numOpenings;
    globalThreeBVSum += ThreeBV;
    globalOpeningsSum += numOpenings;
    ThreeBVOccurrenceMap.set(ThreeBV, (ThreeBVOccurrenceMap.get(ThreeBV) || 0) + 1);
    openingsOccurrenceMap.set(numOpenings, openingsOccurrenceMap.get(numOpenings) === undefined ? 1 : openingsOccurrenceMap.get(numOpenings) + 1);
    
    const [sumOfZeros, numBoards] = openingSizeMap.get(numOpenings) ?? [0, 0];
    openingSizeMap.set(numOpenings, [sumOfZeros + zeroTilesSet.size, numBoards + 1]);
    
    const [sumOfThreeBV, numBoards2] = ThreeBVOpeningMap.get(numOpenings) ?? [0, 0];
    ThreeBVOpeningMap.set(numOpenings, [sumOfThreeBV + ThreeBV, numBoards2 + 1]);
    
    const prevMinThreeBV = minThreeBVOpeningMap.get(numOpenings) ?? Number.MAX_SAFE_INTEGER;
    if (ThreeBV < prevMinThreeBV) {
        minThreeBVOpeningMap.set(numOpenings, ThreeBV);
    }
    
    const prevMaxThreeBV = maxThreeBVOpeningMap.get(numOpenings) ?? -1;
    if (ThreeBV > prevMaxThreeBV) {
        maxThreeBVOpeningMap.set(numOpenings, ThreeBV);
    }
    
    const prevMinOpening = minSizeOpeningMap.get(numOpenings) ?? Number.MAX_SAFE_INTEGER;
    if (minSizeOpening < prevMinOpening) {
        minSizeOpeningMap.set(numOpenings, minSizeOpening);
    }
    const prevMaxOpening = maxSizeOpeningMap.get(numOpenings) ?? -1;
    if (maxSizeOpening > prevMaxOpening) {
        maxSizeOpeningMap.set(numOpenings, maxSizeOpening);
    }
}

data += `\n3BV Counter\n`;

const sortedThreeBVOccurrence = new Map([...ThreeBVOccurrenceMap].sort((a, b) => a[0] - b[0]));
sortedThreeBVOccurrence.forEach((value, key) => {
   data += `${key} => ${value}\n`;
});

data += `Average 3BV: ${formatDivision(globalThreeBVSum, numIterations)}\n\n`;

for (const threeBV of sortedThreeBVOccurrence.keys()) {
    let numBoards = 0;
    sortedThreeBVOccurrence.forEach((value, key) => {
        if (key >= threeBV) {
            numBoards += value;
        }
    });
    data += `Chance of having a board with ${threeBV} or more 3BV: ${formatDivision(numBoards * 100, numIterations)}%, or about 1 in ${formatDivision(numIterations, numBoards)}\n`; // Round to correct number of decimal places
}

const sortedOpeningsOccurrence = new Map([...openingsOccurrenceMap].sort((a, b) => a[0] - b[0]));

data += `\n`;
data += `Openings Counter\n`;

sortedOpeningsOccurrence.forEach((value, key) => {
    data += `${key} => ${value}\n`;
});

data += `Average openings: ${formatDivision(globalOpeningsSum, numIterations)}\n`;
data += `\n`;

for (const openings of sortedOpeningsOccurrence.keys()) {
    let numBoards = 0;
    sortedOpeningsOccurrence.forEach((value, key) => {
        if (key >= openings) {
            numBoards += value;
        }
    });
    data += `Chance of having a board with ${openings} or more openings: ${formatDivision(numBoards * 100, numIterations)}%, or about 1 in ${formatDivision(numIterations, numBoards)}\n`; // Round to correct number of decimal places
}

data += `\n`;

const sortedThreeBVOpening = new Map([...ThreeBVOpeningMap].sort((a, b) => a[0] - b[0]));
sortedThreeBVOpening.forEach((value, key) => {
    data += `Average 3BV for ${key} openings: ${formatDivision(value[0], value[1])}\n`;
});

data += `\n`;

const sortedMinThreeBVOpening = new Map([...minThreeBVOpeningMap].sort((a, b) => a[0] - b[0]));
sortedMinThreeBVOpening.forEach((value, key) => {
    data += `Smallest 3BV for ${key} openings: ${value}\n`;
});

data += '\n';

const sortedMaxThreeBVOpening = new Map([...maxThreeBVOpeningMap].sort((a, b) => a[0] - b[0]));
sortedMaxThreeBVOpening.forEach((value, key) => {
    data += `Biggest 3BV for ${key} openings: ${value}\n`;
});

data += '\n';

const sortedOpeningSize = new Map([...openingSizeMap].sort((a, b) => a[0] - b[0]));
sortedOpeningSize.forEach((value, key) => {
    const denominator = value[1] * key; // Total zero tiles / (# of openings * # of boards)
    data += `Average opening size for ${key} openings: ${formatDivision(value[0], denominator)}\n`;
});

data += `\n`;

const sortedMinSizeOpening = new Map([...minSizeOpeningMap].sort((a, b) => a[0] - b[0]));
sortedMinSizeOpening.forEach((value, key) => {
    data += `Smallest size opening for ${key} openings: ${value}\n`;
});

data += `\n`;

const sortedMaxSizeOpening = new Map([...maxSizeOpeningMap].sort((a, b) => a[0] - b[0]));
sortedMaxSizeOpening.forEach((value, key) => {
    data += `Biggest size opening for ${key} openings: ${value}\n`;
});

writeFile('3BVOpeningsGenerator.txt', data, (err) => {
    if (err) {
        console.log("Something bad happened: ", err);
        throw err;
    }
});

console.log("3BVOpeningsGenerator.txt created");