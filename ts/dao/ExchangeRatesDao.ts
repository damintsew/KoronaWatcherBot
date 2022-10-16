import {ds} from "../data-source";
import {ExchangeHistory} from "../entity/ExchangeHistory";
import {In} from "typeorm";


export class ExchangeRatesDao {

    constructor(){
        ds.initialize();
    }

    async getAllKoronaRates() {

        const maxIds = await ds.getRepository(ExchangeHistory)
            .createQueryBuilder("exchRates")
            .select("max(id) as id")
            .where({type: "KORONA"})
            .groupBy("country")
            .getRawMany()
            .then(result => result.map(ret => ret.id))


        return ds.getRepository(ExchangeHistory)
            .createQueryBuilder()
            .where({id: In(maxIds)})
            .orderBy("country")
            .getMany()
    }

    async getAllGarantexRates() {

        const maxIds = await ds.getRepository(ExchangeHistory)
            .createQueryBuilder("exchRates")
            .select("max(id) as id")
            .where({type: "GARANTEX"})
            .groupBy("market")
            .getRawMany()
            .then(result => result.map(ret => ret.id))


        return ds.getRepository(ExchangeHistory)
            .createQueryBuilder()
            .where({id: In(maxIds)})
            .orderBy("market")
            .getMany()
    }

    async save(history: ExchangeHistory) {
        await ds.manager.save(history)
    }
}