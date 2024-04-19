// Globals
let leftPressed = false;

document.addEventListener("dragstart", (event) => {
    event.preventDefault();
});

document.addEventListener("mousedown", function(event) {
    if (event.button === 0) { // left mouse button
        leftPressed = true;
    }
});

document.addEventListener("mouseup", function() {
    leftPressed = false;
});

// Setup
let cellmouseout = function(event) {
    event.currentTarget.className = "cell closed";
};

let cellmousedown = function(event) {
    if (event.button === 0 && event.currentTarget.className != "cell flagged") { // left mouse button
        event.currentTarget.className = "cell pressed";
    } else if (event.button === 2) { // right mouse button
        if (event.currentTarget.className != "cell type1") { // TODO: regex for all numbers
            if (event.currentTarget.className == "cell flagged") {
                event.currentTarget.className = "cell closed";
                event.currentTarget.addEventListener("mouseout", cellmouseout);
            } else {
                event.currentTarget.className = "cell flagged";
                event.currentTarget.removeEventListener("mouseout", cellmouseout);
            }
        }
    }
};

let cellmouseup = function(event) {
    if (event.which === 1 && event.currentTarget.className != "cell flagged") {
        event.currentTarget.className = "cell type1"; // TODO: determine the number that should be displayed
        event.currentTarget.removeEventListener("mouseout", cellmouseout);
        event.currentTarget.removeEventListener("mousedown", cellmousedown);
    }
};

let cellmouseenter = function(event) {
    if (event.currentTarget.className != "cell type1") { // TODO: regex for all numbers
        event.currentTarget.addEventListener("mousedown", cellmousedown);
        if (leftPressed) { 
            event.currentTarget.className = "cell pressed";
        };
    }
};

let placeflag = function(event) {
    event.preventDefault();
    if (event.currentTarget.className != "cell type1") { // TODO: regex for all numbers
        if (event.currentTarget.className == "cell flagged") {
            event.currentTarget.className = "cell closed";
        } else {
            event.currentTarget.className = "cell flagged";
        }
    }
}

document.querySelectorAll(".cell").forEach(e => {
    e.addEventListener("mouseenter", cellmouseenter);
    e.addEventListener("mouseout", cellmouseout);
    e.addEventListener("mouseup", cellmouseup);
    e.addEventListener("contextmenu", function(event) {
        event.preventDefault();
    });
});