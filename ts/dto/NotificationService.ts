import {getManager, LessThanOrEqual} from "typeorm";
import {User} from "../entity/User";
import {SubsriptionData} from "../entity/SubsriptionData";
import {Telegram} from "telegraf";
import {KoronaDao} from "../KoronaDao";


export class NotificationService {

    previousStoredValue: number
    tg: Telegram;

    constructor(tg: Telegram) {
        this.tg = tg;
    }

    async process() {
        const newValue = await KoronaDao.call();
        const difference = this.calculateDifference(newValue);
        if (difference == null) {
            return;
        }

        const entityManager = getManager();
        console.log("difference is :" + difference)
        const subcriptions = await entityManager.find(SubsriptionData, {
            where: { notificationThreshold: LessThanOrEqual(difference) },
            relations: ["user"]
        });

        for (let subsription of subcriptions) {
            const text = `Курс изменился и теперь ${newValue}`
            const res = await this.tg.sendMessage(subsription.user.userId, text)
        }
        this.previousStoredValue = newValue
    }

    private calculateDifference(newValue: number): number {
        if (this.previousStoredValue == null) {
            this.previousStoredValue = newValue;
            return;
        }

        return Math.abs(newValue - this.previousStoredValue);
    }
}
