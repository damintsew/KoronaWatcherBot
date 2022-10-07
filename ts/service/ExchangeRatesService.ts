import {ExchangeRatesDao} from "../dao/ExchangeRatesDao";
import {mapCountryToFlag} from "./FlagUtilities";
import moment from "moment";


export class ExchangeRatesService {

    private exchangeDao: ExchangeRatesDao;

    constructor(exchangeDao: ExchangeRatesDao) {
        this.exchangeDao = exchangeDao;
    }

    async getAllRates(ctx) {
        const rates = await this.exchangeDao.getAllRates()

        const messages = []
        if (rates.length > 0) {
            messages.push(`Курсы валют на: ${this.formatDate(rates[0].dateTime)}`)
            for (const rate of rates) {
                const msg = `${mapCountryToFlag(rate.country)}  ${rate.currency}  ${rate.value}`
                messages.push(msg);
            }
        } else {
            messages.push("Что-то сломалось. Нет данных по курсам валют. Пишите в /support")
        }

        ctx.reply(messages.join("\n"))
    }


    private formatDate(date: Date): string {
        return moment(date).tz("Turkey").format("HH:mm:ss  DD.MM")
    }
}