export class MinesweeperBoard {
    constructor({ rows, columns, mines, largeBoard = false }) {
        this.minePlacements = new Set();
        this.rows = rows;
        this.columns = columns;
        this.mines = mines;
        this.largeBoard = largeBoard;
        
        this.firstClick = true; // Cannot die on first click
        
        // TODO: Pre-calculate all cells so that it lags less on click
        this.cellsRevealed = new Map(); // Map so board state requests are less server-intensive
        this.flaggedIDs = new Set(); // * Keep this so I don't need to loop through all cells when revealing misflags
    }
    
    reset() {
        this.minePlacements.clear();
        this.firstClick = true;
        this.cellsRevealed.clear();
        this.flaggedIDs.clear();
    }
}
