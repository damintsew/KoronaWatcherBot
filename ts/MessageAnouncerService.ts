import {LocalUser} from "./entity/LocalUser";
import {Equal, getManager} from "typeorm";
import {Announcements} from "./entity/Announcements";
import {Telegram} from "telegraf";
import {ds} from "./data-source";
import {delay} from "./Util";
import {SendToUser} from "./entity/announcement/SendToUser";
import {Api} from "@grammyjs/menu/out/deps.node";

export class MessageAnouncerService {

    tg: Api;

    constructor(tg: Api) {
        this.tg = tg;
    }

    async announce() {

        const announcements = await ds.getRepository(Announcements)
            .createQueryBuilder("ann")
            .leftJoinAndSelect("ann.sendToUser", "sent")
            .leftJoinAndSelect("sent.user", "userz")
            .where({ isSent: false })
            .getMany()

        if (announcements.length == 0) {
            return;
        }

        const users = await ds.manager.find(LocalUser);

        for (let a of announcements) {
            if (a.timeToSent < new Date()) {

                const messageText = a.text;
                for (let user of users) {

                    if (this.messageAlreadySent(a.sendToUser, user.userId)) {
                        console.log(`Message to user ${user.userId} already sent`)
                        continue;
                    }

                    const userId = user.userId;
                    console.log(`Sending message to user ${userId}`)
                    try {
                        await this.tg.sendMessage(userId, messageText)
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

                    await delay(200)
                }

                a.isSent = true;
                await ds.manager.save(a);
            }
        }
    }

    async persistMessage() {
        const messageId = 23;
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
        announsment.text = "Друзья! \n" +
            "Добавлены 🇲🇩 Молдова / 🇹🇯Таджикистан / 🇰🇬Киргизия / 🇦🇿Азербайджан / 🇰🇷Корея и 🇧🇾Белоруссия.\n" +
            "Теперь все страны, которые доступны на сайте доступны для подписки. Если команда /rates стала не читаемая " +
            "и надо добавить названия тран, то напишите мне в /support\n" +
            "В процессе работа по получению данных по другим валютам\n" +
            "Всем спасибо!🕊🕊🕊\n\n" +
            "По проблемам, вопросам и предложениям по работе бота - пишите в группу https://t.me/KoronaWatcherSupportBot ";

        try {
            await ds.manager.save(announsment)
        } catch (e) {
            console.log(e)
        }
    }

    private messageAlreadySent(sentMessages: SendToUser[], userId: number) {
        return sentMessages.some( m => m.user.userId == userId)
    }
}
