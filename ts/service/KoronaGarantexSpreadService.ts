import {SpreadBaseService} from "./SpreadBaseService";
import {ExchangeHistory} from "../entity/ExchangeHistory";
import {KoronaGarantexSpreadSubscription} from "../entity/subscription/KoronaGarantexSpreadSubscription";
import {SpreadReferenceData} from "../entity/subscription/SpreadReferenceData";
import {ds} from "../data-source";
import {Service} from "typedi";
import {NewContext} from "../bot_config/Domain";
import {Bot} from "grammy";
import {findCountryByCode} from "./FlagUtilities";
import {ExchangeRatesService} from "./ExchangeRatesService";
import {StatisticService} from "./StatisticService";
import {PaymentSubscriptionService} from "./PaymentSubscriptionService";
import {GlobalMessageAnnouncerService} from "./GlobalMessageAnnouncerService";
import {LocalUser} from "../entity/LocalUser";

@Service()
export class KoronaGarantexSpreadService extends SpreadBaseService {

    constructor(messageSender: GlobalMessageAnnouncerService,
                public exchangeRatesService: ExchangeRatesService,
                public statisticService: StatisticService,
                public paymentSubscriptionService: PaymentSubscriptionService) {
        super(messageSender);
    }

    async getSpread(ctx) {
        this.statisticService.callSpread(ctx.user)
        const messages = [""]
        const activeSubscription = this.paymentSubscriptionService.filterByActiveSubscription(ctx.user.subscriptions, "SPREAD")
        if (activeSubscription == null) {
            messages.push(`Ваша подписка на Спреды отсутсвует. Для оформления команда /payments`)
            return ctx.reply(messages.join("\n"));
        }

        const baseRate = await this.exchangeRatesService.rates()
        const referenceData = await this.exchangeRatesService.getAllKoronaRates()

        const spreads = [];

        for (const reference of referenceData) {
            const currentSpread = this.calculateSpread(baseRate.value, reference.value)
            spreads.push({
                country: reference.country,
                rate: reference.value,
                spread: currentSpread,
            })
        }

        await this.notifyUser(ctx.user, null, baseRate.value, spreads)
    }

    async processReference(baseRate: ExchangeHistory, referenceRate: ExchangeHistory, subscription: KoronaGarantexSpreadSubscription) {
        if (baseRate == null) {
            baseRate = await this.exchangeRatesService.rates()
        }

        subscription.referenceData = await ds.getRepository(SpreadReferenceData).createQueryBuilder()
            .where({subscription: subscription})
            .orderBy({country: "ASC"})
            .getMany()

        for (const data of subscription.referenceData) {
            if (referenceRate != null) {
                if (data.country == referenceRate.country) {
                    data.koronaLastNotifiedValue = referenceRate.value
                }
            }
            if (data.koronaLastNotifiedValue == null) {
                data.koronaLastNotifiedValue = (await this.exchangeRatesService.getRate(data.country, "KORONA"))?.value
            }
        }

        await this.processReference1(baseRate, subscription)
    }

    private async processReference1(baseRate: ExchangeHistory, subscription: KoronaGarantexSpreadSubscription) {
        if (subscription.garantexLastNotifiedValue == null) {
            subscription.garantexLastNotifiedValue = baseRate.value;
            await ds.getRepository(KoronaGarantexSpreadSubscription).save(subscription)
            return;
        }

        const spreads = [];
        let shouldNotify = false;
        for (const referenceData of subscription.referenceData) {
            let spreadExceeded = false
            const currentSpread = this.calculateSpread(subscription.garantexLastNotifiedValue,
                referenceData.koronaLastNotifiedValue)

            const spreadDiff = Math.abs(Math.abs(currentSpread) - Math.abs(referenceData.lastNotifiedSpreadValue))

            if (subscription.changeType == "SPREAD_CHANGE") {
                if (spreadDiff >= subscription.notificationThreshold) {
                    referenceData.lastNotifiedSpreadValue = currentSpread
                    shouldNotify = true;
                    spreadExceeded = true;
                }
            } else {
                if (currentSpread >= subscription.notificationThreshold) {
                    if (referenceData.lastNotifiedSpreadValue <= subscription.notificationThreshold) { //notify when exceeded
                        referenceData.lastNotifiedSpreadValue = currentSpread
                        shouldNotify = true;
                        spreadExceeded = true;
                    }
                } else if (referenceData.lastNotifiedSpreadValue >= subscription.notificationThreshold) { // nofity when dropped below
                    referenceData.lastNotifiedSpreadValue = currentSpread
                    shouldNotify = true;
                    spreadExceeded = true;
                }
            }
            spreads.push({
                country: referenceData.country,
                spread: currentSpread,
                rate: referenceData.koronaLastNotifiedValue,
                spreadExceeded: spreadExceeded
            })
        }

        if (shouldNotify) {
            await this.notifyUser(subscription.user, subscription, subscription.garantexLastNotifiedValue, spreads)
        }
        await ds.getRepository(SpreadReferenceData).save(subscription.referenceData)
        await ds.getRepository(KoronaGarantexSpreadSubscription).save(subscription)
    }

    private async notifyUser(user: LocalUser, subscription: KoronaGarantexSpreadSubscription, base: number, spreads: any[]) {
        const lines = []
        if (subscription) {
            lines.push(this.formatTextMessage(subscription))
        }

        lines.push(`Garantex: ${base}`, "")

        for (let s of spreads) {
            let line = `  ${findCountryByCode(s.country).flag}  ${s.country} | ${s.rate} | ${s.spread.toFixed(2)} % `
            if (s.spreadExceeded) {
                line = "<b>" + line + "</b>"
            }
            lines.push(line)
        }

        await this.messageSender.sendMessage(user, lines.join("\n"), {
            parse_mode: 'HTML',
        })
    }

    private calculateSpread(baseVal: number, relativeVal: number) {
        return (baseVal - relativeVal) / baseVal * 100;
    }

    formatTextMessage(subscription: KoronaGarantexSpreadSubscription) {
        let message = `Spread: `;
        if (subscription.changeType == "SPREAD_CHANGE") {
            message += `подписка на изменение значение на `
        } else {
            message += `подписка на достижение значения в `
        }
        message += `${subscription.notificationThreshold} %`

        return message
    }

    formatButtonText(subscription: KoronaGarantexSpreadSubscription) {
        let message = `Spread: `;
        if (subscription.changeType == "SPREAD_CHANGE") {
            message += `изменение значения`
        } else {
            message += `достижение значения `
        }
        message += `${subscription.notificationThreshold}`

        return message
    }
}
