import { BaseRoom } from './BaseRoom.js';

export class CoopRoom extends BaseRoom {
    constructor(roomId, wsPlayers = [], roomName) {
        super(roomId, wsPlayers, roomName);

        this.type = "coop";
        
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
    
    // In coop room, send to all
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