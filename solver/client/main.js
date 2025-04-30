import { Board } from './Board.js';
import { BruteForceGlobal } from './BruteForceAnalysis.js';
import { countSolutions, solver, SolverGlobal, formatSolutions } from './solver_main.js';

import { CURRENT_PLAYSTYLE } from './global.js';

console.log('At start of main.js');

BruteForceGlobal.PRUNE_BF_ANALYSIS = true;
SolverGlobal.EARLY_FIFTY_FIFTY_CHECKING = true;
SolverGlobal.CALCULATE_LONG_TERM_SAFETY = true;
SolverGlobal.PRUNE_GUESSES = true;
BruteForceGlobal.ANALYSIS_BFDA_THRESHOLD = 5000;

let board;

let guessAnalysisPruning = true;

export async function doAnalysis(fullBFDA) {
    console.log("Analysing...");
 
    const solutionCounter = await countSolutions(board);

    if (solutionCounter.finalSolutionsCount != 0) {
        const options = {};
        options.playStyle = CURRENT_PLAYSTYLE; // * GDMEM edited this
        options.fullProbability = true;
        options.guessPruning = guessAnalysisPruning;
        options.fullBFDA = fullBFDA;

        const solve = await solver(board, options);  // look for solutions
        const hints = solve.actions;

        console.log("hints:" , hints);
        return hints;
    } else {
        console.log("The board is in an invalid state");
        return;
    }
}


async function checkBoard() {
    // this will set all the obvious mines which makes the solution counter a lot more efficient on very large boards
    const badTile = board.resetForAnalysis(true, true);

    if (badTile != null) {
        console.log("The board is in an invalid state. Tile " + badTile.asText() + " is invalid.");
        return;
    }
    const solutionCounter = await countSolutions(board);
    board.resetForAnalysis(true, false);
    
    if (solutionCounter.finalSolutionsCount != 0) {
        let logicText;
        if (solutionCounter.clearCount != 0) {
            logicText = "There are safe tile(s). ";
        } else {
            logicText = "There are no safe tiles. ";
        }
        console.log("The board is valid. " + board.getFlagsPlaced() + " Mines placed. " + logicText + formatSolutions(solutionCounter.finalSolutionsCount));
    } else {
        let msg = "";
        if (solutionCounter.invalidReasons.length > 0) {
            msg = solutionCounter.invalidReasons[0];
        }
        console.log("The board is in an invalid state. " + msg);
    }
}

async function newBoardFromFile(inputString) {
    await newBoardFromString(inputString);
    await checkBoard();
}

async function newBoardFromString(data) {
    const lines = data.split("\n");
    const size = lines[0].split("x");
    if (size.length != 3) {
        console.log("Header line is invalid: " + lines[0]);
        return;
    }
    const width = parseInt(size[0]);
    const height = parseInt(size[1]);
    const mines = parseInt(size[2]);
    console.log("width " + width + " height " + height + " mines " + mines);
    if (width < 1 || height < 1 || mines < 0) {
        console.log("Invalid dimensions for game");
        return;
    }

    if (lines.length < height + 1) {
        console.log("Insufficient lines to hold the data: " + lines.length);
        return;
    }
    
    const newBoard = new Board(1, width, height, mines, "", "safe");
    for (let y = 0; y < height; y++) {
        const line = lines[y + 1];
        console.log(line);
        for (let x = 0; x < width; x++) {
            const char = line.charAt(x);
            const tile = newBoard.getTileXY(x, y);
            if (char == "F" || char == "M") {
                tile.toggleFlag();
                newBoard.bombs_left--;
            } else if (char == "0") {
                tile.setValue(0);
            } else if (char == "1") {
                tile.setValue(1);
            } else if (char == "2") {
                tile.setValue(2);
            } else if (char == "3") {
                tile.setValue(3);
            } else if (char == "4") {
                tile.setValue(4);
            } else if (char == "5") {
                tile.setValue(5);
            } else if (char == "6") {
                tile.setValue(6);
            } else if (char == "7") {
                tile.setValue(7);
            } else if (char == "8") {
                tile.setValue(8);
            } else {
                tile.setCovered(true);
            }
        }
    }
    
    board = newBoard;
}

// reads a file dropped onto the top of the minesweeper board
export async function dropHandler(inputString) {
    console.log("got into dropHandler!")
    newBoardFromFile(inputString);  
}