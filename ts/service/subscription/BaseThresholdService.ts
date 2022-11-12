import {ThresholdSubscription} from "../../entity/subscription/ThresholdSubscription";
import {ExchangeHistory} from "../../entity/ExchangeHistory";

export interface DifferenceResult {
    newValue?: number
    thresholdExceeded?: boolean
}

export abstract class BaseThresholdService<T extends ThresholdSubscription> {

    protected abstract getRates()
    protected abstract validatePayment(subscription: T)
    protected abstract notifyUser(subscription, result: DifferenceResult)

    async process(subscription: T) {
        if (!this.validatePayment(subscription)) {
            return;
        }
        const exchangeRate = await this.getRates()
        if (exchangeRate == null) {
            console.log("Retunred null")
            return;
        }
        const res = await this.processNotifications(subscription, exchangeRate);
        this.notifyUser(subscription, res)
    }

    private async processNotifications(subs: T, rate: ExchangeHistory) {
        if (subs.lastNotifiedValue == null) {
            subs.lastNotifiedValue = rate.value
        }

        let difference = this.calculateDifference(subs.lastNotifiedValue, rate.value);
        console.log(`Garantex UserId = ${subs.user.userId} newValue = ${rate.value} lastNotifiedValue = ${subs.lastNotifiedValue} ` +
            `difference is : ${difference} threshold = ${subs.notificationThreshold}`)

        try {
            const result: DifferenceResult = {}
            if (difference >= subs.notificationThreshold) {
                result.newValue = rate.value;
                result.thresholdExceeded = true
            }
            return result
        } catch (e) {
            console.error(e)
            return {} as DifferenceResult
        }
    }

    private calculateDifference(currentValue: number, newValue: number): number {
        const absDifference = Math.abs(newValue - currentValue) * 100;
        return Math.round(absDifference);
    }
}
