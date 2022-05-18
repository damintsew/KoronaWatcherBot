import {getManager, LessThanOrEqual} from "typeorm";
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
        let difference = this.calculateDifference(newValue);
        console.log("difference is :" + difference)
        if (difference == null) {
            return;
        }

        const subscriptions = await this.getSubscriptions(difference);
        for (let subscription of subscriptions) {
            const text = `Курс изменился. 1$ = ${newValue}`
            console.log("Sending message to user " + subscription.user.userId)
            this.tg.sendMessage(subscription.user.userId, text)
        }
        this.previousStoredValue = newValue
    }

    private async getSubscriptions(difference: number) {
        const entityManager = getManager();
        const subscriptions = await entityManager.find(SubsriptionData, {
            where: {notificationThreshold: LessThanOrEqual(difference)},
            relations: ["user"]
        });

        const subscriptionDataByUserId = new Map<number, SubsriptionData>();
        for (let s of subscriptions) {
            //filter out subscripton and left only smaller of this
            if (subscriptionDataByUserId.has(s.user.userId)) {
                let existingSubscription = subscriptionDataByUserId.get(s.user.userId);
                if (existingSubscription.notificationThreshold > s.notificationThreshold) {
                    subscriptionDataByUserId.set(s.user.userId, s);
                }
            } else {
                subscriptionDataByUserId.set(s.user.userId, s);
            }
        }

        return subscriptionDataByUserId.values();
    }

    private calculateDifference(newValue: number): number {
        if (this.previousStoredValue == null) {
            this.previousStoredValue = newValue;
            return;
        }

        const absDifference = Math.abs(newValue - this.previousStoredValue) * 100;
        return Math.round(absDifference);
    }
}
