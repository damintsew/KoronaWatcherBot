import {Api} from "@grammyjs/menu/out/deps.node";
import {Bot} from "grammy";
import {NewContext} from "../bot_config/Domain";
import {Service} from "typedi";
import {GlobalMessageAnnouncerService} from "./GlobalMessageAnnouncerService";

@Service()
export class SpreadBaseService {

    protected messageSender: GlobalMessageAnnouncerService

    constructor(messageSender: GlobalMessageAnnouncerService) {
        this.messageSender = messageSender;
    }
}
