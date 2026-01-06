export class BaseRoom {
    constructor(roomID, wsPlayers = [], roomName) {
        this.name = roomName;
        this.ID = roomID;
        this.type = "base";
        this.wsPlayers = wsPlayers;
        this.wsToPlayersIndex = new Map(this.wsPlayers.map((ws,i) => [ws,i]));
        
        this.startTime; // Milliseconds since Jan 1, 1970
        this.inProgress = false; // If a board is generated, it should count as in progress (for joining games in progress)
    }
    
    reset() {
        throw new Error("reset() must be implemented by subclass");
    }
    
    allowClicks() {
        throw new Error("allowClicks() must be implemented by subclass");
    }
    
    findBoardFromWS(ws) {
        throw new Error("findBoard(ws) must be implemented by subclass");
    }
    
    sendMessage(message, ws) {
        throw new Error("sendMessage() must be implemented by subclass");
    }
    
    sendWin(message, ws) {
        throw new Error("sendWin() must be implemented by subclass");
    }
}