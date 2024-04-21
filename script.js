import { connect } from './connect.js';
import { setupCells } from './setupCells.js';

// Globals (Nothing will go wrong)
window.leftPressed = false;
window.ws = null;

document.addEventListener("dragstart", (event) => {
    event.preventDefault();
});

document.addEventListener("mousedown", function(event) {
    if (event.button === 0) { // left mouse button
        window.leftPressed = true;
    }
});

document.addEventListener("mouseup", function() {
    window.leftPressed = false;
});

let test = document.getElementById("game");
const newnode = document.createElement("div");
newnode.innerHTML = "HI"
test.insertBefore(newnode, null)

// Setup

connect().then(function(ws) {
    window.ws = ws;
    console.log("connected to server"); 
    
    setupCells();
    
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