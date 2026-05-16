import { writeFile } from 'fs';

const realLog = console.log;
console.log = () => {};

import { directionArray } from "../util/constants.js";
import { coordinateOutOfBounds, generateRandomMines } from "../util/commonFunctions.js";
import { doAnalysis, dropHandler } from '../solver/client/main.js';
import { calculateTileStatus, checkWin } from './utils.js';

const columns = 30;
const rows = 16;
const mines = 99;

const numIterations = 1000;

let gamesWon = 0;
let firstMove;

const cellsRevealed = new Set();
let minePlacements;

function revealCell(x, y, boardState) {
    if (cellsRevealed.has(`${x},${y}`)) return boardState;
    const tileStatus = calculateTileStatus(x, y, minePlacements, rows, columns);
    
    if (tileStatus === "bomb") {
        if (firstMove) {
            firstMove = false;
            
            const cellID = y * columns + x;
            
            minePlacements.delete(cellID);
            
            const possibleNewMinePlacements = new Array(columns * rows - mines);
            let cellCounter = 0;
            for (let i = 0; i < possibleNewMinePlacements.length; i++) {
                if (!minePlacements.has(cellCounter) && cellCounter !== cellID) {
                    possibleNewMinePlacements[i] = cellCounter;
                } else { // Found an existing mine, skip but increment cellCounter
                    i--;
                }
                cellCounter++;
            }
            
            // Generate a mine in a different place (will never be duplicate)
            const randomIndex = Math.floor(Math.random() * (possibleNewMinePlacements.length));
            minePlacements.add(possibleNewMinePlacements[randomIndex]);
            
            return revealCell(x, y, boardState);
        } else {
            return "bomb";
        }
    } else {
        firstMove = false;
        cellsRevealed.add(`${x},${y}`);
        if (tileStatus !== 0) {
            boardState[y][x] = tileStatus;
        } else { // BFS
            cellsRevealed.add(`${x},${y}`);
            const frontier = [[x, y]];
            while (frontier.length !== 0) {
                const [currX, currY] = frontier.pop();
                boardState[currY][currX] = 0;
                for (const [dx, dy] of directionArray) {
                    const newX = currX + dx;
                    const newY = currY + dy;
                    if (coordinateOutOfBounds([newX, newY], rows, columns) || cellsRevealed.has(`${newX},${newY}`)) {
                        continue;
                    }
                    const tileStatus = calculateTileStatus(newX, newY, minePlacements, rows, columns);
                    cellsRevealed.add(`${newX},${newY}`);
                    if (tileStatus === 0) {
                        frontier.push([newX, newY]);
                    } else {
                        boardState[newY][newX] = tileStatus;
                    }
                }
            }
        }
    }
    
    return boardState;
}

function parseBoard(boardState) {
    let parsedBoard = `${columns}x${rows}x${mines}\n`;
    for (let i = 0; i < rows; i++) {
        parsedBoard += boardState[i].join("") + "\n";
    }
    return parsedBoard;
}

console.log("Started iterations");

let currentMinute = new Date().getMinutes();

for (let i = 0; i < numIterations; i++) {
    if (new Date().getMinutes() !== currentMinute) {
        realLog(`Currently at iteration ${i} of ${numIterations}`);
        realLog(`Num wins so far: `, gamesWon);
        currentMinute = new Date().getMinutes();
    }
    minePlacements = generateRandomMines(rows, columns, mines);
    
    // Start with all cells closed
    let boardState = Array.from({ length: rows }, () =>
        Array.from({ length: columns }, () => "H")
    );
    
    cellsRevealed.clear();
    firstMove = true;
    
    // Start solving the board
    while (true) {
        await dropHandler(parseBoard(boardState));
        const [result, _] = await doAnalysis();
        
        if (!Array.isArray(result)) {
            realLog("Result isn't an array??");
            realLog("Result is: ", result);
            break;
        }
        
        const safeCells = result[0].prob === 1 ? result.filter(r => r.action === 1 && r.prob === 1): [];
        
        if (safeCells.length === 0) { // Forced guess
            const bestGuess = result[0];
            boardState = revealCell(bestGuess.x, bestGuess.y, boardState)
            if (boardState === "bomb") {
                // Game lost
                break;
            }
        } else { // Guaranteed safe move
            for (const cell of safeCells) {
                boardState = revealCell(cell.x, cell.y, boardState);
            }
        }
        
        if (checkWin(cellsRevealed, minePlacements, rows, columns)) {
            gamesWon++;
            break;
        }
    }
}

writeFile("winRate.txt", `Games won: ${gamesWon}\nTotal games: ${numIterations}\nWin rate: ${gamesWon / numIterations}`, (err) => {
    if (err) {
        console.error("Error writing to file: ", err);
    } else {
        realLog("Win rate written to winRate.txt");
    }
});