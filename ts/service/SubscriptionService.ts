import {Equal} from "typeorm";
import {SubsriptionData} from "../entity/SubsriptionData";
import {ds} from "../DBConnection";

export class SubscriptionService {

    getUserSubscriptions(userId: number): Promise<Array<SubsriptionData>> {
        return ds.manager.getRepository(SubsriptionData)
            .createQueryBuilder("findSubscriptions")
            .innerJoinAndSelect("findSubscriptions.user", "userJoin")
            .where("userJoin.userId = :userId", { userId })
            .getMany();
        // return  entityManager.find(SubsriptionData, {
        //     where: {user: Equal(userId)},
        //     relations: ["user"]
        // });
    }

    async remove(subscriptionToRemove: SubsriptionData) {
        await ds.manager.remove(subscriptionToRemove);
    }
}
