export class MinesweeperGame {
    constructor() {
        this.name; // Name of the game room
        this.ID;
        this.minePlacements = new Set();
        this.rows;
        this.columns;
        this.mines; 
        this.firstClick = true; // Cannot die on first click
        
        // TODO: Pre-calculate all cells so that it lags less on click
        this.cellsRevealed = new Map(); // Map so board state requests are less server-intensive
        
        // If board is generated but no clicks, not in progress
        this.inProgress = false; // To determine if clients can still click
        this.wsPlayers = []; // 0th index is the host
        this.flaggedIDs = new Set(); // * Keep this so I don't need to loop through all cells when revealing misflags
        this.largeBoard;
        
        // If battleMode enabled
        this.battleMode; // Boolean
        this.games = []; // Contains each player's game
        this.wsToGamesIndex = new Map(); // Contains the index of each player's game
        this.startTime; // Milliseconds since Jan 1, 1970
        this.playersReady = []; // Boolean array, same indexes as wsPlayers
    }
}
