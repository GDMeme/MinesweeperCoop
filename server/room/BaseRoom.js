export class BaseRoom {
    constructor(roomID, wsPlayers = [], roomName) {
        this.name = roomName;
        this.ID = roomID;
        this.wsPlayers = wsPlayers;
        this.wsToPlayersIndex = new Map(this.wsPlayers.map((ws,i) => [ws,i]));
        
        this.startTime; // Milliseconds since Jan 1, 1970
        this.inProgress = false;
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
}