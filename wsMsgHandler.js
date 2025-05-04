import { generateBoard } from "./generateBoard.js";
import { setupBoard } from "./setupBoard.js";
import { removeProbabilities } from "./util/commonFunctions.js";

export function wsMsgHandler(ws) {
    window.ws = ws;
    console.log("connected to server"); 
    
    let timerTimeout = null;
    let countdownTimer = null;
    let countdownEnded = false;

    ws.addEventListener("message", (message) => {
        message = JSON.parse(message.data);
        if (message.type !== "mouseMoved") { 
            console.log("message: ", message); // No spamming logs.
        }
        switch (message.type) {
            case "teamUpdate": 
                // todo
                break;
            case "niceTry":
                console.log("lol");
                break;
            case "unReady":
                document.getElementById("readybutton").style.display = "inline-block";
                break;
            case "enableStartGameButton":
                document.getElementById("startgamebutton").style.display = "inline-block";
                break;
            case "gameProgress": {
                const game = message.safeGameData;
                setupBoard(game, timerTimeout, message.boardOwnerName);
                
                // Timer
                if (game.inProgress || game.firstClick) {
                    window.firstClick = false;
                    
                    // Initialize timer using startTime
                    const timerNode = document.getElementById("timer");
                    timerNode.innerHTML = `Time: ${Math.floor((new Date().getTime() - game.startTime) / 1000)}`;
                    timerTimeout = setTimeout(updateTimer, 1000); // Chill for 1 second cuz offset
                }
                
                // Populate cells with existing values
                for (const [cellCoordinates, tileStatus] of game.cellsRevealed) {
                    const [x, y] = cellCoordinates.split(",").map(e => parseInt(e));
                    
                    // Will only have tiles with numbers 0-8
                    document.querySelector(`#cell${x}_${y}`).className = `cell type${tileStatus}`;
                }
                
                for (const cellID of game.flaggedIDs) {
                    const x = cellID % window.columns;
                    const y = Math.floor(cellID / window.columns);
                    
                    document.querySelector(`#cell${x}_${y}`).className = "cell flag";
                }
                break;
            }
            case "battleWin":
                // TODO Update HTML, "${message.playerName} has won"
                // Current progress of board is saved, can click on something to continue playing later
            case "startGame": // Only for battle mode
                const gameData = message.safeGameData;
                generateBoard(parseInt(gameData.rows), parseInt(gameData.columns), parseInt(gameData.mines), false);
                
                
                countdownEnded = false;
                document.querySelector('#countdown').style.display = "block";
                document.querySelector('#countdown').innerHTML = 5;
                function updateCountdown() {
                    const timeLeft = message.startTime - Date.now();
                
                    if (timeLeft <= 0 && !countdownEnded) {
                        countdownEnded = true;
                        document.querySelector('#countdown').innerHTML = "";
                        console.log("countdown over");
                        window.noclicking = false;
                        return;
                    }
                
                    const secondsLeft = Math.ceil(timeLeft / 1000);
                    console.log("countdown number:", secondsLeft);
                    document.querySelector('#countdown').innerHTML = secondsLeft;
                
                    // Adapt timeout: check more frequently as we approach zero
                    let nextTimeout = 1000;
                    if (timeLeft < 2000) nextTimeout = 100;
                    if (timeLeft < 500) nextTimeout = 50;
                
                    countdownTimer = setTimeout(updateCountdown, nextTimeout);
                }
                
                countdownTimer = setTimeout(updateCountdown, 100);
            case "removePlayer":
                // Remove mouse from screen
                document.querySelector(`#mouse${message.wsID}`)?.remove();
                
                // Remove playername from player list
                window.playerList.splice(window.playerList.findIndex(e => e === message.playerName), 1);
                document.querySelector('#playerlist').innerHTML = window.playerList.join(", ");
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
                    for (const misFlagID of message.misFlags) {
                        const x = misFlagID % window.columns;
                        const y = Math.floor(misFlagID / window.columns);
                        document.querySelector(`#cell${x}_${y}`).className = "cell misflag";
                    }
                }
                
                window.noclicking = true;
                document.querySelector("#lose").style.display = "block"; // TODO: Change later
                break;
            case "revealCell": // Guaranteed not to be a bomb
                if (window.firstClick) {
                    window.firstClick = false;
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
                setupBoard(message.safeGameData, timerTimeout);    
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
                for (const room of message.rooms) {
                    const gameButton = document.createElement('button');
                    // TODO: On button hover, show who is in that room
                    gameButton.innerHTML = room.name;
                    document.getElementById('availablerooms').appendChild(gameButton);
                    gameButton.onclick = function() {
                        ws.send(JSON.stringify({type: 'joinedRoom', roomID: room.ID}));
                        window.roomName = room.name;
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
                document.querySelector('#minecounter').innerHTML = "Mines left: " + (window.mines - parseInt(message.numFlags));
                removeProbabilities();
                break;
            case "placeFlag": // * Race condition if cell was already revealed?
                document.querySelector(`#${message.id}`).className = "cell flag";
                document.querySelector('#minecounter').innerHTML = "Mines left: " + (window.mines - parseInt(message.numFlags));
                removeProbabilities();
                break;
            default: 
                console.log("How did you get here" + message);
        } 
    });
    
    const updateTimer = function () {
        // Only update timer if game is still in progress
        if (!window.noclicking) {
            const timerNode = document.querySelector('#timer');
            let currentSeconds = parseInt(timerNode.innerHTML.split(" ")[1]);
            currentSeconds++;
            timerNode.innerHTML = `Time: ${currentSeconds}`;
            timerTimeout = setTimeout(updateTimer, 1000);
        }
    }
}

