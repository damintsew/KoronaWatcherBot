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

@Service()
export class KoronaGarantexSpreadService extends SpreadBaseService {

    constructor(botApi: Bot<NewContext>, public exchangeRatesService: ExchangeRatesService) {
        super(botApi);
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
            if (data.koronaLastNotifiedValue == null) {
                data.koronaLastNotifiedValue = (await this.exchangeRatesService.getRate(data.country, "KORONA"))?.value
            }
        }

        if (referenceRate != null) {
            for (const data of subscription.referenceData) {
                if (data.country == referenceRate.country) {
                    data.koronaLastNotifiedValue = referenceRate.value
                }
                if (data.koronaLastNotifiedValue == null) {
                    data.koronaLastNotifiedValue = (await this.exchangeRatesService.getRate(data.country, "KORONA"))?.value
                }
            }
        }

        await this.processReference1(baseRate, subscription)

    }

    async processReference1(baseRate: ExchangeHistory, subscription: KoronaGarantexSpreadSubscription) {
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
            this.notifyUser(subscription, subscription.garantexLastNotifiedValue, spreads)
        }
        await ds.getRepository(SpreadReferenceData).save(subscription.referenceData)
        await ds.getRepository(KoronaGarantexSpreadSubscription).save(subscription)
    }

    private notifyUser(subscription: KoronaGarantexSpreadSubscription, base: number, spreads: any[]) {
        const lines = [this.formatTextMessage(subscription), `Garantex: ${base}`, ""]
        for (let s of spreads) {
            let line = `  ${findCountryByCode(s.country).flag}  ${s.country} | ${s.rate} | ${s.spread.toFixed(2)} % `
            if (s.spreadExceeded) {
                line = "<b>" + line + "</b>"
            }
            lines.push(line)
        }

        this.tg.sendMessage(subscription.user.userId, lines.join("\n"), {
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
