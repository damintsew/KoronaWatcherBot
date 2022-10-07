import {ds} from "../data-source";
import {ExchangeHistory} from "../entity/ExchangeHistory";
import {In} from "typeorm";


export class ExchangeRatesDao {

    async getAllRates() {

        const maxIds = await ds.getRepository(ExchangeHistory)
            .createQueryBuilder("exchRates")
            .select("max(id) as id")
            .groupBy("country")
            .getRawMany()
            .then(result => result.map(ret => ret.id))


        return ds.getRepository(ExchangeHistory)
            .createQueryBuilder()
            .where({id: In(maxIds)})
            .orderBy("country")
            .getMany()
    }
}