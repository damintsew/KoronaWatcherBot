import {Service} from "typedi";
import {BinanceDao} from "../dao/rest/BinanceDao";
import {ExchangeRatesService} from "./ExchangeRatesService";
import {EventProcessor} from "../events/EventProcessor";

@Service()
export class BinanceService {

    private binanceDao: BinanceDao
    private ratesService: ExchangeRatesService;
    private eventProcessor: EventProcessor;

    constructor(binanceDao: BinanceDao, ratesService: ExchangeRatesService, eventProcessor: EventProcessor) {
        this.binanceDao = binanceDao;
        this.ratesService = ratesService;
        this.eventProcessor = eventProcessor;
    }

    async getAndSaveRate() {
        const response = await this.binanceDao.getLatestTrades();
        if (response == null) {
            return
        }

        const firstBid = response.bids[0];
        const value = firstBid[0];

        const exchangeHist = await this.ratesService.saveRate("BINANCE", "usdtrub", value);
        await this.eventProcessor.onEvent(exchangeHist)
    }
}
