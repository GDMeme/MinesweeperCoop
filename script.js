import { connect } from './connect.js';
import { setupCells } from './setupCells.js';
import { generateBoard } from './generateBoard.js'

// Globals (Nothing will go wrong)
window.leftPressed = false;
window.ws = null;
window.lost = false;
window.won = false;
window.rows = -1; // Temporary default value
window.columns = -1;

let timerFlag = true; // true: Ready to send next mouse movement

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

document.addEventListener("mousemove", function(event) {
    if (window.ws && timerFlag && document.hasFocus()) { // Tab should be focused to track mouse movement
        ws.send(JSON.stringify({type: "mouseMove", x: event.x, y: event.y}));
        timerFlag = false;
        setTimeout(() => {
            timerFlag = true;    
        }, 20); // Wait 20ms before sending another mouseMove message
    } 
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
                if (isNaN(message.tileStatus)) { // bomb found   
                    console.log("exploded")            
                    document.querySelector(`#${message.id}`).className = "cell exploded";
                    window.lost = true;
                    document.querySelector("#lose").style.display = "block"; // TODO: Change later
                } else {
                    document.querySelector(`#${message.id}`).className = `cell type${message.tileStatus}`;
                }
                break;
            case "revealCells":
                let currentCell;
                let data = JSON.parse(message.data);
                console.log(JSON.parse(message.data));
                for (let i = 0; i < data.length; i++) {
                    currentCell = document.querySelector(`#cell${data[i].key}`);
                    if (currentCell.className === 'cell flag') {
                        if (data[i].value !== 'bomb') {
                            console.log("misflag!");
                            window.lost = true;
                            document.querySelector("#lose").style.display = "block"; // TODO: Change later
                            currentCell.className = 'cell misflag';
                            ws.send(JSON.stringify({type: 'gameOver'}));
                            continue;
                        } else {
                            continue; // TODO: make the logic here better
                        }
                    } 
                    currentCell.className = data[i].value === 'bomb' ? `cell exploded` : `cell type${data[i].value}`;
                }
                break;
            case "generatedBoard":
                document.querySelector("#win").style.display = "none"; // TODO: Change later
                document.querySelector("#lose").style.display = "none"; // TODO: Change later
                window.lost = false;
                window.won = false;
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
                console.log("ws: ", message.ws);
                break;
            case "win": // TODO: On win or lose, make the cells mouse events do nothing
                console.log("You win");
                window.won = true;
                document.querySelector("#win").style.display = "block"; // TODO: Change later
                break;
            case "mouseMoved":
                console.log("Someone's mouse moved");
                let currentMouse;
                if (!document.querySelector(`#mouse${message.wsID}`)) { // Check if it's a new player
                    const newNode = document.createElement("div");
                    newNode.className = "mousepointer";
                    document.body.appendChild(newNode);
                    newNode.id = `mouse${message.wsID}`;
                }
                currentMouse = document.querySelector(`#mouse${message.wsID}`);
                currentMouse.style.left = parseInt(message.x) - 10 + 'px'; // Offset for image
                currentMouse.style.top = parseInt(message.y) - 2 + 'px';
                break;
            default: 
                console.log("How did you get here" + message);
        } 
    });
});