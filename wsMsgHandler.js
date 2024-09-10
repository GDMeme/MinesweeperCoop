import { setupBoard } from "./setup.js";
import { removeProbabilities } from "./util/commonFunctions.js";

export function wsMsgHandler(ws) {
    window.ws = ws;
    console.log("connected to server"); 
    
    let timerTimeout = null;

    ws.addEventListener("message", (message) => {
        message = JSON.parse(message.data);
        if (message.type !== "mouseMoved") { 
            console.log("message: ", message); // No spamming logs.
        }
        switch (message.type) {
            case "niceTry":
                console.log("lol");
                break;
            case "battleWin":
                // TODO Update HTML, "${message.playerName} has won"
                // Current progress of board is saved, can click on something to continue playing later
            case "startGame": // Only for battle mode
                let countdownTimer;
                document.querySelector('#countdown').innerHTML = 5;
                function updateCountdown() {
                    if (message.startTime < new Date().getTime() + 100) {
                        // Start polling now
                        while (message.startTime > new Date().getTime()) { }
                        
                        document.querySelector('#countdown').innerHTML = "";
                        console.log("countdown over");
                        window.noclicking = false;
                        clearTimeout(countdownTimer);
                    } else {
                        console.log("countdown number: ", Math.ceil((message.startTime / new Date().getTime()) / 1000));
                        document.querySelector('#countdown').innerHTML = Math.ceil((message.startTime / new Date().getTime()) / 1000);
                    }
                }
                countdownTimer = setTimeout(updateCountdown, 100);
            case "removePlayer":
                // Remove mouse from screen
                document.querySelector(`#mouse${message.wsID}`)?.remove();
                
                // Remove playername from player list
                window.playerList.splice(window.playerList.findIndex(e => e === message.playerName), 1);
                break;
            case "revealMinesMisflags": // This is called when the game is lost
                // Reveal mines
                for (const cellID of message.minePlacements) {
                    const x = cellID % window.columns;
                    const y = Math.floor(cellID / window.columns);
                    const currentCell = document.querySelector(`#cell${x}_${y}`);
                    if (cellID === message.deathCellID) {
                        currentCell.className = "cell exploded";
                    } else if (currentCell.className !== "cell flag") {
                        document.querySelector(`#cell${x}_${y}`).className = "cell mine";
                    }
                }
                
                // Reveal misflags
                if (message.misFlags.length > 0) {
                    console.log("message.misFlags: ", message.misFlags)
                    for (const misFlag of message.misFlags) {
                        const [x, y] = misFlag.split(",").map(e => parseInt(e));
                        document.querySelector(`#cell${x}_${y}`).className = "cell misflag";
                    }
                }
                
                window.noclicking = true;
                document.querySelector("#lose").style.display = "block"; // TODO: Change later
                break;
            case "revealCell": // Guaranteed not to be a bomb
                if (window.firstClick) { // * Does this need to be atomic?
                    window.firstClick = false;
                    const updateTimer = function () {
                        if (!window.noclicking) {
                            const timerNode = document.querySelector('#timer');
                            let currentSeconds = parseInt(timerNode.innerHTML.split(" ")[1]);
                            currentSeconds++;
                            timerNode.innerHTML = `Time: ${currentSeconds}`;
                            timerTimeout = setTimeout(updateTimer, 1000);
                        }
                    }
                    timerTimeout = setTimeout(updateTimer, 1000); // Chill for 1 second cuz offset
                }
                removeProbabilities();
                document.querySelector(`#${message.id}`).className = `cell type${message.tileStatus}`;
                break;
            case "revealCells": // Guaranteed not to be a bomb
                removeProbabilities();            
                for (const {key, value} of message.data) {
                    document.querySelector(`#cell${key}`).className = `cell type${value}`;
                }
                break;
            case "generatedBoard":
                console.log("message is: ", message);
                document.querySelector("#win").style.display = "none"; // TODO: Change later
                document.querySelector("#lose").style.display = "none"; // TODO: Change later
                
                delete message.boardOwnerName; // TODO: This is the name of the person who generated the new board 
                
                Object.assign(window, message.game); // This assigns rows, columns, mines, largeBoard
                window.firstClick = true;
                
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
                
                // Timer text
                clearTimeout(timerTimeout);
                
                const timerNode = document.createElement("div");
                timerNode.innerHTML = "Time: 0";
                timerNode.id = "timer";
                reference.insertBefore(timerNode, null);
                
                // Generate the game cells
                for (let i = 0; i < window.rows; i++) {
                    for (let j = 0; j < window.columns; j++) {
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
                setupBoard();
                break;
            case "win":
                console.log("You win");
                window.noclicking = true;
                document.querySelector("#win").style.display = "block"; // TODO: Change later
                document.querySelector('#minecounter').innerHTML = "Mines left: 0";
                document.querySelector('#timer').innerHTML = "Time: " + message.secondsPassed + "seconds";
                // Replace all mine positions with flags
                for (const flagID of message.minePlacements) {
                    const x = flagID % window.columns;
                    const y = Math.floor(flagID / window.columns);
                    document.querySelector(`#cell${x}_${y}`).className = "cell flag";
                }
                break;
            case "mouseMoved":
                if (!document.querySelector(`#mouse${message.wsID}`)) { // Check if it's a new player
                    // Create the mouse pointer image
                    let newNode = document.createElement("div");
                    newNode.className = "mousepointer";
                    document.body.appendChild(newNode);
                    newNode.id = `mouse${message.wsID}`;
                    
                    // Create the mouse pointer name
                    newNode = document.createElement("div");
                    newNode.className = "mousename";
                    document.body.appendChild(newNode);
                    newNode.id = `mousename${message.wsID}`;
                    newNode.innerHTML = message.name;
                }
                const currentMouse = document.querySelector(`#mouse${message.wsID}`);
                const currentMouseName = document.querySelector(`#mousename${message.wsID}`);
                const mouseX = parseInt(message.x) + message.scrollX - 10 + 'px';
                const mouseY = parseInt(message.y) + message.scrollY - 2 + 'px'
                const mouseNameX = parseInt(message.x) + message.scrollX - 8 + 'px';
                const mouseNameY = parseInt(message.y) + message.scrollY - 17 + 'px'
                currentMouse.style.transform = `translate(${mouseX}, ${mouseY})`;
                currentMouseName.style.transform = `translate(${mouseNameX}, ${mouseNameY})`;
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
                document.querySelector('#minecounter').innerHTML = "Mines left: " + (window.mines - message.numFlags);
                break;
            case "placeFlag": // * Race condition if cell was already revealed?
                document.querySelector(`#${message.id}`).className = "cell flag";
                document.querySelector('#minecounter').innerHTML = "Mines left: " + (window.mines - message.numFlags);
                break;
            default: 
                console.log("How did you get here" + message);
        } 
    });
}