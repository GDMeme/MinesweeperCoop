export function generateBoard(rows, columns, mines, largeBoard) {
    window.rows = rows;
    window.columns = columns;
    window.mines = mines;
    window.largeBoard = largeBoard;
    
    if (rows > 100) {
        rows = 100;
    }
    if (columns > 100) {
        columns = 100;
    }
    
    if (rows * columns <= mines || isNaN(rows) || isNaN(columns) || isNaN(mines)) { // Not possible to generate board
        // TODO: Add some HTML here to tell client
        console.log("Bad input");
        return;
    }
    
    if (document.querySelector('#battlecheckbox').checked) {
        document.querySelector('#readybutton').style.display = "inline-block";
    }
    
    // If in battle mode, cannot start clicking early
    window.noclicking = document.querySelector('#battlecheckbox').checked;
    
    console.log("sending message to generate board");
    window.ws.send(JSON.stringify({type: 'generateBoard', rows, columns, mines, largeBoard, battleMode: window.noclicking})); // wait for response before changing HTML
}