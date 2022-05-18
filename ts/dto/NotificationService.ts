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

        const subscriptions = await this.getSubscriptions();
        for (let subscription of subscriptions) {

            if (subscription.lastNotifiedValue == null) {
                subscription.lastNotifiedValue = newValue;
                await getManager().getRepository(SubsriptionData).save(subscription)
            }

            let difference = this.calculateDifference(subscription.lastNotifiedValue, newValue);
            console.log(`UserId = ${subscription.user.userId} difference is : ${difference} threshold = ${subscription.notificationThreshold}`)
            if (difference == null) {
                return;
            }

            if (difference >= subscription.notificationThreshold) {
                this.notifyUser(subscription.user.userId, subscription.lastNotifiedValue, newValue);
                subscription.lastNotifiedValue = newValue;
                await getManager().getRepository(SubsriptionData).save(subscription)
            }
        }
        this.previousStoredValue = newValue
    }

    private notifyUser(userId: number, oldValue: number,  newValue: number) {
        const sign = newValue > oldValue ? "⬆️" : "⬇️";
        const text = `${sign} 1$ = ${newValue}`
        console.log("Sending message to user " + userId)
        this.tg.sendMessage(userId, text)
    }

    private async getSubscriptions() {
        const entityManager = getManager();
        return entityManager.find(SubsriptionData, {
            // where: {notificationThreshold: LessThanOrEqual(difference)},
            relations: ["user"]
        });
    }

    private calculateDifference(currentValue: number, newValue: number): number {
        const absDifference = Math.abs(newValue - currentValue) * 100;
        return Math.round(absDifference);
    }
}
