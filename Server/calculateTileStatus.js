export function calculateTileStatus(minePlacements, currentX, currentY, rows, columns) {
    let directionArray = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    let tileStatus = 0;
    for (const [x, y] of directionArray) {
        const newCoordinate = [currentX + x, currentY + y];
        if (newCoordinate[0] < 0 || newCoordinate[0] >= columns || newCoordinate[1] < 0 || newCoordinate[1] >= rows) {
            continue;
        }
        const id = newCoordinate[1] * columns + newCoordinate[0];
        if (minePlacements.has(id)) {
            tileStatus++;
        }
    }
    console.log("returning tilestatus of " + tileStatus);
    return tileStatus;
}