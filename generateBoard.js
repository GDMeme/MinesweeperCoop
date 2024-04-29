export function generateBoard() {
    window.rows = parseInt(document.querySelector('#customrows').value);
    window.columns = parseInt(document.querySelector('#customcolumns').value);
    window.mines = parseInt(document.querySelector('#custommines').value);
    
    if (window.rows * window.columns <= mines || isNaN(window.rows) || isNaN(window.columns) || isNaN(mines)) { // Not possible to generate board
        // TODO: Add some HTML here to tell user
        console.log("Bad input");
        return;
    }
    
    console.log("sending message to generate board")
    window.ws.send(JSON.stringify({type: 'generateBoard', rows: window.rows, columns: window.columns, mines})); // wait for response before changing HTML
}