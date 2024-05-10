export class MinesweeperGame {
    constructor() {
        this.name; // Name of the game room
        this.ID;
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
    }
}
