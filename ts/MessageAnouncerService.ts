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

                    if (this.alreadySent(user.userId)) {
                        continue
                    }

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
        announsment.messageId = 1
        announsment.isSent = false;
        announsment.timeToSent = new Date('09 May 2022 11:30:00 GMT+0300');
        announsment.text = "Доброго времени суток! \nВ бота добавлена возможность следить за курсами $ в 🇬🇪 Грузии!\n" +
         "Для получения уведомлений об изменении курса подпишитесь командой /subscribe ";

        const entityManager = getManager();
        try {
            await entityManager.save(announsment)
        } catch (e) {
            console.log(e)
        }
    }

    private alreadySent(userId: number) {
        if (userId == 152984728
        || userId == 39668525
        || userId == 428969298
        || userId == 850353
        || userId == 1611005847
        || userId == 279367242
        || userId == 270770349
        || userId == 322208263
        || userId == 244273492) {
            return true;
        }
    }
}
