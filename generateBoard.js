export function generateBoard() {
    window.rows = parseInt(document.querySelector('#customrows').value);
    window.columns = parseInt(document.querySelector('#customcolumns').value);
    window.mines = parseInt(document.querySelector('#custommines').value);
    window.largeBoard = document.querySelector('#largeboard').checked;

    if (window.rows > 100) {
        window.rows = 100;
    }
    if (window.columns > 100) {
        window.columns = 100;
    }
    
    if (window.rows * window.columns <= window.mines || isNaN(window.rows) || isNaN(window.columns) || isNaN(window.mines)) { // Not possible to generate board
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
    window.ws.send(JSON.stringify({type: 'generateBoard', rows: window.rows, columns: window.columns, mines: window.mines, largeBoard: window.largeBoard, battleMode: window.noclicking})); // wait for response before changing HTML
}