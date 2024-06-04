import { directionArray } from "../util/constants";

// * Just generate probabilities for all cells every time
export function generateProbability(game) {
    // Reset old probability values
    // TODO: This should only run if old probability values exist
    for (let i = 0; i < game.mineGrid.length; i++) {
        for (let j = 0; j < game.mineGrid[i].length; j++) {
            game.mineGrid[i][j].mineArr = 0;
            game.mineGrid[i][j].probability = -1;
        }
    }
    game.hundredCount = 0;
    game.arrGrid = [];
    game.edgeArr = [];  
    
    // * This function updates mineGrid[i][j].edge (boolean) (is it next to a closed tile) and mineGrid[i][j].edgeCount (integer) (number of tiles next to it that are closed)
    edgeCount(game.mineGrid)
}

// Label cells that border open cells and count how many "edges" are next to each cell
function edgeCount(mineGrid) {
    
}