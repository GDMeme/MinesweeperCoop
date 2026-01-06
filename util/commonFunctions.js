import { MinesweeperBoard } from "../server/MinesweeperBoard.js";

let lastRoomTime = 0;

export function coordinateOutOfBounds(coordinate, rows, columns) { // * Only used by server
    return (coordinate[0] < 0 || coordinate[0] >= columns || coordinate[1] < 0 || coordinate[1] >= rows);
}

export function checkWin(game) { // * Only used by server, maybe move in server directory? idk
    return (game.rows * game.columns) - game.cellsRevealed.size === game.minePlacements.size;
}

// * This allows for some easy cheating since it's client side. Then again, not really preventable
// This function is done client-side; if they change their css,
// the probability calculations will be incorrect for their actual board
export function HTMLtoString(children) {
    // * No calculator for large board (yet?)
    if (window.largeBoard === true) {
        return null;
    }
    let data = "";
    for (const child of children) {
        const classArray = child.className.split(" ");
        if (classArray[0] !== "cell") {
            if (classArray[0] === "clear") {
                data += "\n";
            }
            continue;
        }
        switch (classArray[1]) {
            case "closed":
                data += "H";
                continue;
            case "pressed":
                data += "H";
                continue;
            case "flag":
                data += "F";
                continue;
            case "misflag":
                // Cannot do calculations on a lost board
                return null;
            case "exploded":
                // Cannot do calculations on a lost board
                return null;
            case "mine":
                // Cannot do calculations on a lost board
                return null;
        }
        // Only cell type[0-8] should get here
        const found = classArray[1].match(/type[0-8]/);
        if (found.length === 1) {
            data += found[0].slice(-1);
        } else {
            return null;
        }
    }
    data = `${window.columns}x${window.rows}x${window.mines}${data}`;
    console.log("data is below");
    console.log(data);
    return data;
}

export function removeProbabilities() { // Only used client side
    window.stopProbabilities = true;
    for (const cell of document.getElementById("game").children) {
        if (cell.className.split(" ")[0] === "cell") {
            cell.innerHTML = "";
        }
    }
}

export function generateRandomMines(rows, columns, mines) {
    const randomMines = new Set();
    
    // Generates an array containing [0, 1, ... , rows * columns - 1]
    const possibleMinePlacements = Array.from(new Array(rows * columns).keys());
    for (let i = 0; i < mines; i++) {
        const randomIndex = Math.floor(Math.random() * (rows * columns - i))
        randomMines.add(possibleMinePlacements[randomIndex]);
        possibleMinePlacements.splice(randomIndex, 1);
    }
    
    return randomMines;
}

export function sendToGroup(message, group) {
    group.forEach(ws => {
        ws.send(JSON.stringify(message));
    });
}

// Ensure uniqueness
export function generateRoomID() {
    lastRoomTime = Math.max(Date.now(), lastRoomTime + 1);
    return `room-${lastRoomTime}`;
}