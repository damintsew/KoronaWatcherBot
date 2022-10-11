import {ExchangeRatesDao} from "../dao/ExchangeRatesDao";
import {GarantexDao} from "../dao/GarantexDao";
import {ExchangeHistory} from "../entity/ExchangeHistory";


export class GarantexService {

    private exchangeRatesDao: ExchangeRatesDao;
    private garantexDao: GarantexDao;


    constructor(exchangeRatesDao: ExchangeRatesDao, garantexDao: GarantexDao) {
        this.exchangeRatesDao = exchangeRatesDao;
        this.garantexDao = garantexDao;
    }

    async getAndSaveRates() {
        let tradesResponses = await this.garantexDao.getLatestTrades();
        if (tradesResponses.length > 0) {
            const trade = tradesResponses[0];
            const hist = new ExchangeHistory()
            hist.type = "GARANTEX"
            hist.market = trade.market
            hist.value = trade.price
            hist.dateTime = trade.created_at
            hist.currency = trade.market

            this.exchangeRatesDao.save(hist)
        }
    }
}