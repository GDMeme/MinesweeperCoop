import { connect } from './connect.js';
import { setupCells } from './setupCells.js';
import { generateBoard } from './generateBoard.js'

// Globals (Nothing will go wrong)
window.leftPressed = false;
window.ws = null;
window.lost = false;

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

document.querySelector('#generateboard').onclick = function() {
    generateBoard();
}

// Setup

connect().then(function(ws) {
    window.ws = ws;
    console.log("connected to server"); 
    
    ws.addEventListener("message", (message) => {
        message = JSON.parse(message.data);
        console.log("message: ", message);
        switch (message.type) {
            case "niceTry":
                console.log("lol");
                break;
            case "revealCell":
                console.log("revealCell received");
                if (isNaN(message.tileStatus)) { // bomb    
                    console.log("exploded")            
                    document.querySelector(`#${message.id}`).className = "cell exploded";
                    window.lost = true;
                } else {
                    console.log("revealed real tile")
                    document.querySelector(`#${message.id}`).className = `cell type${message.tileStatus}`;
                }
                break;
            case "revealCells":
                let data = JSON.parse(message.data);
                console.log(JSON.parse(message.data));
                for (let i = 0; i < data.length; i++) {
                    if (isNaN(data[i].value)) { // bomb    
                        console.log("exploded")            
                        document.querySelector(`#cell${data[i].key}`).className = "cell exploded";
                        window.lost = true;
                    } else {
                        console.log("revealed real tile")
                        document.querySelector(`#cell${data[i].key}`).className = `cell type${data[i].value}`;
                    }
                }
                break;
            case "generatedBoard":
                window.lost = false;
                let reference = document.querySelector("#game");
                reference.innerHTML = ""
                for (let i = 0; i < message.rows; i++) {
                    for (let j = 0; j < message.columns; j++) {
                        const newNode = document.createElement("div");
                        newNode.className = "cell closed";
                        newNode.dataset.x = j;
                        newNode.dataset.y = i;
                        newNode.id = "cell" + j + "_" + i;
                        reference.insertBefore(newNode, null);
                    }
                    const newNode = document.createElement("div");
                    newNode.className = "clear";
                    reference.insertBefore(newNode, null);
                }
                setupCells();
                break;
            default: 
                console.log("How did you get here" + message);
        } 
    });
});