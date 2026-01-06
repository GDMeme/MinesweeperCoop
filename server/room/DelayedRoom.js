import { BaseRoom } from './BaseRoom.js';

export class DelayedRoom extends BaseRoom {
    constructor(roomId, wsPlayers = [], roomName) {
        super(roomId, wsPlayers, roomName);

        this.type = "delayed";
        this.cellsToReveal = new Set(); // Since the server needs to keep track
        
        // Will be a MinesweeperBoard object
        this.board;
    }
    
    reset() {
        this.inProgress = true; // Should be true, only false when game ends
        this.startTime = null;
    }
    
    allowClicks() {
        return this.inProgress;
    }
    
    findBoardFromWS(ws) {
        return this.board;
    }
    
    // In delayed room, send to all
    sendMessage(message) {
        this.wsPlayers.forEach(ws =>
            ws.send(JSON.stringify(message))
        );
    }
    
    removePlayer(ws) {
        return;
    }
    
    sendWin(message, ws) {
        this.sendMessage(message);
    }
}