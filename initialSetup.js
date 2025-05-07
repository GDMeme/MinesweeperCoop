import { cellmouseout, cellmouseup, cellmouseenter } from './mouseEvents.js';
import { generateBoard } from './generateBoard.js';
import { wsMsgHandler } from './wsMsgHandler.js';
import { connect } from './connect.js'; // * MAKE SURE THIS STAYS ON LINE 4
import { HTMLtoString } from './util/commonFunctions.js';
import { doAnalysis, dropHandler } from './solver/client/main.js';

export function initialSetup() {
    
    document.body.style.backgroundColor = "#121212";
    
    // Immediately try connecting to websocket
    connect(true).then(function(ws) {
    
        // Start 5 minute timer to spam reconnects every 5 minutes
        const tryNewWSConnection = function () {
            connect(false).then(function(ws) {
                console.log("Tried to make a new websocket connection");
                ws.close();
            });
            setTimeout(tryNewWSConnection, 300000); // 5 minutes
        }
        
        tryNewWSConnection();
    
        wsMsgHandler(ws);    
    }); 
    
    window.addEventListener("keydown", (event) => { // Regenerate board on spacebar keypress
        if (window.roomName !== null && event.key === " ") {
            const rows = parseInt(document.querySelector('#customrows').value);
            const columns = parseInt(document.querySelector('#customcolumns').value);
            const mines = parseInt(document.querySelector('#custommines').value);
            const largeBoard = document.querySelector('#largeboard').checked;
            generateBoard(rows, columns, mines, largeBoard);
            document.body.style.overflow = "auto";
        }
    });
    
    document.addEventListener("dragstart", (event) => {
        event.preventDefault();
    });
    
    document.addEventListener("mousedown", function(event) {
        if (event.button === 0) { // Left mouse button
            window.leftPressed = true;
        }
    });
    
    document.addEventListener("mouseup", function() {
        window.leftPressed = false;
    });
    
    let mouseMessageTimer = true;
    
    document.addEventListener("mousemove", function(event) {
        // Tab should be focused to track mouse movement
        if (window.ws && mouseMessageTimer && document.hasFocus() && window.roomName !== null) {
            ws.send(JSON.stringify({type: "mouseMove", x: event.x, y: event.y, scrollY: window.scrollY, scrollX: window.scrollX}));
            mouseMessageTimer = false;
            setTimeout(() => {
                mouseMessageTimer = true;    
            }, 20); // Wait 20ms before sending another mouseMove message
        } 
    });
    
    // You can press "enter" instead of the submit button when submitting your name
    document.getElementById(`playername`).addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById('submitplayername').click();
        }
    });
    
    document.querySelector('#submitplayername').onclick = function() {
        // TODO: Add verification that name cannot be blank
        document.querySelector('#playersetup').style.display = "none";
        document.querySelector('#roombuttons').style.display = "block";
        document.querySelector('#roombuttons').className = "setup";
        playerName = document.querySelector('#playername').value;
        
        ws.send(JSON.stringify({type: "newConnection", playerName}));
        
        // TODO: Turn this into a function
        window.playerList.push(window.playerName);
        document.querySelector('#players').style.display = "block";
        document.querySelector('#playerlist').innerHTML = window.playerList.join(", ");
    }
    
    document.querySelector('#createroom').onclick = function() {
        document.querySelector('#roombuttons').style.display = "none";
        document.querySelector('#roomsetup').style.display = "block";
        document.querySelector('#roomsetup').className = "setup";
    }
    
    document.querySelector('#joinroom').onclick = function() {
        document.getElementById('loader').style.display = "inline";
        document.querySelector('#roombuttons').style.display = "none";
        window.ws.send(JSON.stringify({type: 'requestGames'})); // Displays all available rooms to join
    }
    
    // You can press "enter" instead of the submit button when submitting your name
    document.getElementById('roomname').addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById('submitroomname').click();
        }
    });
    
    document.querySelector('#submitroomname').onclick = function() {
        window.roomName = document.querySelector('#roomname').value;
        document.querySelector('#roomsetup').style.display = "none";
        document.querySelector('#inputs').className = "table";
        
        // TODO: Empty room name results in a super tiny button
        window.ws.send(JSON.stringify({type: "createRoom", roomName: window.roomName}))
    }
    
    document.querySelector('#generateboard').onclick = function() {
        const rows = parseInt(document.querySelector('#customrows').value);
        const columns = parseInt(document.querySelector('#customcolumns').value);
        const mines = parseInt(document.querySelector('#custommines').value);
        const largeBoard = document.querySelector('#largeboard').checked;
        generateBoard(rows, columns, mines, largeBoard);
    }
    
    document.querySelector('#readybutton').onclick = function() {
        document.querySelector('#readybutton').style.display = "none";
        document.querySelector('#countdown').style.display = "block";
        window.ws.send(JSON.stringify({type: "ready"}));
    }
    
    document.querySelector('#startgamebutton').onclick = function() {
        // todo put this back
        // document.querySelector('#startgamebutton').style.display = "none";
        document.querySelector('#countdown').style.display = "none";
        window.ws.send(JSON.stringify({type: "startGame"}));
    }
    
    document.querySelector('#updategamemode').onclick = function() {
        const gamemode = document.querySelector("#battlecheckbox").checked ? "battle" : "coop";
        if (gamemode === "battle") {
            document.querySelector('#readybutton').style.display = "inline-block";
            document.querySelector('#jointeam1').style.display = "inline-block";
            document.querySelector('#jointeam2').style.display = "inline-block";
        }
        window.ws.send(JSON.stringify({type: "updateGamemode", gamemode}));
    }
    
    // * temp stuff
    // Team will be 0 indexed
    document.querySelector('#jointeam1').onclick = function() {
        window.ws.send(JSON.stringify({type: "joinTeam", team: 0}));
    }
    
    document.querySelector('#jointeam2').onclick = function() {
        window.ws.send(JSON.stringify({type:"joinTeam", team: 1}));
    }
    
    //* Probability Stuff
    document.getElementById("showprobabilities").addEventListener('click', async function() {
        const data = HTMLtoString(document.getElementById("game").children);
        window.stopProbabilities = false;
        await dropHandler(data);
        const bestMove = (await doAnalysis())[0];
        
        // If someone revealed/flagged a cell while probabilities were being calculated, don't show probabilities
        if (window.stopProbabilities) {
            return;
        }
        
        if (bestMove !== undefined) { // Check if board is fully solved
            if (bestMove.action === 1) { // Regular left click (clear)
                // Green
                document.getElementById(`cell${bestMove.x}_${bestMove.y}`).style.color = "#00FF00";
            } else if (bestMove.action === 2) { // Regular right click (flag) (will only show for Efficiency Playstyle I think)
                // Red
                document.getElementById(`cell${bestMove.x}_${bestMove.y}`).style.color = "#FF0000";
                // Maybe want to show the flag(s) and then the chord
            } else if (bestMove.action === 3) { // Chord
                // Immediately chord
                // Need some way to highlight to click here
            }
        }
    });
}