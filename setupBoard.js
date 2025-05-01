import { cellmouseenter, cellmouseout, cellmouseup } from "./mouseEvents.js";

// TODO: This is the name of the person who generated the new xboard 
export function setupBoard(game, timerTimeout, boardOwnerName) {
    document.querySelector("#win").style.display = "none"; // TODO: Change later
    document.querySelector("#lose").style.display = "none"; // TODO: Change later
    
    console.log("game is: ", game);
    const { rows, columns, mines, largeBoard } = game;
    Object.assign(window, { rows, columns, mines, largeBoard });
    
    window.firstClick = true;
    window.noclicking = false;
    
    document.querySelector("#customrows").value = game.rows;
    document.querySelector("#customcolumns").value = game.columns;
    document.querySelector("#custommines").value = game.mines;
    
    const reference = document.querySelector("#game");
    reference.innerHTML = "";
    
    // Mines left text
    const minesLeftNode = document.createElement("div");
    console.log("mines: ", window.mines);
    console.log("game.flaggedIDs.length: ", game.flaggedIDs.length ?? 0);
    minesLeftNode.innerHTML = "Mines left: " + (window.mines - (game.flaggedIDs.length ?? 0));
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