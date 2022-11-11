import {ExchangeRatesDao} from "../dao/ExchangeRatesDao";
import {findCountryByCode, mapCountryToFlag} from "./FlagUtilities";
import moment from "moment";
import {StatisticService} from "./StatisticService";
import {PaymentSubscriptionService} from "./PaymentSubscriptionService";
import {Container, Service} from "typedi";
import {LocalUser} from "../entity/LocalUser";
import {ExchangeHistory} from "../entity/ExchangeHistory";

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

    getAllKoronaRates() {
        return this.exchangeDao.getRatesByType("KORONA")
    }

    getRate(countryCode: string, korona: string) {
        return this.exchangeDao.getKoronaRate(countryCode);
    }

    async getAllRates(ctx) {
        this.statisticService.callRate(ctx.user)
        let rates = await this.exchangeDao.getRatesByType("KORONA")

        const messages = []
        if (rates.length > 0) {
            messages.push(`Курсы валют в Короне на: ${this.formatDate(rates[0].dateTime)}`)
            messages.push(...this.printRates(rates));
        } else {
            messages.push("Что-то сломалось. По Короне нет данных по курсам валют. Пишите в /support")
        }

        rates = await this.exchangeDao.getRatesByType("UNISTREAM")
        if (rates.length > 0) {
            messages.push("")
            messages.push(`Курсы валют в Unistream на: ${this.formatDate(rates[0].dateTime)}`)
            messages.push(...this.printRates(rates));
        } else {
            messages.push("Что-то сломалось. По Unistream нет данных по курсам валют. Пишите в /support")
        }

        messages.push(...await this.garantexRatesWithValidation(ctx.user));

        ctx.reply(messages.join("\n"))
    }

    private printRates(rates: ExchangeHistory[]) {
        const messages = []
        for (const rate of rates) {
            const msg = `${mapCountryToFlag(rate.country)}  ${rate.currency}  ${rate.value} ` +
                `${findCountryByCode(rate.country).text}`
            messages.push(msg);
        }
        return messages;
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

    async rates(types: string[], market: string = "usdtrub") {
        return await this.exchangeDao.getRates(types, market)
    }

    private formatDate(date: Date): string {
        return moment(date).tz("Turkey").format("HH:mm:ss  DD.MM")
    }

    saveRate(stockMarket: string, symbol: string, rate: number, country = null) {
        const exchange = new ExchangeHistory()
        exchange.market = symbol
        exchange.currency = symbol
        exchange.dateTime = new Date()
        exchange.value = rate
        exchange.type = stockMarket
        exchange.country = country

        return this.exchangeDao.save(exchange)
    }
}
