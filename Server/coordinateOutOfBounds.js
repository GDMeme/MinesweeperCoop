export function coordinateOutOfBounds(coordinate, rows, columns) {
    return (coordinate[0] < 0 || coordinate[0] >= columns || coordinate[1] < 0 || coordinate[1] >= rows);
}