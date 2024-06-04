export class Cell {
    constructor() {
        this.mine = false;
        this.open = false;
        this.neighbours = 0;
        this.flag = false;
        this.edge = false;
        this.edgeCount = 0;
        this.mineArr = 0;
        this.probability = -1;
    }   
}