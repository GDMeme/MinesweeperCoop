export function cellmouseout(event) {
    if (event.currentTarget.className === "cell pressed" && window.leftPressed) {
        event.currentTarget.className = "cell closed";
    }
};

export function cellmousedown(event) {
    if (window.lost) {
        return;
    }
    if (event.button === 0) {
        if (event.currentTarget.className === "cell closed") { // left mouse button
            event.currentTarget.className = "cell pressed";
        } else if (event.currentTarget.className === "cell type1") { // TODO: regex for all numbers
            console.log("chord");
            // TODO: chord
        }
    } else if (event.button === 2) { // right mouse button
        if (event.currentTarget.className.match('^(cell type)[0-8]$')) { // already revealed
            return;
        }
        if (event.currentTarget.className !== "cell type1" && event.currentTarget.className !== "cell exploded") { // TODO: regex for all numbers
            if (event.currentTarget.className === "cell flagged") {
                event.currentTarget.className = "cell closed";
            } else {
                event.currentTarget.className = "cell flagged";
            }
        }
    }
};

export function cellmouseup(event) {
    if (window.lost) {
        return;
    }
    if (event.which === 1 && event.currentTarget.className !== "cell flagged" && event.currentTarget.className !== "cell exploded" && event.currentTarget.className !== "cell type1") { // TODO: regex for all numbers
        console.log("revealing cell");
        revealCell(event);
    }
};

export function cellmouseenter(event) {
    if (event.currentTarget.className !== "cell type1" && event.currentTarget.className !== "cell exploded" && event.currentTarget.className !== "cell flagged") { // TODO: regex for all numbers
        event.currentTarget.addEventListener("mousedown", cellmousedown);
        if (window.leftPressed) { 
            event.currentTarget.className = "cell pressed";
        };
    }
};

let revealCell = function(event) {
    console.log("id: ", event.currentTarget.id);
    window.ws.send(JSON.stringify({type: "revealCell", x: event.currentTarget.dataset.x, y: event.currentTarget.dataset.y}));
}