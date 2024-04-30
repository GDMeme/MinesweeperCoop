export class MinesweeperGame {
    constructor() {
        this.minePlacements = new Set();
        this.rows;
        this.columns;
        this.mines; 
        this.firstClick = true; // Cannot die on first click
        this.cellsRevealed = new Set();
        this.lost = false;
        this.wsPlayers = [];
    }
}
