import {Equal, In} from "typeorm";
import {SubscriptionData} from "../entity/SubscriptionData";
import {Telegram} from "telegraf";
import {KoronaDao} from "../KoronaDao";
import {ds} from "../data-source";
import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {SubscriptionScheduledData} from "../entity/SubscriptionScheduledData";
import {SubscriptionService} from "./SubscriptionService";
import {ThresholdNotificationService} from "../dto/ThresholdNotificationService";


export class ScheduledNotificationService {

    tg: Telegram;
    subscriptionService: SubscriptionService

    constructor(tg: Telegram, subscriptionService: SubscriptionService) {
        this.tg = tg;
        this.subscriptionService = subscriptionService;
    }

    async process() {
        await this.processCountry("TUR")
        await this.processCountry("GEO")
    }

    private async processCountry(countryCode: string) {
        const newValue = await KoronaDao.call(countryCode);
        const currentHour = new Date().getHours()

        const subscriptions = await this.subscriptionService.getScheduledSubscriptionsByCountryAndHour(countryCode, currentHour);
        for (let subscription of subscriptions) {
            console.log(subscription)
            // if (subscription.lastNotifiedValue == null) {
                subscription.lastNotifiedValue = newValue;
                // await ds.manager.getRepository(SubscriptionScheduledData).save(subscription)
            // }

            let difference = this.calculateDifference(subscription.lastNotifiedValue, newValue);
            console.log(`!!!!Country=${subscription.country} UserId = ${subscription.user.userId} newValue = ${newValue} lastNotifiedValue = ${subscription.lastNotifiedValue} ` +
                `difference is : ${difference}`)

            await this.notifyUser(countryCode, subscription.user.userId, subscription.lastNotifiedValue, newValue);
            subscription.lastNotifiedValue = newValue;
            await ds.manager.getRepository(SubscriptionScheduledData).save(subscription)
        }
    }

    private async notifyUser(countryCode: string, userId: number, oldValue: number, newValue: number) {
        const sign = newValue > oldValue ? "⬆️" : "⬇️";
        const flag = ThresholdNotificationService.mapCountryToFlag(countryCode);
        const text = `${flag} ${sign} 1$ = ${newValue}`
        console.log("Sending message to user " + userId)
        try {
            await this.tg.sendMessage(userId, text)
        } catch (e) {
            console.log(e)
        }
    }

    private calculateDifference(currentValue: number, newValue: number): number {
        const absDifference = Math.abs(newValue - currentValue) * 100;
        return Math.round(absDifference);
    }

    public static mapCountryToFlag(countryCode: string) {
        const map = {
            GEO: '🇬🇪',
            TUR: '🇹🇷'
        }
        return map[countryCode];
    }
}
