import { coordinateOutOfBounds } from "./util/commonFunctions.js";
import * as C from "./util/constants.js";

export function cellmouseout(event) {
    if (event.currentTarget.className === "cell pressed" && window.leftPressed) {
        event.currentTarget.className = "cell closed";
    }
    closeCellsAround(event);
};

export function cellmousedown(event) {
    if (window.noclicking) {
        console.log("you lost or won, no more clicking")
        return;
    }
    // Left mouse button
    if (event.button === 0 && event.currentTarget.className === "cell closed") {
        event.currentTarget.className = "cell pressed";
    // Left or middle mouse button
    } else if ((event.button === 0 || event.button === 1) && event.currentTarget.className !== "cell flag" && event.currentTarget.className.match('^(cell type)[0-9]|[1][0-9]|[2][0-4]$') && window.chording) {
        pressCellsAround(event);
    // Right mouse button
    } else if (event.button === 2) {
        if (event.currentTarget.className.match('^(cell type)[0-9]|[1][0-9]|[2][0-4]$')) { // Already revealed
            return;
        }
        
        // Flagging/Unflagging
        if (event.currentTarget.className !== "cell exploded") {
            if (event.currentTarget.className === "cell flag") {
                event.currentTarget.className = "cell closed";
                window.ws.send(JSON.stringify({type: "unflag", x: event.currentTarget.dataset.x, y: event.currentTarget.dataset.y}));
            } else {
                event.currentTarget.className = "cell flag";
                window.ws.send(JSON.stringify({type: "placeFlag", x: event.currentTarget.dataset.x, y: event.currentTarget.dataset.y}));
            }
        }
    }
};

export function cellmouseup(event) {
    if (window.noclicking) {
        return;
    }
    // Normal reveal
    if (event.button === 0 && event.currentTarget.className !== "cell flag" && event.currentTarget.className !== "cell exploded" && !event.currentTarget.className.match('^(cell type)[0-9]|[1][0-9]|[2][0-4]$')) {
        console.log("revealing cell: ", event);
        window.ws.send(JSON.stringify({type: "revealCell", x: event.currentTarget.dataset.x, y: event.currentTarget.dataset.y}));
    // Chording
    // TODO Add chording options (Disable left click to chord, enable left + right click to chord) Maybe start with left click chord enabled?
    } else if ((event.button === 0 || event.button === 1) && event.currentTarget.className.match('^(cell type)[0-9]|[1][0-9]|[2][0-4]$') && window.chording) {
        const cellNumber = parseInt(event.currentTarget.className.split('type')[1]);
        const currentX = parseInt(event.currentTarget.dataset.x);
        const currentY = parseInt(event.currentTarget.dataset.y);
        let flagCounter = 0;
        let currentCell;
        const cellsToReveal = [[event.currentTarget.dataset.x, event.currentTarget.dataset.y].join()];
        for (const [x, y] of window.largeBoard ? C.bigDirectionArray : C.directionArray) {
            const newCoordinate = [currentX + x, currentY + y];
            if (coordinateOutOfBounds(newCoordinate, window.rows, window.columns)) {
                continue;
            }
            currentCell = document.querySelector(`#cell${newCoordinate[0]}_${newCoordinate[1]}`);
            if (currentCell.className === "cell flag") {
                flagCounter++;
            } else if (currentCell.className === "cell pressed") {
                cellsToReveal.push(newCoordinate.join());
            }
        }
        if (flagCounter === cellNumber) {
            window.ws.send(JSON.stringify({type: "revealChord", cellsToReveal, x: event.currentTarget.dataset.x, y: event.currentTarget.dataset.y}));
        } else {
            closeCellsAround(event);
        }
    }
};

export function cellmouseenter(event) {
    if (window.noclicking) {
        return;
    }
    event.currentTarget.addEventListener("mousedown", cellmousedown);
    if (window.leftPressed && event.currentTarget.className !== "cell flag" && !event.currentTarget.className.match('^(cell type)[0-9]|[1][0-9]|[2][0-4]$')) { 
        event.currentTarget.className = "cell pressed";
    } else if (window.leftPressed && event.currentTarget.className.match('^(cell type)[0-9]|[1][0-9]|[2][0-4]$') && window.chording) {
        pressCellsAround(event);
    }
};

const pressCellsAround = function(event) {
    if (!window.chording) {
        return;
    }
    const currentX = parseInt(event.currentTarget.dataset.x);
    const currentY = parseInt(event.currentTarget.dataset.y);
    let currentCell;
    for (const [x, y] of window.largeBoard ? C.bigDirectionArray : C.directionArray) {
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
    for (const [x, y] of window.largeBoard ? C.bigDirectionArray : C.directionArray) {
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