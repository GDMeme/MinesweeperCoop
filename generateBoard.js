export function generateBoard() {
    let rows = parseInt(document.querySelector('#customrows').value);
    let columns = parseInt(document.querySelector('#customcolumns').value);
    let mines = parseInt(document.querySelector('#custommines').value);
    
    if (rows * columns <= mines || isNaN(rows) || isNaN(columns) || isNaN(mines)) { // Not possible to generate board
        // TODO: Add some HTML here to tell user
        console.log("Bad input");
        return;
    }
    
    console.log("sending message to generate board")
    window.ws.send(JSON.stringify({type: 'generateBoard', rows, columns, mines})); // wait for response before changing HTML
}