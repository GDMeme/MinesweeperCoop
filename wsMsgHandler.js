import { setupCells } from "./setup.js";

export function wsMsgHandler(ws) {
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
            case "win":
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
            case "sendGames":
                for (const game of message.games) {
                    const gameButton = document.createElement('button');
                    // TODO: On button hover, show who is in that room
                    gameButton.innerHTML = game.name;
                    document.getElementById('availablerooms').appendChild(gameButton);
                    gameButton.onclick = function() {
                        ws.send(JSON.stringify({type: 'joinedRoom', gameID: game.ID}));
                        for (const child of document.querySelector('#availablerooms').children) {
                            child.remove();
                        }
                        document.querySelector('#inputs').className = "table";
                    }
                }
                break;
            case "addPlayer":
                window.playerList.push(message.name);
                document.querySelector('#playerlist').innerHTML = window.playerList.join(", ");
                break;
            default: 
                console.log("How did you get here" + message);
        } 
    });
}