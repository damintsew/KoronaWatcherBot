import {LocalUser} from "../entity/LocalUser";
import {ds} from "../data-source";
import {Statistic} from "../entity/Statistic";
import {Service} from "typedi";

@Service()
export class StatisticService {

    callRate(user: LocalUser) {
        const stat = new Statistic()
        stat.user = user
        stat.date = new Date()
        stat.action = "rate"

        ds.getRepository(Statistic)
            .save(stat)
            .catch(console.error)
    }
}
