import {ExchangeRatesDao} from "../dao/ExchangeRatesDao";
import {findCountryByCode, mapCountryToFlag} from "./FlagUtilities";
import moment from "moment";
import {StatisticService} from "./StatisticService";
import {PaymentSubscriptionService} from "./PaymentSubscriptionService";
import {Container, Service} from "typedi";
import {LocalUser} from "../entity/LocalUser";

@Service()
export class ExchangeRatesService {

    private exchangeDao: ExchangeRatesDao;
    private statisticService: StatisticService;
    private paymentSubscriptionService: PaymentSubscriptionService;

    constructor(exchangeDao: ExchangeRatesDao, statisticService: StatisticService) {
        this.exchangeDao = exchangeDao;
        this.statisticService = statisticService;
        this.paymentSubscriptionService = Container.get(PaymentSubscriptionService)
    }

    async getAllRates(ctx) {
        this.statisticService.callRate(ctx.user)
        const rates = await this.exchangeDao.getAllKoronaRates()

        const messages = []
        if (rates.length > 0) {
            messages.push(`Курсы валют в Короне на: ${this.formatDate(rates[0].dateTime)}`)
            for (const rate of rates) {
                const msg = `${mapCountryToFlag(rate.country)}  ${rate.currency}  ${rate.value} ` +
                    `${findCountryByCode(rate.country).text}`
                messages.push(msg);
            }
        } else {
            messages.push("Что-то сломалось. По Короне нет данных по курсам валют. Пишите в /support")
        }

        messages.push(...await this.garantexRatesWithValidation(ctx.user));

        ctx.reply(messages.join("\n"))
    }

    private async garantexRatesWithValidation(user: LocalUser) {
        const messages = [""]
        const activeSubscription = this.paymentSubscriptionService.filterByActiveSubscription(user.subscriptions, "GARANTEX")
        if (activeSubscription == null) {
            messages.push(`Garantex.`)
            messages.push(`Ваша подписка на Garantex отсутсвует. Для оформления команда /payments`)
            return messages;
        }

        const garantex = await this.exchangeDao.getAllGarantexRates()

        if (garantex.length > 0) {
            messages.push(`Garantex на: ${this.formatDate(garantex[0].dateTime)}`)
            for (const rate of garantex) {
                const msg = `${rate.market}  ${rate.value}`
                messages.push(msg);
            }
        } else {
            messages.push("Что-то сломалось. По Garantex нет данных по курсам валют. Пишите в /support")
        }

        return messages;
    }

    async rates(type: string = "GARANTEX", market: string = "usdtrub") {
        return await this.exchangeDao.getGarantexRate(market)
    }

    private formatDate(date: Date): string {
        return moment(date).tz("Turkey").format("HH:mm:ss  DD.MM")
    }

    getRate(countryCode: string, korona: string) {
        return this.exchangeDao.getKoronaRate(countryCode);
    }
}
