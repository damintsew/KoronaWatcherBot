import {Equal} from "typeorm";
import {SubsriptionData} from "../entity/SubsriptionData";
import {Telegram} from "telegraf";
import {KoronaDao} from "../KoronaDao";
import {ds} from "../DBConnection";


export class NotificationService {

    tg: Telegram;

    constructor(tg: Telegram) {
        this.tg = tg;
    }

    async process() {
        await this.processCountry("TUR")
        await this.processCountry("GEO")
    }

    private async processCountry(countryCode: string) {
        const newValue = await KoronaDao.call(countryCode);

        const subscriptions = await this.getSubscriptions(countryCode);
        for (let subscription of subscriptions) {

            if (subscription.lastNotifiedValue == null) {
                subscription.lastNotifiedValue = newValue;
                await ds.manager.getRepository(SubsriptionData).save(subscription)
            }

            let difference = this.calculateDifference(subscription.lastNotifiedValue, newValue);
            console.log(`Country=${subscription.country} UserId = ${subscription.user.userId} newValue = ${newValue} lastNotifiedValue = ${subscription.lastNotifiedValue} ` +
                `difference is : ${difference} threshold = ${subscription.notificationThreshold}`)

            if (difference >= subscription.notificationThreshold) {
                await this.notifyUser(countryCode, subscription.user.userId, subscription.lastNotifiedValue, newValue);
                subscription.lastNotifiedValue = newValue;
                await ds.manager.getRepository(SubsriptionData).save(subscription)
            }
        }
    }

    private async notifyUser(countryCode: string, userId: number, oldValue: number,  newValue: number) {
        const sign = newValue > oldValue ? "⬆️" : "⬇️";
        const flag = NotificationService.mapCountryToFlag(countryCode);
        const text = `${flag} ${sign} 1$ = ${newValue}`
        console.log("Sending message to user " + userId)
        try {
            await this.tg.sendMessage(userId, text)
        } catch (e) {
            console.log(e)
        }

    }

    private async getSubscriptions(countryCode: string) {
        return ds.manager.find(SubsriptionData, {
            where: {country: Equal(countryCode)},
            relations: ["user"]
        });
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
