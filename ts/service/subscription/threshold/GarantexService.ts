import {ExchangeRatesDao} from "../../../dao/ExchangeRatesDao";
import {GarantexDao} from "../../../dao/rest/GarantexDao";
import {ExchangeHistory} from "../../../entity/ExchangeHistory";
import {GarantexSubscription} from "../../../entity/subscription/threshold/GarantexSubscription";
import {PaymentSubscriptionService} from "../../PaymentSubscriptionService";
import {Service} from "typedi";
import {GlobalMessageAnnouncerService} from "../../GlobalMessageAnnouncerService";
import {LocalUser} from "../../../entity/LocalUser";
import {BaseThresholdService, DifferenceResult} from "./BaseThresholdService";
import {ExchangeRatesService} from "../../ExchangeRatesService";
import {SubscriptionTextSupport} from "../SubscriptionTextSupport";
import {SubscriptionService} from "../../SubscriptionService";

@Service()
export class GarantexService extends BaseThresholdService<GarantexSubscription>
    implements SubscriptionTextSupport<GarantexSubscription> {

    private exchangeRatesService: ExchangeRatesService;
    private garantexDao: GarantexDao;
    private paymentValidatorService: PaymentSubscriptionService

    constructor(subscriptionService: SubscriptionService,
                exchangeRatesService: ExchangeRatesService,
                garantexDao: GarantexDao,
                public messageSender: GlobalMessageAnnouncerService,
                paymentSubscriptionService: PaymentSubscriptionService) {
        super(subscriptionService);
        this.exchangeRatesService = exchangeRatesService;
        this.garantexDao = garantexDao;
        this.paymentValidatorService = paymentSubscriptionService;
    }

    async requestAndSaveRate(): Promise<ExchangeHistory> {
        let tradesResponses = await this.garantexDao.getLatestTrades();
        if (tradesResponses.length > 0) {
            const trade = tradesResponses[0];
            return this.exchangeRatesService.saveRate("GARANTEX", trade.market, trade.price)
        }
    }

    getText(s: GarantexSubscription) {
        return `Garantex: ${s.market} уведомлять при изменении на ${s.notificationThreshold}`
    }

    getButtonText(s: GarantexSubscription) {
        return `Garantex: ${s.market} изменение на ${s.notificationThreshold}`
    }

    protected isPaymentSubsExist(subscription: GarantexSubscription) {
        const activeSubscription = this.paymentValidatorService.filterByActiveSubscription(subscription.user?.subscriptions, "GARANTEX")
        return activeSubscription != null
    }

    protected async getRates(_: GarantexSubscription): Promise<ExchangeHistory> {
        const rates = await this.exchangeRatesService.getRates("GARANTEX", "usdtrub")
        if (rates.length > 0) {
            return rates[0]
        } else return null
    }

    protected async notifyUser(subscription: GarantexSubscription, result: DifferenceResult) {
        if (result.thresholdExceeded) {
            await this.notifyUser1(subscription.user, subscription.market, subscription.lastNotifiedValue, result.newValue)
        }
    }

    private async notifyUser1(user: LocalUser, market: string, oldValue: number, newValue: number) {
        const sign = newValue > oldValue ? "⬆️" : "⬇️";
        const text = `Garantex: ${sign} ${market} 1$ = ${newValue}`
        console.log("Sending message to user " + user.userId)
        try {
            await this.messageSender.sendMessage(user, text)
        } catch (e) {
            console.log(e)
        }
    }
}
