import {LocalUser} from "../entity/LocalUser";
import {Announcements} from "../entity/Announcements";
import {ds} from "../data-source";
import {delay} from "../Util";
import {SendToUser} from "../entity/announcement/SendToUser";
import {Api} from "@grammyjs/menu/out/deps.node";
import {Service} from "typedi";
import {Bot} from "grammy";
import {NewContext} from "../bot_config/Domain";
import {UserDao} from "../dao/UserDao";
import {Other} from "grammy/out/core/api";

@Service()
export class GlobalMessageAnnouncerService {

    tg: Api;

    constructor(botApi: Bot<NewContext>, public userDao: UserDao) {
        this.tg = botApi.api;
    }

    async globalMessageAnnounce() {

        const announcements = await ds.getRepository(Announcements)
            .createQueryBuilder("ann")
            .leftJoinAndSelect("ann.sendToUser", "sent")
            .leftJoinAndSelect("sent.user", "userz")
            .where({isSent: false})
            .getMany()

        if (announcements.length == 0) {
            return;
        }

        const users = (await this.userDao.findUsersNotMarkedForDeletion())
            .filter(user => user.userId == 277970243);

        for (let a of announcements) {
            if (a.timeToSent < new Date()) {

                const messageText = a.text;
                for (let user of users) {

                    if (this.messageAlreadySent(a.sendToUser, user.userId)) {
                        console.log(`Message to user ${user.userId} already sent`)
                        continue;
                    }

                    console.log(`Sending message to user ${user.userId}`)
                    try {
                        await this.sendMessage(user, messageText)
                    } catch (e) {
                        console.log(e)
                    }

                    const sent = new SendToUser()
                    sent.user = user
                    sent.announcement = a
                    sent.date = new Date()

                    a.sendToUser.push(sent)
                    await ds.getRepository(SendToUser).save(sent)
                    // await ds.manager.save(a);

                    await delay(250)
                }

                a.isSent = true;
                await ds.manager.save(a);
            }
        }
    }

    async persistMessage() {
        const messageId = 32;
        let existingMgs
        try {
            existingMgs = await ds.manager.findOne(Announcements, {where: {messageId: messageId}});
        } catch (e) {
            console.log(e)
        }

        if (existingMgs != null) {
            return
        }

        const announsment = new Announcements();
        announsment.messageId = messageId;
        announsment.isSent = false;
        announsment.timeToSent = new Date('9 Oct 2022 09:59:00 GMT+0300');
        announsment.text = "Оплата прошла успешно! \n\n" +
            "Проверьте работу системы. В случае проблем - пишите в /support\n"
        try {
            await ds.manager.save(announsment)
        } catch (e) {
            console.log(e)
        }
    }

    private messageAlreadySent(sentMessages: SendToUser[], userId: number) {
        return sentMessages.some(m => m.user.userId == userId)
    }

    async sendMessage(user: LocalUser, message: string, other?: Other<any, "sendMessage", "chat_id" | "text">) {
        return this.tg.sendMessage(user.userId, message, other)
            .catch(reason => {
                if (reason.error_code == 403) {
                    user.deletionMark = true
                }
                return this.userDao.updateUser(user)
            });
    }
}
