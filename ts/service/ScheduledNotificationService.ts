import {Telegram} from "telegraf";
import {KoronaDao} from "../KoronaDao";
import {ds} from "../data-source";
import {SubscriptionScheduledData} from "../entity/SubscriptionScheduledData";
import {SubscriptionService} from "./SubscriptionService";
import {ThresholdNotificationService} from "./ThresholdNotificationService";
import moment, {ISO_8601} from "moment-timezone";


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
        await this.processCountry("ISR")
        // await this.processCountry("GRC")
    }

    private async processCountry(countryCode: string) {
        const date = moment.tz('Turkey')

        if (date.isoWeekday() >= 6) {
            return;
        }

        const currentHour = date.hours()
        const subscriptions = await this.subscriptionService.getScheduledSubscriptionsByCountryAndHour(countryCode, currentHour);

        let newValue: number;
        if (subscriptions.length > 0) {
            newValue = await KoronaDao.call(countryCode);
        }

        for (let subscription of subscriptions) {
            console.log(subscription)
            if (subscription.lastNotifiedValue == null) {
                subscription.lastNotifiedValue = newValue;
            }

            let difference = this.calculateDifference(subscription.lastNotifiedValue, newValue);
            console.log(`!!!!Country=${subscription.country} UserId = ${subscription.user.userId} newValue = ${newValue} lastNotifiedValue = ${subscription.lastNotifiedValue} ` +
                `difference is : ${difference}`)

            await this.notifyUser(countryCode, subscription.user.userId, subscription.lastNotifiedValue, newValue);
            subscription.lastNotifiedValue = newValue;
            await ds.manager.getRepository(SubscriptionScheduledData)
                .update(subscription.id, {lastNotifiedValue : newValue})
        }
    }

    private async notifyUser(countryCode: string, userId: number, oldValue: number, newValue: number) {
        const sign = ScheduledNotificationService.getSign(newValue, oldValue);
        const flag = ThresholdNotificationService.mapCountryToFlag(countryCode);
        const text = `${flag} ${sign} 1$ = ${newValue}`
        console.log("Sending message to user " + userId)
        try {
            await this.tg.sendMessage(userId, text)
        } catch (e) {
            console.log(e)
        }
    }

    private static getSign(newValue: number, oldValue: number) {
        if (newValue === oldValue) {
            return "↔️"
        }
        return newValue > oldValue ? "⬆️" : "⬇️";
    }

    private calculateDifference(currentValue: number, newValue: number): number {
        const absDifference = Math.abs(newValue - currentValue) * 100;
        return Math.round(absDifference);
    }

    public static mapCountryToFlag(countryCode: string) {
        const map = {
            GEO: '🇬🇪',
            TUR: '🇹🇷',
            ISR: '🇮🇱',
            GRC: '🇬🇷'
        }
        return map[countryCode];
    }
}
