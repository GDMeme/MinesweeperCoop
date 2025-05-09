import { BaseRoom } from './BaseRoom.js';

export class CoopRoom extends BaseRoom {
    constructor(roomId, wsPlayers = [], roomName) {
        super(roomId, wsPlayers, roomName);

        this.type = "coop";
        
        // Will be a MinesweeperBoard object
        this.board;
    }
    
    allowClicks() {
        return this.inProgress;
    }
    
    findBoardFromWS() {
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
}