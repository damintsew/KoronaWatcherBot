import {KoronaDao} from "../KoronaDao";
import {ds} from "../data-source";
import {SubscriptionScheduledData} from "../entity/SubscriptionScheduledData";
import {SubscriptionService} from "./SubscriptionService";
import {countries, mapCountryToFlag} from "./FlagUtilities";
import moment from "moment-timezone";
import {Api} from "@grammyjs/menu/out/deps.node";

export class ScheduledNotificationService {

    tg: Api;
    subscriptionService: SubscriptionService

    constructor(tg: Api, subscriptionService: SubscriptionService) {
        this.tg = tg;
        this.subscriptionService = subscriptionService;
    }

    async process() {
        for (const country of countries) {
            if (country.isActive) {
                await this.processCountry(country.code)
            }
        }
    }

    private async processCountry(countryCode: string) {
        const date = moment.tz('Turkey')

        // if (date.isoWeekday() >= 6) {
        //     return;
        // }

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
                .update(subscription.id, {lastNotifiedValue: newValue})
        }
    }

    private async notifyUser(countryCode: string, userId: number, oldValue: number, newValue: number) {
        const sign = ScheduledNotificationService.getSign(newValue, oldValue);
        const flag = mapCountryToFlag(countryCode);
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
}
