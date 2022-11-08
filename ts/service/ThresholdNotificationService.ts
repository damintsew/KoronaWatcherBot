import {KoronaDao} from "../dao/KoronaDao";
import {ds} from "../data-source";
import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {ExchangeHistory} from "../entity/ExchangeHistory";
import {delay} from "../Util";
import {countries, mapCountryToFlag} from "./FlagUtilities";
import {EventProcessor} from "../events/EventProcessor";
import {Service} from "typedi";
import {SubscriptionService} from "./SubscriptionService";
import {GlobalMessageAnnouncerService} from "./GlobalMessageAnnouncerService";
import {LocalUser} from "../entity/LocalUser";
import {EntityManager} from "typeorm";
import {ExchangeRatesService} from "./ExchangeRatesService";
import e from "express";

@Service()
export class ThresholdNotificationService {

    eventProcessor: EventProcessor

    constructor(public messageAnnouncer: GlobalMessageAnnouncerService,
                eventProcessor: EventProcessor,
                public subscriptionService: SubscriptionService) {
        this.eventProcessor = eventProcessor
    }

    async process() {
        for (const country of countries) {
            if (country.isActive) {
                await ds.transaction(async entityManager => {
                    await this.processCountry(entityManager, country.code)
                })
            }
        }
    }

    private async processCountry(entityManager: EntityManager, countryCode: string) {
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

            await entityManager.save(exchange)
            // todo await this.exchangeRatesService.
            this.eventProcessor.onEvent(exchange)
        }

        const subscriptions = await this.getSubscriptions(entityManager, countryCode);
        for (let subscription of subscriptions) {

            if (subscription.lastNotifiedValue == null) {
                subscription.lastNotifiedValue = newValue;
                await entityManager.save(subscription)
            }

            let difference = this.calculateDifference(subscription.lastNotifiedValue, newValue);
            console.log(`Country=${subscription.country} UserId = ${subscription.user.userId} newValue = ${newValue} lastNotifiedValue = ${subscription.lastNotifiedValue} ` +
                `difference is : ${difference} threshold = ${subscription.notificationThreshold}`)

            try {
                if (difference >= subscription.notificationThreshold) {
                    await this.notifyUser(countryCode, subscription.user, subscription.lastNotifiedValue, newValue);
                    subscription.lastNotifiedValue = newValue;
                    await entityManager.save(subscription)
                }
            } catch (e) {
                console.error(e)
            }
        }

        await delay(500)
    }

    private async notifyUser(countryCode: string, user: LocalUser, oldValue: number, newValue: number) {
        const sign = newValue > oldValue ? "⬆️" : "⬇️";
        const flag = mapCountryToFlag(countryCode);
        const text = `${flag} ${sign} 1$ = ${newValue}`
        console.log("Sending message to user " + user.userId)
        try {
            return this.messageAnnouncer.sendMessage(user, text)
        } catch (e) {
            console.log(e)
        }
    }

    private getSubscriptions(entityManager, countryCode: string) {
        return this.subscriptionService.getAllThresholdSubscriptionsWithActiveUser(entityManager, countryCode)
    }

    private calculateDifference(currentValue: number, newValue: number): number {
        const absDifference = Math.abs(newValue - currentValue) * 100;
        return Math.round(absDifference);
    }
}
