import {Service} from "typedi";
import {UserDao} from "../dao/UserDao";
import {Api} from "@grammyjs/menu/out/deps.node";
import {Bot} from "grammy";
import {NewContext} from "../bot_config/Domain";

@Service()
export class AdminNotificationService {

    constructor(
        public userDao: UserDao,
        public botApi: Bot<NewContext>
    ) {
    }

    async notifyAdmins(userId: number, pendingTx: string) {
        const admins = await this.userDao.getAdmins()
        for (const admin of admins) {
            await this.botApi.api.sendMessage(admin.userId, `Awaiting new payment: ${pendingTx} from UserId = ${userId}`)
        }
    }
}
