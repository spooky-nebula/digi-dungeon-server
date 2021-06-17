import PartyMember from "./party";
import Event from "./event";

export default class Shard {
    partyList: PartyMember[];
    map: Object;
    gamelog: Event[];
    getSimpleData(): SimpleShardData{
        let data = new SimpleShardData();
        data.gamelog = this.gamelog;
        data.partyList = this.partyList;
        return data;
    }

    constructor() {
        this.partyList = [];
        this.map = {};
        this.gamelog = [];
    }
}

export class SimpleShardData {
    partyList: PartyMember[];
    gamelog: Event[];

    constructor() {
        this.partyList = [];
        this.gamelog = [];
    }
}