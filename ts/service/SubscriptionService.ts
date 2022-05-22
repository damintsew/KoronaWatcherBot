import {Equal} from "typeorm";
import {SubsriptionData} from "../entity/SubsriptionData";
import {ds} from "../data-source";

export class SubscriptionService {

    getUserSubscriptions(userId: number): Promise<Array<SubsriptionData>> {
        return ds.manager.getRepository(SubsriptionData)
            .createQueryBuilder("findSubscriptions")
            .innerJoinAndSelect("findSubscriptions.user", "userJoin")
            .where("userJoin.userId = :userId", { userId })
            .getMany();
    }

    async remove(subscriptionToRemove: SubsriptionData) {
        await ds.manager.remove(subscriptionToRemove);
    }
}
