import {Equal} from "typeorm";
import {KoronaDao} from "../dao/KoronaDao";
import {ds} from "../data-source";
import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {ExchangeHistory} from "../entity/ExchangeHistory";
import {delay} from "../Util";
import {countries, mapCountryToFlag} from "./FlagUtilities";
import {Api} from "@grammyjs/menu/out/deps.node";
import {EventProcessor} from "../events/EventProcessor";


export class ThresholdNotificationService {

    tg: Api;
    eventProcessor: EventProcessor

    constructor(tg: Api, eventProcessor: EventProcessor) {
        this.tg = tg;
        this.eventProcessor = eventProcessor
    }

    async process() {
        for (const country of countries) {
            if (country.isActive) {
                this.processCountry(country.code)
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
            this.eventProcessor.onEvent(exchange)
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
            }
        }

        await delay(500)
    }

    private async notifyUser(countryCode: string, userId: number, oldValue: number, newValue: number) {
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
