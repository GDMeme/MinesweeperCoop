// Globals
let pressed = false;

document.addEventListener("dragstart", (event) => {
    event.preventDefault();
});

document.addEventListener("mousedown", function() {
    pressed = true;
});

document.addEventListener("mouseup", function() {
    pressed = false;
});

// Setup
let cellmouseout = function(event) {
    event.currentTarget.className = "cell closed";
}

let cellmousedown = function(event) {
    event.currentTarget.className = "cell pressed";
}

let cellmouseup = function(event) {
    event.currentTarget.className = "cell type1"; // TODO: determine the number that should be displayed
    event.currentTarget.removeEventListener("mouseout", cellmouseout);
    event.currentTarget.removeEventListener("mousedown", cellmousedown);
}

let cellmouseenter = function(event) {
    if (event.currentTarget.className != "cell type1") { // TODO: regex for all numbers?
        event.currentTarget.addEventListener("mousedown", cellmousedown);
        if (pressed) { 
            event.currentTarget.className = "cell pressed";
        };
    }
}

document.querySelectorAll(".cell").forEach(e => {
    e.addEventListener("mouseenter", cellmouseenter);
    e.addEventListener("mouseout", cellmouseout);
    e.addEventListener("mouseup", cellmouseup);
});