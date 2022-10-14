import express from 'express';
import {ExchangeRatesDao} from "../dao/ExchangeRatesDao";
import {KoronaDao} from "../KoronaDao";


export default class ExpressServer {

    private exchangeRateDao: ExchangeRatesDao
    private appServer

    constructor(exchangeRateDao: ExchangeRatesDao) {
        this.exchangeRateDao = exchangeRateDao;

        this.appServer = express();
        this.appServer.use(express.json());

        this.appServer.get('/', async (req, res) => {
            let exchangeRates = await this.exchangeRateDao.getAllKoronaRates();
            res.send({rates: exchangeRates});
        })

        this.appServer.get('/korona/:country', async (req, res) => {
            const country = req.params.country
            let value = await KoronaDao.call(country)
            res.send({
                country: country,
                value: value
            });
        })
    }

    init() {
        this.appServer.listen(6666, () => {
            console.log('The application is listening on port 3000!');
        })
    }
}
