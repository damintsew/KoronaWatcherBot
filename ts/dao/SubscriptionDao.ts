import {Repository} from "typeorm";
import {ExchangeHistory} from "../entity/ExchangeHistory";
import {ds} from "../data-source";

export class SubscriptionDao {

    private repository: Repository<SubscriptionDao>;

    constructor() {
        // this.repository = ds.getRepository(ExchangeHistory)
    }
}
