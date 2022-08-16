import {Equal} from "typeorm";
import {SubscriptionData} from "../entity/SubscriptionData";
import {ds} from "../data-source";
import {SubscriptionScheduledData} from "../entity/SubscriptionScheduledData";
import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import * as buffer from "buffer";

export class SubscriptionService {

    getThresholdSubscriptionsByUser(userId: number): Promise<Array<SubscriptionThresholdData>> {
        return ds.manager.getRepository(SubscriptionThresholdData)
            .createQueryBuilder("findSubscriptions")
            .innerJoinAndSelect("findSubscriptions.user", "userJoin")
            .where("userJoin.userId = :userId", { userId })
            .getMany();
    }

    getScheduledSubscriptionsByCountryAndHour(countryCode: string, hour: number): Promise<Array<SubscriptionScheduledData>> {
        return ds.manager.getRepository(SubscriptionScheduledData)
            .createQueryBuilder("getScheduledSubscriptions")
            .innerJoinAndSelect("getScheduledSubscriptions.user", "userJoin")
            .innerJoinAndSelect("getScheduledSubscriptions.triggerTime", "trigger")
            .where("trigger.timeHours = :hour and country = :countryCode",
                { hour: hour, countryCode: countryCode })
            .getMany();
    }

    getScheduledSubscriptionsByUser(userId: number): Promise<Array<SubscriptionScheduledData>> {
        return ds.manager.getRepository(SubscriptionScheduledData)
            .createQueryBuilder("getScheduledSubscriptions")
            .innerJoinAndSelect("getScheduledSubscriptions.user", "userJoin")
            .innerJoinAndSelect("getScheduledSubscriptions.triggerTime", "trigger")
            .where("userJoin.userId = :userId", { userId })
            .getMany();
    }

    async remove(subscriptionToRemove: SubscriptionData) {
        if (subscriptionToRemove instanceof SubscriptionScheduledData) {
            await ds.manager.remove(subscriptionToRemove.triggerTime)
            await ds.manager.remove(subscriptionToRemove)
        } else if (subscriptionToRemove instanceof SubscriptionThresholdData) {
            await ds.manager.remove(subscriptionToRemove);
        }
    }
}
