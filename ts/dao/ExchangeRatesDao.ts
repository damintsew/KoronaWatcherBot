import {ds} from "../data-source";
import {ExchangeHistory} from "../entity/ExchangeHistory";
import {In, Repository} from "typeorm";
import {Service} from "typedi";

@Service()
export class ExchangeRatesDao {

    private repository: Repository<ExchangeHistory>;

    constructor() {
        this.repository = ds.getRepository(ExchangeHistory)
    }

    async getRatesByType(type: string) {

        const maxIds = await this.repository
            .createQueryBuilder("rates")
            .select("max(id) as id")
            .where({type: type})
            .groupBy("country")
            .cache(120_000)
            .getRawMany()
            .then(result => result.map(ret => ret.id))

        return this.repository
            .createQueryBuilder()
            .where({id: In(maxIds)})
            .orderBy("country")
            .cache(6000000)
            .getMany()
    }

    async getKoronaRate(country: string) {

        const maxIds = await this.repository
            .createQueryBuilder("exchRates")
            .select("max(id) as id")
            .where({type: "KORONA", country: country})
            .groupBy("country")
            .cache(180_000)
            .getRawMany()
            .then(result => result.map(ret => ret.id))

        return this.repository
            .createQueryBuilder()
            .where({id: In(maxIds)})
            .orderBy("country")
            .cache(6000_000)
            .getOne()
    }

    async getAllGarantexRates() {

        const maxIds = await this.repository
            .createQueryBuilder("exchRates")
            .select("max(id) as id")
            .where({type: "GARANTEX"})
            .groupBy("market")
            .getRawMany()
            .then(result => result.map(ret => ret.id))

        return this.repository
            .createQueryBuilder()
            .where({id: In(maxIds)})
            .orderBy("market")
            .cache(6000000)
            .getMany()
    }

    async getRates(types: string[], market: string) {
        const maxIds = await this.repository
            .createQueryBuilder("exchRates")
            .select("max(id) as id")
            .where({type: In(types), market: market})
            .groupBy("market")
            .groupBy("type")
            .cache(120_000)
            .getRawMany()
            .then(result => result.map(ret => ret.id))

        return this.repository
            .createQueryBuilder()
            .where({id: In(maxIds)})
            .orderBy("market")
            .cache(6000000)
            .getMany()
    }

    save(history: ExchangeHistory) {
        return this.repository.save(history)
    }
}
