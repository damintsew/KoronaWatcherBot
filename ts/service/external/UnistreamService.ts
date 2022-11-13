import {Service} from "typedi";
import {UnistreamDao} from "../../dao/rest/UnistreamDao";
import {countries, findCountryByCode, mapCountryToFlag} from "../FlagUtilities";
import {ExchangeRatesService} from "../ExchangeRatesService";
import {BaseThresholdService, DifferenceResult} from "../subscription/BaseThresholdService";
import {SubscriptionTextSupport} from "../subscription/SubscriptionTextSupport";
import {UnistreamThresholdSubscription} from "../../entity/subscription/UnistreamThresholdSubscription";
import {GlobalMessageAnnouncerService} from "../GlobalMessageAnnouncerService";
import {SubscriptionService} from "../SubscriptionService";


@Service()
export class UnistreamService extends BaseThresholdService<UnistreamThresholdSubscription>
    implements SubscriptionTextSupport<UnistreamThresholdSubscription> {

    private unistreamDao: UnistreamDao
    private exchangeRatesService: ExchangeRatesService
    private messageAnnouncer: GlobalMessageAnnouncerService

    constructor(unistreamDao: UnistreamDao,
                exchancgeRatesService: ExchangeRatesService,
                messageAnnouncer: GlobalMessageAnnouncerService,
                subscriptionService: SubscriptionService) {
        super(subscriptionService);
        this.unistreamDao = unistreamDao;
        this.exchangeRatesService = exchancgeRatesService;
        this.messageAnnouncer = messageAnnouncer;
    }

    async getAndSaveRates() {
        for (const country of countries) {
            const unistreamResponse = await this.unistreamDao.getLatestTrades(country.code);
            if (unistreamResponse != null && unistreamResponse.fees && unistreamResponse.fees.length > 0) {
                const rates = unistreamResponse.fees[0];
                const rate = (rates.acceptedAmount / rates.withdrawAmount).toFixed(3)

                await this.exchangeRatesService.saveRate("UNISTREAM", "USD",
                    Number.parseFloat(rate), country.code)
            }
        }
    }

    protected getRates(subscription: UnistreamThresholdSubscription) {
        this.exchangeRatesService.getRates("UNISTREAM", "", subscription.country)
    }

    protected isPaymentSubsExist(subscription: UnistreamThresholdSubscription) {
        return true;
    }

    protected async notifyUser(subscription: UnistreamThresholdSubscription, result: DifferenceResult) {
        if (result.thresholdExceeded) {
            const sign = result.newValue > subscription.lastNotifiedValue ? "⬆️" : "⬇️";
            const flag = mapCountryToFlag(subscription.country);
            const text = `${flag} ${sign} 1$ = ${result.newValue}`
            console.log("Sending message to user " + subscription.user.userId)
            return this.messageAnnouncer.sendMessage(subscription.user, text)
        }
    }

    getButtonText(subscription: UnistreamThresholdSubscription) {
        const country = findCountryByCode(subscription.country)
        return `Unistream: ${country.flag} ${country.text} по шагу`
    }

    getText(subscription: UnistreamThresholdSubscription) {
        const country = findCountryByCode(subscription.country)
        return `Unistream: ${country.flag} ${country.text} шаг срабатывания ${subscription.notificationThreshold}`
    }
}
