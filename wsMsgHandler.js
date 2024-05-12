import { setupCells } from "./setup.js";

export function wsMsgHandler(ws) {
    window.ws = ws;
    console.log("connected to server"); 

    ws.addEventListener("message", (message) => {
        message = JSON.parse(message.data);
        if (message.type !== "mouseMoved") {
            console.log("message: ", message); // No spamming logs.
        }
        switch (message.type) {
            case "niceTry":
                console.log("lol");
                break;
            case "revealAllMines":
                console.log("message.minePlacements", message.minePlacements);
                for (const cellID of message.minePlacements) {
                    const x = cellID % window.columns;
                    const y = Math.floor(cellID / window.columns);
                    document.querySelector(`#cell${x}_${y}`).className = "cell mine";
                }
                break;
            case "revealMisflags":
                if (message.misFlags.length > 0) {
                    console.log("message.misFlags: ", message.misFlags)
                    for (const misFlag of message.misFlags) {
                        const [x, y] = misFlag.split(",").map(e => parseInt(e));
                        document.querySelector(`#cell${x}_${y}`).className = "cell misflag";
                    }
                }
                console.log("misflag spotted")
                break;
            case "revealCell":
                console.log("revealCell received");
                console.log("message.id: ", message.id);
                console.log("tileStatus: ", message.tileStatus);
                if (isNaN(message.tileStatus)) { // Bomb found   
                    console.log("exploded")            
                    document.querySelector(`#${message.id}`).className = "cell exploded";
                    window.lost = true;
                    document.querySelector("#lose").style.display = "block"; // TODO: Change later
                } else {
                    document.querySelector(`#${message.id}`).className = `cell type${message.tileStatus}`;
                }
                break;
            case "revealCells": // Guaranteed not to be a bomb
                let currentCell;
                let data = JSON.parse(message.data);
                console.log(JSON.parse(message.data));
                for (let i = 0; i < data.length; i++) {
                    currentCell = document.querySelector(`#cell${data[i].key}`);
                    if (currentCell.className === "cell flagged") {
                        console.log("misflag!!");
                    }
                    currentCell.className = currentCell.className === "cell flagged" ? "cell misflag" : `cell type${data[i].value}`;
                }
                break;
            case "generatedBoard":
                document.querySelector("#win").style.display = "none"; // TODO: Change later
                document.querySelector("#lose").style.display = "none"; // TODO: Change later
                window.lost = false;
                window.won = false;
                window.rows = message.rows;
                window.columns = message.columns;
                window.mines = message.mines;
                
                const reference = document.querySelector("#game");
                reference.innerHTML = "";
                
                // Mines left text
                const minesLeftNode = document.createElement("div");
                minesLeftNode.innerHTML = "Mines left: " + window.mines;
                minesLeftNode.id = "minecounter";
                reference.insertBefore(minesLeftNode, null);
                
                // New line after mines left text
                const tempNode = document.createElement("div");
                tempNode.className = "clear";
                reference.insertBefore(tempNode, null);
                
                // Generate the game cells
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
                console.log("ws: ", message.ws); // Use this to determine who generated the new board
                break;
            case "win":
                console.log("You win");
                window.won = true;
                document.querySelector("#win").style.display = "block"; // TODO: Change later
                break;
            case "mouseMoved":
                let currentMouse;
                if (!document.querySelector(`#mouse${message.wsID}`)) { // Check if it's a new player
                    const newNode = document.createElement("div");
                    newNode.className = "mousepointer";
                    document.body.appendChild(newNode);
                    newNode.id = `mouse${message.wsID}`;
                }
                currentMouse = document.querySelector(`#mouse${message.wsID}`);
                currentMouse.style.left = parseInt(message.x) + message.scrollX - 10 + 'px'; // Offset for image
                currentMouse.style.top = parseInt(message.y) + message.scrollY - 2 + 'px';
                break;
            case "sendGames":
                document.getElementById('loader').style.display = "none";
                for (const game of message.games) {
                    const gameButton = document.createElement('button');
                    // TODO: On button hover, show who is in that room
                    gameButton.innerHTML = game.name;
                    document.getElementById('availablerooms').appendChild(gameButton);
                    gameButton.onclick = function() {
                        ws.send(JSON.stringify({type: 'joinedRoom', gameID: game.ID}));
                        window.gameName = game.name;
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
            case "unflag": // * Race condition if cell was already revealed?
                document.querySelector(`#${message.id}`).className = "cell closed";
                window.mines++;
                document.querySelector('#minecounter').innerHTML = "Mines left: " + window.mines;
                break;
            case "placeFlag": // * Race condition if cell was already revealed?
                document.querySelector(`#${message.id}`).className = "cell flag";
                window.mines--;
                document.querySelector('#minecounter').innerHTML = "Mines left: " + window.mines;
                break;
            default: 
                console.log("How did you get here" + message);
        } 
    });
}