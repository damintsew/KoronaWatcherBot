import {LocalUser} from "../entity/LocalUser";
import {ds} from "../data-source";
import {Statistic} from "../entity/Statistic";
import {Service} from "typedi";

@Service()
export class StatisticService {

    callRate(user: LocalUser) {
        this.create(user, "rate")
    }

    callSpread(user) {
        this.create(user, "spread")
    }

    private create(user: LocalUser, action: string) {
        const stat = new Statistic()
        stat.user = user
        stat.date = new Date()
        stat.action = action

        ds.getRepository(Statistic)
            .save(stat)
            .catch(console.error)
    }
}
