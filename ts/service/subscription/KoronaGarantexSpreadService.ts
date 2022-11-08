import {SpreadBaseService} from "../SpreadBaseService";
import {ExchangeHistory} from "../../entity/ExchangeHistory";
import {KoronaGarantexSpreadSubscription} from "../../entity/subscription/KoronaGarantexSpreadSubscription";
import {SpreadReferenceData} from "../../entity/subscription/SpreadReferenceData";
import {ds} from "../../data-source";
import {Service} from "typedi";
import {findCountryByCode} from "../FlagUtilities";
import {ExchangeRatesService} from "../ExchangeRatesService";
import {StatisticService} from "../StatisticService";
import {PaymentSubscriptionService} from "../PaymentSubscriptionService";
import {GlobalMessageAnnouncerService} from "../GlobalMessageAnnouncerService";
import {LocalUser} from "../../entity/LocalUser";
import Handlebars from "handlebars";
import {EntityManager} from "typeorm";

@Service()
export class KoronaGarantexSpreadService extends SpreadBaseService {

    private source = "" +
        "{{#if subscription}}Подписка на достижение значения в {{subscription.notificationThreshold}} %\n{{/if}}" +
        "{{#if garantexRate}}Garantex: {{garantexRate}}\n{{/if}}" +
        "{{#if binanceRate}}Binance: {{binanceRate}}\n{{/if}}" +
        "\n" +
        "\n" +
        "Страна | Курс ЗК | Спред Гарантекс | Спред Бинанс\n" +
        "{{#each spreads}}" +
        "   {{flag}} {{countryName}} | {{koronaRate}} | {{garantexSpread}} %  {{#if binanceSpread}}| {{binanceSpread}} % {{/if}}\n" +
        "{{/each}}"
    private readonly template: HandlebarsTemplateDelegate

    constructor(messageSender: GlobalMessageAnnouncerService,
                public exchangeRatesService: ExchangeRatesService,
                public statisticService: StatisticService,
                public paymentSubscriptionService: PaymentSubscriptionService) {
        super(messageSender);
        this.template = Handlebars.compile(this.source);
    }

    async getSpread(ctx) {
        this.statisticService.callSpread(ctx.user)
        const messages = [""]
        const activeSubscription = this.paymentSubscriptionService.filterByActiveSubscription(ctx.user.subscriptions, "SPREAD")
        if (activeSubscription == null) {
            messages.push(`Ваша подписка на Спреды отсутсвует. Для оформления команда /payments`)
            return ctx.reply(messages.join("\n"));
        }

        const baseRates = await this.exchangeRatesService.rates(["GARANTEX", "BINANCE"])
        const referenceData = await this.exchangeRatesService.getAllKoronaRates()

        const garantexRate = baseRates.find(baseRate => baseRate.type == "GARANTEX")
        const garantexSpread = this.processSpread(referenceData, garantexRate)

        const binanceRate = baseRates.find(baseRate => baseRate.type == "BINANCE")
        const binanceSpread = this.processSpread(referenceData, binanceRate)

        const data = []
        for (const reference of referenceData) {
            data.push({
                flag: findCountryByCode(reference.country).flag,
                countryName: reference.country,
                koronaRate: reference.value,
                garantexSpread: garantexSpread[reference.country]?.toFixed(2),
                binanceSpread: binanceSpread[reference.country]?.toFixed(2),
            })
        }

        const templateData = {
            garantexRate: garantexRate.value,
            binanceRate: binanceRate.value,
            spreads: data
        }

        await this.notifyUser(ctx.user, templateData)
    }

    private processSpread(referenceData: ExchangeHistory[], baseRates: ExchangeHistory) {
        const spreads = new Map<string, number>();
        for (const reference of referenceData) {
            spreads[reference.country] = this.calculateSpread(baseRates.value, reference.value)
        }

        return spreads;
    }

    async processReference(baseRate: ExchangeHistory, referenceRate: ExchangeHistory, subscription: KoronaGarantexSpreadSubscription) {
        if (baseRate == null) {
            baseRate = (await this.exchangeRatesService.rates(["GARANTEX"]))[0]
        }

        subscription.referenceData = await ds.getRepository(SpreadReferenceData)
            .createQueryBuilder()
            .where({subscription: subscription})
            .orderBy({country: "ASC"})
            .cache(15000)
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
        await ds.transaction(async entityManager => {
            await this.processReference1(entityManager, baseRate, subscription)
        })
    }

    private async processReference1(entityManager: EntityManager, baseRate: ExchangeHistory, subscription: KoronaGarantexSpreadSubscription) {
        if (subscription.garantexLastNotifiedValue == null) {
            subscription.garantexLastNotifiedValue = baseRate.value;
            await entityManager.getRepository(KoronaGarantexSpreadSubscription).save(subscription)
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
                    shouldNotify = false;
                    spreadExceeded = false;
                }
            }
            spreads.push({
                flag: findCountryByCode(referenceData.country).flag,
                countryName: referenceData.country,
                koronaRate: referenceData.koronaLastNotifiedValue,
                spreadExceeded: spreadExceeded, // todo add this
                garantexSpread: currentSpread?.toFixed(2), // todo fix
                // binanceSpread: binanceSpread[reference.country]?.toFixed(2),
            })
        }

        const templateData = {
            subscription: subscription,
            garantexRate: baseRate.value, // todo fix
            spreads: spreads
        }

        if (shouldNotify) {
            await this.notifyUser(subscription.user, templateData)
        }
        await entityManager.getRepository(SpreadReferenceData).save(subscription.referenceData)
        await entityManager.getRepository(KoronaGarantexSpreadSubscription).save(subscription)
    }

    private async notifyUser(user: LocalUser, templateData: any) {
        const message = this.template(templateData);
        await this.messageSender.sendMessage(user, message, {
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
