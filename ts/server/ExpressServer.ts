import express from 'express';
import {ExchangeRatesDao} from "../dao/ExchangeRatesDao";
import {KoronaDao} from "../dao/rest/KoronaDao";
import {UnistreamDao} from "../dao/rest/UnistreamDao";


export default class ExpressServer {

    private appServer

    constructor() {

        this.appServer = express();
        this.appServer.use(express.json());

        this.appServer.get('/korona/:country', async (req, res) => {
            const country = req.params.country
            let value = await KoronaDao.call(country)
            res.send({
                country: country,
                value: value
            });
        })

        this.appServer.get('/unistream/:country', async (req, res) => {
            const country = req.params.country
            let response = await UnistreamDao.call(country)
            res.send(response);
        })
    }

    init() {
        this.appServer.listen(3333, () => {
            console.log('The application is listening on port 3000!');
        })
    }
}

const expr = new ExpressServer()
expr.init()
