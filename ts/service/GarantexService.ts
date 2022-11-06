import {ExchangeRatesDao} from "../dao/ExchangeRatesDao";
import {GarantexDao} from "../dao/GarantexDao";
import {ExchangeHistory} from "../entity/ExchangeHistory";
import {SubscriptionService} from "./SubscriptionService";
import {GarantexSubscription} from "../entity/subscription/GarantexSubscription";
import {EventProcessor} from "../events/EventProcessor";
import {PaymentSubscriptionService} from "./PaymentSubscriptionService";
import {Container, Service} from "typedi";
import {GlobalMessageAnnouncerService} from "./GlobalMessageAnnouncerService";
import {LocalUser} from "../entity/LocalUser";

@Service()
export class GarantexService {

    private exchangeRatesDao: ExchangeRatesDao;
    private garantexDao: GarantexDao;
    private subscriptionService: SubscriptionService
    private eventProcessor: EventProcessor
    private paymentValidatorService: PaymentSubscriptionService

    constructor(exchangeRatesDao: ExchangeRatesDao,
                garantexDao: GarantexDao,
                subscriptionService: SubscriptionService,
                eventProcessor: EventProcessor,
                public messageSender: GlobalMessageAnnouncerService,
                paymentSubscriptionService: PaymentSubscriptionService) {
        this.exchangeRatesDao = exchangeRatesDao;
        this.garantexDao = garantexDao;
        this.subscriptionService = subscriptionService;
        this.eventProcessor = eventProcessor;
        this.paymentValidatorService = paymentSubscriptionService;
    }

    async process() {
        const exchangeRate = await this.getAndSaveRates()
        let subscriptions = await this.subscriptionService.getSubscriptionsByType<GarantexSubscription>("GARANTEX");

        let activeSubscriptions = subscriptions.filter(subscription => {
            const activeSubscription = this.paymentValidatorService.filterByActiveSubscription(subscription.user?.subscriptions, "GARANTEX")
            return activeSubscription != null
        })

        await this.processNotifications(activeSubscriptions, exchangeRate);
    }

    private async getAndSaveRates(): Promise<ExchangeHistory> {
        let tradesResponses = await this.garantexDao.getLatestTrades();
        if (tradesResponses.length > 0) {
            const trade = tradesResponses[0];
            const hist = new ExchangeHistory()
            hist.type = "GARANTEX"
            hist.market = trade.market
            hist.value = trade.price
            hist.dateTime = trade.created_at
            hist.currency = trade.market

            this.eventProcessor.onEvent(hist)

            return this.exchangeRatesDao.save(hist)
        }

        return null;
    }

    private async processNotifications(subscriptions: GarantexSubscription[], rate: ExchangeHistory) {
        for (const subs of subscriptions) {
            if (subs.lastNotifiedValue == null) {
                subs.lastNotifiedValue = rate.value
                await this.subscriptionService.update(subs)
                continue;
            }

            let difference = this.calculateDifference(subs.lastNotifiedValue, rate.value);
            console.log(`Garantex UserId = ${subs.user.userId} newValue = ${rate.value} lastNotifiedValue = ${subs.lastNotifiedValue} ` +
                `difference is : ${difference} threshold = ${subs.notificationThreshold}`)

            try {
                if (difference >= subs.notificationThreshold) {
                    await this.notifyUser(subs.user, subs.market, subs.lastNotifiedValue, rate.value);
                    subs.lastNotifiedValue = rate.value;

                    await this.subscriptionService.update(subs)
                }
            } catch (e) {
                console.error(e)
            }
        }
    }

    private async notifyUser(user: LocalUser, market: string, oldValue: number, newValue: number) {
        const sign = newValue > oldValue ? "⬆️" : "⬇️";
        const text = `Garantex: ${sign} ${market} 1$ = ${newValue}`
        console.log("Sending message to user " + user.userId)
        try {
            await this.messageSender.sendMessage(user, text)
        } catch (e) {
            console.log(e)
        }
    }

    private calculateDifference(currentValue: number, newValue: number): number {
        const absDifference = Math.abs(newValue - currentValue) * 100;
        return Math.round(absDifference);
    }
}
