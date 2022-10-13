import {SubscriptionData} from "../entity/SubscriptionData";
import {ds} from "../data-source";
import {SubscriptionScheduledData} from "../entity/SubscriptionScheduledData";
import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";

export class SubscriptionService {

    async saveSubscription(subscriptionData: SubscriptionData):
        Promise<SubscriptionScheduledData | SubscriptionThresholdData> {
        if (subscriptionData instanceof SubscriptionScheduledData) {
            return this.saveSubscriptionScheduledData(subscriptionData)
        } else if (subscriptionData instanceof SubscriptionThresholdData) {
            return this.saveSubscriptionThresholdData(subscriptionData)
        }
    }

    getThresholdSubscriptionsByUser(userId: number): Promise<Array<SubscriptionThresholdData>> {
        return ds.manager.getRepository(SubscriptionThresholdData)
            .createQueryBuilder("findSubscriptions")
            .innerJoinAndSelect("findSubscriptions.user", "userJoin")
            .where("userJoin.userId = :userId", {userId})
            .getMany();
    }

    getScheduledSubscriptionsByCountryAndHour(countryCode: string, hour: number): Promise<Array<SubscriptionScheduledData>> {
        return ds.manager.getRepository(SubscriptionScheduledData)
            .createQueryBuilder("getScheduledSubscriptions")
            .innerJoinAndSelect("getScheduledSubscriptions.user", "userJoin")
            .innerJoinAndSelect("getScheduledSubscriptions.triggerTime", "trigger")
            .where("trigger.timeHours = :hour and country = :countryCode",
                {hour: hour, countryCode: countryCode})
            .getMany();
    }

    getScheduledSubscriptionsByUser(userId: number): Promise<Array<SubscriptionScheduledData>> {
        return ds.manager.getRepository(SubscriptionScheduledData)
            .createQueryBuilder("getScheduledSubscriptions")
            .innerJoinAndSelect("getScheduledSubscriptions.user", "userJoin")
            .innerJoinAndSelect("getScheduledSubscriptions.triggerTime", "trigger")
            .where("userJoin.userId = :userId", {userId})
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

    private async saveSubscriptionScheduledData(subscriptionData: SubscriptionScheduledData) {
        const existingSubscriptions = await ds.getRepository(SubscriptionScheduledData)
            .createQueryBuilder("getScheduledSubscriptions")
            .innerJoinAndSelect("getScheduledSubscriptions.user", "user")
            .innerJoinAndSelect("getScheduledSubscriptions.triggerTime", "trigger")
            .where("user.userId = :userId AND country = :countryCode",
                {userId: subscriptionData.user.userId, countryCode: subscriptionData.country})
            .getMany()
        for (let s of existingSubscriptions) {
            await ds.manager.remove(s.triggerTime)
            await ds.manager.remove(s)
        }
        return this.save(subscriptionData)
    }

    private async saveSubscriptionThresholdData(subscriptionData: SubscriptionThresholdData) {
        await ds.getRepository(SubscriptionThresholdData)
            .createQueryBuilder("findSubscriptions")
            .innerJoinAndSelect("findSubscriptions.user", "user")
            .where("user.userId = :userId AND country = :countryCode",
                {userId: subscriptionData.user.userId, countryCode: subscriptionData.country})
            .delete()
            .execute()
        return this.save(subscriptionData)
    }

    private async save(subscriptionData: SubscriptionData){
        try {
            await ds.manager.save(subscriptionData);
            return null //todo fix
        } catch (e) {
            console.log("This subscription already exists", e)
        }
    }
}
