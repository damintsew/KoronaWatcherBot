import {Service} from "typedi";
import {UnistreamDao} from "../../dao/rest/UnistreamDao";
import {countries} from "../FlagUtilities";
import {ExchangeRatesService} from "../ExchangeRatesService";


@Service()
export class UnistreamService {

    private unistreamDao: UnistreamDao
    private exchangeRatesService: ExchangeRatesService

    constructor(unistreamDao: UnistreamDao, exchancgeRatesService: ExchangeRatesService) {
        this.unistreamDao = unistreamDao;
        this.exchangeRatesService = exchancgeRatesService;
    }

    async getAndSaveRates() {
        for (const country of countries) {
            const unistreamResponse = await this.unistreamDao.getLatestTrades(country.code);
            if (unistreamResponse != null && unistreamResponse.fees && unistreamResponse.fees.length > 0) {
                const rates = unistreamResponse.fees[0];
                const rate = (rates.acceptedAmount / rates.withdrawAmount).toFixed(3)

                await this.exchangeRatesService.saveRate("UNISTREAM", "USD", Number.parseFloat(rate), country.code)
            }
        }
    }
}
