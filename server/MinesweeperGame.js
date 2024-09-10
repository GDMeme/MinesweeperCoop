export class MinesweeperGame {
    constructor() {
        this.name; // Name of the game room
        this.ID;
        this.minePlacements = new Set();
        this.rows;
        this.columns;
        this.mines; 
        this.firstClick = true; // Cannot die on first click
        this.cellsRevealed = new Map(); // Map so board state requests are less server-intensive
        this.lost = false;
        this.wsPlayers = []; // 0th index is the host
        this.flaggedIDs = new Set(); // * Keep this so I don't need to loop through all cells when revealing misflags
        this.largeBoard;
        
        // If battleMode enabled
        this.battleMode;
        this.games = []; // Contains each player's game
        this.wsToGamesIndex = new Map(); // Contains the index of each player's game
        this.startTime; // Milliseconds since Jan 1, 1970
        this.playersReady = []; // Boolean array, same indexes as wsPlayers
    }
}
