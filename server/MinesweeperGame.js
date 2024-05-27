export class MinesweeperGame {
    constructor() {
        this.name; // Name of the game room
        this.ID; // * Still need this property?
        this.minePlacements = new Set();
        this.rows;
        this.columns;
        this.mines; 
        this.firstClick = true; // Cannot die on first click
        this.cellsRevealed = new Set();
        this.lost = false;
        this.wsPlayers = [];
        this.flaggedIDs = new Set();
        this.largeBoard;
        this.startTime; // Milliseconds since Jan 1, 1970
    }
}
