import { writeFile } from 'fs';

import { directionArray } from "../util/constants.js";
import { coordinateOutOfBounds } from "../util/commonFunctions.js";

function formatDivision(numerator, denominator) {
    return Math.round((numerator / denominator) * (10 ** denominator.toString().length)) / (10 ** denominator.toString().length);
}

let foundMine;
let openings;
let currentX;
let currentY;

const columns = 30;
const rows = 16;
const mines = 99;

// For an expert board, numBoardsGoal = 1 took me way too long (more than 1.8 billion boards)
const numBoardsGoal = 1;

let data = `Columns: ${columns}, Rows: ${rows}, Mines: ${mines}, numBoardsGoal: ${numBoardsGoal}\n`;

let cellsRevealed = new Set();

const minePlacements = new Set();
let possibleMinePlacements;

console.log("Started iterations");

let currentMinute = new Date().getMinutes();

let counter = 0;

let currentNumBoards = 0;
const counterTracker = new Set();

while (true) {
    if (new Date().getMinutes() !== currentMinute) {
        console.log(`Currently at iteration ${counter}`);
        currentMinute = new Date().getMinutes();
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
            break;
        }
    }
    
    if (openings === 0) {
        console.log(`Board with no openings found at iteration ${counter}!`);
        data += `Found a board with no openings! Number of iterations: ${counter}\n`;
        currentNumBoards++;
        counterTracker.add(counter);
        if (currentNumBoards === numBoardsGoal) {
            break;
        }
    }
    counter++;
}

let totalSum = 0;

for (const iteration of counterTracker) {
    totalSum += iteration;
}

data += `Average number of iterations for a board with no openings: ${formatDivision(totalSum, numBoardsGoal)}\n`;
data += `Chance of having a board with no openings: ${formatDivision(totalSum * 100, numBoardsGoal)}\n`;

writeFile('NoOpenings.txt', data, (err) => {
    // In case of a error throw err.
    if (err) {
        throw err;
    }
});
