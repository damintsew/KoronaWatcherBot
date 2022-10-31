import {Api} from "@grammyjs/menu/out/deps.node";
import {Bot} from "grammy";
import {NewContext} from "../bot_config/Domain2";
import {Service} from "typedi";

@Service()
export class SpreadBaseService {

    protected tg: Api

    constructor(botApi: Bot<NewContext>) {
        this.tg = botApi.api;
    }
}
