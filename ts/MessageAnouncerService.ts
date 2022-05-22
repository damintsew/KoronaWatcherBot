import {User} from "./entity/User";
import {Equal, getManager} from "typeorm";
import {Announcements} from "./entity/Announcements";
import {Telegram} from "telegraf";

export class MessageAnouncerService {

    tg: Telegram;

    constructor(tg: Telegram) {
        this.tg = tg;
    }

    async announce() {
        const entityManager = getManager();
        const announcements = await entityManager.find(Announcements, { where: {isSent: false}});

        if (announcements.length == 0) {
            return;
        }

        const users = await entityManager.find(User);

        for(let a of announcements) {
            if (a.timeToSent < new Date()) {
                const messageText = a.text;
                for (let user of users) {

                    const userId = user.userId;
                    console.log("Sending message to user " + userId)
                    try {
                        await this.tg.sendMessage(userId, messageText)
                    }catch (e) {
                        console.log(e)
                    }
                }

                a.isSent = true;
                await entityManager.save(a);
            }
        }
    }

    async persistMessage() {
        const announsment = new Announcements();
        announsment.messageId = 7
        announsment.isSent = false;
        announsment.timeToSent = new Date('20 May 2022 12:00:00 GMT+0300');
        announsment.text = "Друзья! \nСайт Короны не доступен.\nУведомления будут приходить, когда сайт станет снова доступным.";

        const entityManager = getManager();
        try {
            await entityManager.save(announsment)
        } catch (e) {
            console.log(e)
        }
    }
}
