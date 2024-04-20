import { connect } from './connect.js'

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

let ws;

let cellmouseout = function(event) {
    if (event.currentTarget.className === "cell pressed") {
        event.currentTarget.className = "cell closed";
    }
};

let cellmousedown = function(event) {
    if (event.button === 0) {
        if (event.currentTarget.className === "cell closed") { // left mouse button
            event.currentTarget.className = "cell pressed";
        } else if (event.currentTarget.className === "cell type1") { // TODO: regex for all numbers
            console.log("chord");
            // TODO: chord
        }
    } else if (event.button === 2) { // right mouse button
        if (event.currentTarget.className !== "cell type1" && event.currentTarget.className !== "cell exploded") { // TODO: regex for all numbers
            if (event.currentTarget.className === "cell flagged") {
                event.currentTarget.className = "cell closed";
            } else {
                event.currentTarget.className = "cell flagged";
            }
        }
    }
};

let cellmouseup = function(event) {
    if (event.which === 1 && event.currentTarget.className !== "cell flagged" && event.currentTarget.className !== "cell exploded" && event.currentTarget.className !== "cell type1") { // TODO: regex for all numbers
        console.log("revealing cell");
        event.currentTarget.className = "cell type1"; // TODO: determine the number that should be displayed
        revealCell(event);
    }
};

let revealCell = function(event) {
    console.log(event.currentTarget.id);
    ws.send(JSON.stringify({type: "revealCell", id: event.currentTarget.id})); // TODO: change this later
}

let cellmouseenter = function(event) {
    if (event.currentTarget.className !== "cell type1" && event.currentTarget.className !== "cell exploded" && event.currentTarget.className !== "cell flagged") { // TODO: regex for all numbers
        event.currentTarget.addEventListener("mousedown", cellmousedown);
        if (leftPressed) { 
            event.currentTarget.className = "cell pressed";
        };
    }
};

document.querySelectorAll(".cell").forEach(e => {
    e.addEventListener("mouseenter", cellmouseenter);
    e.addEventListener("mouseout", cellmouseout);
    e.addEventListener("mouseup", cellmouseup);
    e.addEventListener("contextmenu", function(event) {
        event.preventDefault();
    });
});


connect().then(function(websocket) {
    ws = websocket;
    console.log("connected to server"); 
    
    ws.addEventListener("message", (message) => {
        message = JSON.parse(message.data);
        console.log("message: ", message);
        if (message.type === "niceTry") {
            console.log("lol");
        } else if (message.type === "revealCell") {
            if (isNaN(message.tileStatus)) { // bomb    
                console.log("exploded")            
                document.querySelector(`#${message.id}`).className = "cell exploded"
            } else {
                console.log("revealed real tile")
                document.querySelector(`#${message.id}`).className = `cell type${message.tileStatus}`;
            }
        } 
    });
});