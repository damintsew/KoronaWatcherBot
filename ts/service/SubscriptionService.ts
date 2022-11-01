import {SubscriptionData} from "../entity/SubscriptionData";
import {ds} from "../data-source";
import {SubscriptionScheduledData} from "../entity/SubscriptionScheduledData";
import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {BaseSubscription} from "../entity/subscription/BaseSubscription";
import {KoronaGarantexSpreadService} from "./KoronaGarantexSpreadService";
import {ExchangeHistory} from "../entity/ExchangeHistory";
import {KoronaGarantexSpreadSubscription} from "../entity/subscription/KoronaGarantexSpreadSubscription";
import {EventProcessor} from "../events/EventProcessor";
import {ThresholdNotificationService} from "./ThresholdNotificationService";
import {Service} from "typedi";

@Service()
export class SubscriptionService {

    private eventProcessor: EventProcessor
    private spreadService: KoronaGarantexSpreadService

    constructor(eventProcessor: EventProcessor, spreadService: KoronaGarantexSpreadService) {
        this.eventProcessor = eventProcessor;
        this.spreadService = spreadService;
        const that = this
        eventProcessor.subscribe({
            onEvent(exchangeValue: ExchangeHistory) {
                that.processSubs(exchangeValue)
            }
        })
    }

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
            .innerJoinAndSelect("findSubscriptions.user", "user")
            .where("user.userId = :userId and user.deletionMark = false", {userId})
            .getMany();
    }

    getAllThresholdSubscriptionsWithActiveUser(countryCode: string): Promise<Array<SubscriptionThresholdData>> {
        return ds.manager.getRepository(SubscriptionThresholdData)
            .createQueryBuilder("findSubscriptions")
            .innerJoinAndSelect("findSubscriptions.user", "user")
            .where("user.deletionMark = false " +
                "and findSubscriptions.country == :country", {country: countryCode})
            .getMany();
    }

    getScheduledSubscriptionsByCountryAndHour(countryCode: string, hour: number): Promise<Array<SubscriptionScheduledData>> {
        return ds.manager.getRepository(SubscriptionScheduledData)
            .createQueryBuilder("getScheduledSubscriptions")
            .innerJoinAndSelect("getScheduledSubscriptions.user", "user")
            .innerJoinAndSelect("getScheduledSubscriptions.triggerTime", "trigger")
            .where("trigger.timeHours = :hour and country = :countryCode",
            // .where("trigger.timeHours = :hour and country = :countryCode and user.deletionMark = false",
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

    async removeThresholdById(id: number): Promise<SubscriptionThresholdData> {
        const subscription = await ds.manager.getRepository(SubscriptionThresholdData).findOneBy({id: id})
        return ds.manager.remove(subscription);
    }

    async removeScheduledById(id: number): Promise<SubscriptionScheduledData> {
        const subscription = await ds.manager.getRepository(SubscriptionScheduledData)
            .createQueryBuilder("getScheduledSubscriptions")
            .innerJoinAndSelect("getScheduledSubscriptions.triggerTime", "trigger")
            .where({id: id})
            .getOne()
        await ds.manager.remove(subscription.triggerTime)
        return ds.manager.remove(subscription)
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

    private async save(subscriptionData: SubscriptionData) {
        try {
            await ds.manager.save(subscriptionData);
            return null //todo fix
        } catch (e) {
            console.log("This subscription already exists", e)
        }
    }

    //new ---------------------

    async getBaseSubscriptions(userId: number) {
        return ds.getRepository(BaseSubscription)
            .createQueryBuilder("subcr")
            .innerJoinAndSelect("subcr.user", "user")
            .where("user.userId = :userId", {userId: userId})
            .getMany()
    }

    async saveNewSubscription(subscriptionData: BaseSubscription): Promise<BaseSubscription> {
        return ds.manager.save(subscriptionData)
    }

    async removeBaseSubscription(subscriptionId: number) {
        return ds.manager.getRepository(BaseSubscription)
            .delete(subscriptionId)
    }

    async removeSubscriptionsByUserId(userId: number) {
        await ds.getRepository(BaseSubscription)
            .createQueryBuilder("s")
            .innerJoinAndSelect("s.user", "user")
            .where("user.userId = :userId", {userId: userId})
            .delete()
        await ds.getRepository(SubscriptionThresholdData)
            .createQueryBuilder("s")
            .innerJoinAndSelect("s.user", "user")
            .where("user.userId = :userId", {userId: userId})
            .delete()

         await ds.getRepository(SubscriptionScheduledData)
            .createQueryBuilder("s")
            .innerJoinAndSelect("s.user", "user")
            .where("user.userId = :userId", {userId: userId})
            .delete()

    }

    async getSubscriptionsByType<T extends BaseSubscription>(type: string): Promise<T[]> {
        return ds.getRepository<T>(BaseSubscription)
            .createQueryBuilder("s")
            .innerJoinAndSelect("s.user", "user")
            .innerJoinAndSelect("user.subscriptions", "subscriptions")
            .where("s.type = :type", {type: type})
            .getMany()
    }

    // async getAllNewSubscriptions(): Promise<BaseSubscription[]> {
    //     return ds.getRepository(BaseSubscription)
    //         .createQueryBuilder("subcr")
    //         .innerJoinAndSelect("subcr.user", "user")
    //         .where("type = :type", {type: type})
    // .getMany()
    // }

    update(subs: BaseSubscription) {
        return ds.getRepository(BaseSubscription).save(subs)
    }

    //todo move to DAO


    async processSubs(exchangeRate: ExchangeHistory) {
        let baseSubscriptions = await this.getSubscriptionsByType<KoronaGarantexSpreadSubscription>("SPREAD");
        for (const subscription of baseSubscriptions) {

            // todo move to service
            if (exchangeRate.type == "KORONA") {
                this.spreadService.processReference([exchangeRate], subscription)
            } else if (exchangeRate.type == "GARANTEX") {
                this.spreadService.processBase(exchangeRate, subscription)
            }
        }
    }
}
