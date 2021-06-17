import {struct} from "../util"

export default class DrawingLine {
    origin: struct.Vector2;
    points: DrawingPoint[];
    colour: string;
    lineWidth: number;

    constructor() {
        this.origin = new struct.Vector2(0, 0);
        this.points = [];
        this.colour = 'black';
        this.lineWidth = 3;
    }
}

export class DrawingPoint extends struct.Vector2{
    // Needs performance testing to be implemented
    colour: string;
    width: number;

    constructor() {
        super(0, 0);
        this.colour = 'black';
        this.width = 3;
    }
}