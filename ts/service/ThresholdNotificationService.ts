import {Equal} from "typeorm";
import {SubscriptionData} from "../entity/SubscriptionData";
import {Telegram} from "telegraf";
import {KoronaDao} from "../KoronaDao";
import {ds} from "../data-source";
import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {ExchangeHistory} from "../entity/ExchangeHistory";
import {delay} from "../Util";
import {countries, mapCountryToFlag} from "./FlagUtilities";


export class ThresholdNotificationService {

    tg: Telegram;

    constructor(tg: Telegram) {
        this.tg = tg;
    }

    async process() {
        for (const country of countries) {
            if (country.isActive) {
                await this.processCountry(country.code)
            }
        }
    }

    private async processCountry(countryCode: string) {
        const newValue = await KoronaDao.call(countryCode);

        if (newValue == undefined || newValue == 0) {
            return
        }

        if (newValue != null) {
            const exchange = new ExchangeHistory()
            exchange.country = countryCode
            exchange.currency = "USD"
            exchange.dateTime = new Date()
            exchange.value = newValue

            await ds.manager.save(exchange)
        }


        const subscriptions = await this.getSubscriptions(countryCode);
        for (let subscription of subscriptions) {

            if (subscription.lastNotifiedValue == null) {
                subscription.lastNotifiedValue = newValue;
                await ds.manager.getRepository(SubscriptionThresholdData).save(subscription)
            }

            let difference = this.calculateDifference(subscription.lastNotifiedValue, newValue);
            console.log(`Country=${subscription.country} UserId = ${subscription.user.userId} newValue = ${newValue} lastNotifiedValue = ${subscription.lastNotifiedValue} ` +
                `difference is : ${difference} threshold = ${subscription.notificationThreshold}`)

            try {
                if (difference >= subscription.notificationThreshold) {
                    await this.notifyUser(countryCode, subscription.user.userId, subscription.lastNotifiedValue, newValue);
                    subscription.lastNotifiedValue = newValue;
                    await ds.manager.getRepository(SubscriptionThresholdData).save(subscription)
                }
            } catch (e) {
                console.error(e)
                // if () {

                // }
            }
        }

        await delay(1000)
    }

    private async notifyUser(countryCode: string, userId: number, oldValue: number,  newValue: number) {
        const sign = newValue > oldValue ? "⬆️" : "⬇️";
        const flag = mapCountryToFlag(countryCode);
        const text = `${flag} ${sign} 1$ = ${newValue}`
        console.log("Sending message to user " + userId)
        try {
            await this.tg.sendMessage(userId, text)
        } catch (e) {
            console.log(e)
        }
    }

    private async getSubscriptions(countryCode: string) {
        return ds.manager.find(SubscriptionThresholdData, {
            where: {country: Equal(countryCode)},
            relations: ["user"]
        });
    }

    private calculateDifference(currentValue: number, newValue: number): number {
        const absDifference = Math.abs(newValue - currentValue) * 100;
        return Math.round(absDifference);
    }
}
