import {RollData} from "./util/diceRolling";
import DrawingLine from "./map/drawingLine";

export default class Event {
    name: string;
    sender: string;

    constructor(name: string, sender: string) {
        this.name = name;
        this.sender = sender;
    }
}

export class DiceRollEvent extends Event {
    roll: RollData;

    constructor(sender: string) {
        super("roll-dice", sender);
        this.roll = new RollData();
    }
}

export class ChatMessageEvent extends Event {
    text: string;

    constructor(sender: string) {
        super("chat-text", sender);
        this.text = "";
    }
}

export class DrawingAddEvent extends Event {
    finishedLine: DrawingLine;

    constructor(sender: string) {
        super("drawing-add", sender);
        this.finishedLine = new DrawingLine();
    }
}

export class DrawingClearEvent extends Event {
    all: boolean;

    constructor(sender: string) {
        super("drawing-clear", sender);
        this.all = true;
    }
}

export class DrawingUndoEvent extends Event {
    constructor(sender: string) {
        super("drawing-undo", sender);
    }
}