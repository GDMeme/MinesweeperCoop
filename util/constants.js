import { BattleRoom } from "../server/room/BattleRoom.js";
import { CoopRoom } from "../server/room/CoopRoom.js";

export const directionArray = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

export const bigDirectionArray = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2], [-1, 2], [-2, 2], [-2, 1], [-2, 0], [-2, -1], [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2], [2, -1]];

// TODO why is this here? Its only used in server.js
export const WStoPlayerName = new Map(); // Maps client websocket to player name

export const roomTypes = {
    battle: BattleRoom,
    coop: CoopRoom
};