import {ds} from "../data-source";
import {User} from "../entity/User";

export class UserDao {

    getUserWithSubscriptions(userId: number): Promise<User> {
        return ds.getRepository(User)
            .createQueryBuilder("getUserById")
            .leftJoinAndSelect("getUserById.subscriptions", "sent")
            .where({'userId': userId})
            .getOne()
    }
}