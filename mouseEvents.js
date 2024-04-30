import { coordinateOutOfBounds } from "./util/commonFunctions.js";
import * as C from "./util/constants.js";

export function cellmouseout(event) {
    if (event.currentTarget.className === "cell pressed" && window.leftPressed) {
        event.currentTarget.className = "cell closed";
    }
    closeCellsAround(event);
};

export function cellmousedown(event) {
    if (window.lost || window.won) {
        return;
    }
    if (event.button === 0) { // left mouse button
        if (event.currentTarget.className === "cell closed") {
            event.currentTarget.className = "cell pressed";
        } else if (event.currentTarget.className.match('^(cell type)[0-8]$')) {
            pressCellsAround(event);
        }
    } else if (event.button === 2) { // right mouse button
        if (event.currentTarget.className.match('^(cell type)[0-8]$')) { // already revealed
            return;
        }
        if (event.currentTarget.className !== "cell exploded") {
            if (event.currentTarget.className === "cell flag") {
                event.currentTarget.className = "cell closed";
            } else {
                event.currentTarget.className = "cell flag";
            }
        }
    }
};

export function cellmouseup(event) {
    if (window.lost || window.won) {
        return;
    }
    if (event.which === 1 && event.currentTarget.className !== "cell flag" && event.currentTarget.className !== "cell exploded" && !event.currentTarget.className.match('^(cell type)[0-8]$')) {
        console.log("revealing cell");
        revealCell(event);
    } else if (event.which === 1 && event.currentTarget.className.match('^(cell type)[0-8]$')) { // Chording
        const tileNumber = parseInt(event.currentTarget.className.split('type')[1]);
        console.log("tileNumber is: ", tileNumber);
        const currentX = parseInt(event.currentTarget.dataset.x);
        const currentY = parseInt(event.currentTarget.dataset.y);
        let flagCounter = 0;
        let currentCell;
        for (const [x, y] of C.directionArray) {
            const newCoordinate = [currentX + x, currentY + y];
            if (coordinateOutOfBounds(newCoordinate, window.rows, window.columns)) {
                continue;
            }
            currentCell = document.querySelector(`#cell${newCoordinate[0]}_${newCoordinate[1]}`);
            if (currentCell.className === "cell flag") {
                flagCounter++;
            }
        }
        if (flagCounter === tileNumber) {
            window.ws.send(JSON.stringify({type: "revealChord", x: event.currentTarget.dataset.x, y: event.currentTarget.dataset.y}));
        } else {
            closeCellsAround(event);
        }
    }
};

export function cellmouseenter(event) {
    if (event.currentTarget.className !== "cell exploded" && event.currentTarget.className !== "cell flag") {
        event.currentTarget.addEventListener("mousedown", cellmousedown);
        if (window.leftPressed && !event.currentTarget.className.match('^(cell type)[0-8]$')) { 
            event.currentTarget.className = "cell pressed";
        } else if (window.leftPressed && event.currentTarget.className.match('^(cell type)[0-8]$')) {
            pressCellsAround(event);
        }
    }
};

const pressCellsAround = function(event) {
    const currentX = parseInt(event.currentTarget.dataset.x);
    const currentY = parseInt(event.currentTarget.dataset.y);
    let currentCell;
    for (const [x, y] of C.directionArray) {
        const newCoordinate = [currentX + x, currentY + y];
        if (coordinateOutOfBounds(newCoordinate, window.rows, window.columns)) {
            continue;
        }
        currentCell = document.querySelector(`#cell${newCoordinate[0]}_${newCoordinate[1]}`);
        if (currentCell.className === "cell closed") {
            currentCell.className = "cell pressed";
        }
    }
}

const closeCellsAround = function(event) {
    const currentX = parseInt(event.currentTarget.dataset.x);
    const currentY = parseInt(event.currentTarget.dataset.y);
    let currentCell;
    for (const [x, y] of C.directionArray) {
        const newCoordinate = [currentX + x, currentY + y];
        if (coordinateOutOfBounds(newCoordinate, window.rows, window.columns)) {
            continue;
        }
        currentCell = document.querySelector(`#cell${newCoordinate[0]}_${newCoordinate[1]}`);
        if (currentCell.className === "cell pressed") {
            currentCell.className = "cell closed";
        }
    }
}

const revealCell = function(event) {
    console.log("id: ", event.currentTarget.id);
    window.ws.send(JSON.stringify({type: "revealCell", x: event.currentTarget.dataset.x, y: event.currentTarget.dataset.y}));
}