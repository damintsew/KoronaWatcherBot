import {Api} from "@grammyjs/menu/out/deps.node";


export class SpreadBaseService {

    protected tg: Api

    constructor(tg: Api) {
        this.tg = tg;
    }
}
