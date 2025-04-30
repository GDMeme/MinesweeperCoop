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
    
    // check if not possible to generate board
    if (rows * columns <= mines || isNaN(rows) || isNaN(columns) || isNaN(mines)) {
        // TODO: Add some HTML here to tell client
        console.log("Bad input");
        return;
    }
    
    if (document.querySelector('#battlecheckbox').checked) {
        document.querySelector('#readybutton').style.display = "inline-block";
    }
    
    if (document.querySelector('#disablechordcheckbox').checked) {
        window.chording = false;
    }
    
    // If in battle mode, cannot start clicking early
    window.noclicking = document.querySelector('#battlecheckbox').checked;
    
    window.ws.send(JSON.stringify({type: 'generateBoard', rows, columns, mines, largeBoard, battleMode: window.noclicking}));
}