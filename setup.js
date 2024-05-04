import { cellmouseout, cellmouseup, cellmouseenter } from './mouseEvents.js';
import { generateBoard } from './generateBoard.js';
import { wsMsgHandler } from './wsMsgHandler.js';
import { connect } from './connect.js';

export function setupCells() { // * Does this function belong here? Little bit circular
    document.querySelectorAll(".cell").forEach(e => {
        e.addEventListener("mouseenter", cellmouseenter);
        e.addEventListener("mouseout", cellmouseout);
        e.addEventListener("mouseup", cellmouseup);
        e.addEventListener("contextmenu", function(event) {
            event.preventDefault();
        });
    });
};

export function initialSetup() {
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
    
    let timerFlag = true;
    
    document.addEventListener("mousemove", function(event) {
        if (window.ws && timerFlag && document.hasFocus() && window.gameName !== null) { // Tab should be focused to track mouse movement
            ws.send(JSON.stringify({type: "mouseMove", x: event.x, y: event.y, scrollY: window.scrollY, scrollX: window.scrollX}));
            timerFlag = false;
            setTimeout(() => {
                timerFlag = true;    
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
        
        // TODO: Turn this into a function
        window.playerList.push(window.playerName);
        document.querySelector('#players').style.display = "block";
        document.querySelector('#playerlist').innerHTML = window.playerList.join(", ");
        // Wait until player name is submitted before connecting to websocket
        connect().then(function(ws) {
            ws.send(JSON.stringify({type: "newConnection", playerName}));
            wsMsgHandler(ws);    
        });
    }
    
    document.querySelector('#createroom').onclick = function() {
        document.querySelector('#roombuttons').style.display = "none";
        document.querySelector('#roomsetup').style.display = "block";
        document.querySelector('#roomsetup').className = "setup";
    }
    
    document.querySelector('#joinroom').onclick = function() {
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
        
        // TODO: Empty room name results in a room name of "undefined"
        window.ws.send(JSON.stringify({type: "createRoom", gameName: window.gameName}))
    }
    
    document.querySelector('#generateboard').onclick = function() {
        generateBoard();
    }
}