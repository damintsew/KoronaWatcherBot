import {Equal, getManager} from "typeorm";
import {SubsriptionData} from "../entity/SubsriptionData";

export class SubscriptionService {

    getUserSubscriptions(userId: number): Promise<Array<SubsriptionData>> {
        return getManager().getRepository(SubsriptionData)
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
        const entityManager = getManager();
        await entityManager.remove(subscriptionToRemove);
    }
}
