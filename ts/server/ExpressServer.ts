import express from 'express';
import {ExchangeRatesDao} from "../dao/ExchangeRatesDao";


export default class ExpressServer {

    private exchangeRateDao: ExchangeRatesDao
    private appServer

    constructor(exchangeRateDao: ExchangeRatesDao) {
        this.exchangeRateDao = exchangeRateDao;

        this.appServer = express();
        this.appServer.use(express.json());


        this.appServer.get('/', async (req, res) => {
            let exchangeRates = await this.exchangeRateDao.getCountryBasedRate("KORONA");
            res.send({ rates: exchangeRates });
        })
    }

    init() {
        this.appServer.listen(6666, () => {
            console.log('The application is listening on port 3000!');
        })
    }
}
