import { BaseRoom } from './BaseRoom.js';
import { WStoPlayerName } from '../../util/constants.js';

export class BattleRoom extends BaseRoom {
    constructor(roomID, wsPlayers = [], roomName) {
        super(roomID, wsPlayers, roomName);
        
        this.type = "battle";
        
        this.teams = []; // Each team is its own array of websockets
        this.wsToTeamInfo = new Map(); // Map ws -> { teamIndex, playerIndex }
        
        this.boards = []; // Index mapped to each team
        this.ready  = []; // Mapped to individual player, not team
    }
    
    reset() { // Is only called when a new game starts
        this.boards = [];
        this.inProgress = true; // Should be true, only false when game ends
        this.startTime = null;
        this.ready = new Array(this.wsPlayers.length);
    }
    
    allowClicks() {
        return this.inProgress && this.startTime < new Date().getTime();
    }
    
    findBoardFromWS(ws) {
        return this.boards[this.wsToTeamInfo.get(ws).teamIndex];
    }
    
    // In battle room, send to the whole team
    sendMessage(message, ws) {
        const teamInfo = this.wsToTeamInfo.get(ws);
        if (!teamInfo) {
            console.log("teamInfo not found");
            console.log("message was: ", message);
            return;
        }
        this.teams[this.wsToTeamInfo.get(ws).teamIndex].forEach(ws => {
            ws.send(JSON.stringify(message));
        });
    }
    
    sendWin(message, ws) {
        const teamInfo = this.wsToTeamInfo.get(ws);
        if (!teamInfo) {
            console.log("teaminfo not found");
            console.log("message was: ", message);
            return;
        }
        
        const { teamIndex, playerIndex } = teamInfo;
        
        // Send message to team who won
        this.sendMessage(message, ws);
        
        // Send message to all teams that lost
        for (let i = 0; i < this.teams.length; i++) {
            if (i === teamIndex) {
                continue;
            }
            
            const playerList = this.teams[teamIndex].map(ws => WStoPlayerName.get(ws)).join(", ");
            
            this.sendMessage({type: "loss", teamIndex, playerList, secondsPassed: message.secondsPassed}, this.teams[i][0]);
        }
    }
    
    removePlayer(ws) {
        // Reset ready state
        this.ready = new Array(this.wsPlayers.length);
        
        const teamInfo = this.wsToTeamInfo.get(ws);
        
        if (!teamInfo) {
            console.log("no team info found");
            return;
        }
        
        const { teamIndex, playerIndex } = teamInfo;
        
        this.teams[teamIndex].splice(playerIndex, 1);
        
        // If team is now empty, remove it entirely
        if (this.teams[teamIndex].length === 0) {
            this.teams.splice(teamIndex, 1);

            // Rebuild wsToTeamInfo for all teams after this one
            for (let i = teamIndex; i < this.teams.length; i++) {
                for (let j = 0; j < this.teams[i].length; j++) {
                    this.wsToTeamInfo.set(this.teams[i][j], {
                        teamIndex: i,
                        playerIndex: j
                    });
                }
            }
        } else {
            // Otherwise, just rebuild this team's wsToTeamInfo
            const team = this.teams[teamIndex];
            for (let i = 0; i < team.length; i++) {
                this.wsToTeamInfo.set(team[i], {
                    teamIndex,
                    playerIndex: i
                });
            }
        }
        
        this.wsToTeamInfo.delete(ws);
    }
}