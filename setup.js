import { cellmouseout, cellmouseup, cellmouseenter } from './mouseEvents.js';
import { generateBoard } from './generateBoard.js';
import { wsMsgHandler } from './wsMsgHandler.js';
import { connect } from './connect.js';
import { HTMLtoString } from './util/commonFunctions.js';
import { doAnalysis, dropHandler, startup } from './solver/client/main.js';

export function setupBoard() { // * Does this function belong here? Little bit circular
    document.querySelectorAll(".cell").forEach(e => {
        e.addEventListener("mouseenter", cellmouseenter);
        e.addEventListener("mouseout", cellmouseout);
        e.addEventListener("mouseup", cellmouseup);
        
        // Prevent right click menu
        e.addEventListener("contextmenu", function(event) {
            event.preventDefault();
        });
    });
    
    // * Fine to put this here
    // Default display style
    document.querySelector('#showprobabilities').style.display = "inline-block";
};

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
        if (window.gameName !== null && event.key === " ") {
            generateBoard();
            document.body.style.overflow = "hidden";
        }
    });
    
    window.addEventListener("keyup", (event) => { // Regenerate board on spacebar keypress
        if (window.gameName !== null && event.key === " ") {
            generateBoard();
            document.body.style.overflow = "auto";
        }
    });
    
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
    
    let mouseMessageTimer = true;
    
    document.addEventListener("mousemove", function(event) {
        if (window.ws && mouseMessageTimer && document.hasFocus() && window.gameName !== null) { // Tab should be focused to track mouse movement
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
    document.getElementById('gamename').addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById('submitgamename').click();
        }
    });
    
    document.querySelector('#submitgamename').onclick = function() {
        window.gameName = document.querySelector('#gamename').value;
        document.querySelector('#roomsetup').style.display = "none";
        document.querySelector('#inputs').className = "table";
        
        // TODO: Empty room name results in a super tiny button
        window.ws.send(JSON.stringify({type: "createRoom", gameName: window.gameName}))
    }
    
    document.querySelector('#generateboard').onclick = function() {
        generateBoard();
    }
    
    document.querySelector('#readybutton').onclick = function() {
        document.querySelector('#readybutton').style.display = "none";
        document.querySelector('#countdown').style.display = "block";
        window.ws.send(JSON.stringify({type: "ready"}));
    }
    
    //* Probability Stuff
    document.getElementById("showprobabilities").addEventListener('click', async function() {
        const data = HTMLtoString(document.getElementById("game").children);
        if (!window.probabilityStartup) {
            await startup(window.rows, window.columns, window.mines);
            window.probabilityStartup = true;
        }
        
        await dropHandler(data);
        const bestMove = (await doAnalysis())[0];
        if (bestMove.action === 1) { // Regular left click (clear)
            // Green
            document.getElementById(`cell${bestMove.x}_${bestMove.y}`).style.color = "#00FF00";
        } else if (bestMove.action === 2) { // Regular right click (flag)
            // Red
            document.getElementById(`cell${bestMove.x}_${bestMove.y}`).style.color = "#FF0000";
            // Maybe want to show the flag(s) and then the chord
        } else if (bestMove.action === 3) { // Chord
            // Immediately chord
            // Need some way to highlight to click here
        }
    });
}