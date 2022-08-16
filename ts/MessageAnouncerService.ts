import {User} from "./entity/User";
import {Equal, getManager} from "typeorm";
import {Announcements} from "./entity/Announcements";
import {Telegram} from "telegraf";
import {ds} from "./data-source";

export class MessageAnouncerService {

    tg: Telegram;

    constructor(tg: Telegram) {
        this.tg = tg;
    }

    async announce() {
        const announcements = await ds.manager.find(Announcements, { where: {isSent: false}});

        if (announcements.length == 0) {
            return;
        }

        const users = await ds.manager.find(User);

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
                await ds.manager.save(a);
            }
        }
    }

    async persistMessage() {
        const messageId = 10;
        let existingMgs
        try {
            existingMgs = await ds.manager.find(Announcements, { where: {messageId: messageId}});
        } catch (e) {
            console.log(e)
        }

        if (existingMgs != null) {
            return
        }

        const announsment = new Announcements();
        announsment.messageId = messageId;
        announsment.isSent = false;
        announsment.timeToSent = new Date('17 Aug 2022 10:00:00 GMT+0300');
        announsment.text = "Друзья! \nЗолотая Корона перестала предоставлять информацию по Греции. Ваши подписки сохранены. Ждем дальнейших обнолений от ЗК." +
            "\nТакже наблюдаются проблемы с запросом данных по Израилю.\n\n" +
            "По проблемам, вопросам и предложениям по работе бота - пишите в группу https://t.me/KoronaWatcherSupportBot ";

        try {
            await ds.manager.save(announsment)
        } catch (e) {
            console.log(e)
        }
    }
}
