import {ThresholdSubscription} from "../../entity/subscription/ThresholdSubscription";
import {ExchangeHistory} from "../../entity/ExchangeHistory";
import {SubscriptionService} from "../SubscriptionService";
import {BaseSubscription} from "../../entity/subscription/BaseSubscription";

export interface DifferenceResult {
    newValue?: number
    thresholdExceeded?: boolean
}

export abstract class BaseThresholdService<T extends ThresholdSubscription & BaseSubscription> {

    protected subscriptionService: SubscriptionService;

    protected constructor(subscriptionService: SubscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    protected abstract getRates(subscription: T)
    protected abstract isPaymentSubsExist(subscription: T)
    protected abstract notifyUser(subscription, result: DifferenceResult)

    async process(subscription: T) {
        if (!this.isPaymentSubsExist(subscription)) {
            return;
        }
        const exchangeRate = await this.getRates(subscription)
        if (exchangeRate == null) {
            console.log("Retunred null")
            return;
        }
        const res = await this.processNotifications(subscription, exchangeRate);
        this.notifyUser(subscription, res)
        if (res.thresholdExceeded) {
            subscription.lastNotifiedValue = res.newValue
            await this.subscriptionService.saveNewSubscription(subscription)
        }
    }

    private async processNotifications(subs: T, rate: ExchangeHistory) {
        if (subs.lastNotifiedValue == null) {
            subs.lastNotifiedValue = rate.value
            await this.subscriptionService.saveNewSubscription(subs)
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
