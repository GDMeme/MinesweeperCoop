export function coordinateOutOfBounds(coordinate, rows, columns) {
    return (coordinate[0] < 0 || coordinate[0] >= columns || coordinate[1] < 0 || coordinate[1] >= rows);
}

export function checkWin(game) { // * Only used by server, maybe move in server directory? idk
    if ((game.rows * game.columns) - game.cellsRevealed.size === game.minePlacements.size) { // Check if all cells revealed
        console.log("sending win");
        
        const secondsPassed = (new Date().getTime() - game.startTime) / 1000;
        
        for (const ws of game.wsPlayers) {
            ws.send(JSON.stringify({type: "win", minePlacements: Array.from(game.minePlacements), secondsPassed}));
        }
    }   
}

export function findGameIndex(games, ID) { // * Also only used by server
    for (let i = 0; i < games.length; i++) {
        if (games[i].ID === ID) {
            return i;
        }
    }
}

export function sendWSEveryone(WSPlayers, message) {
    for (const ws of WSPlayers) {
        ws.send(JSON.stringify(message));
    }
}