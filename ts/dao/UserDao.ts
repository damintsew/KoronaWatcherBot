import {ds} from "../data-source";
import {LocalUser} from "../entity/LocalUser";

export class UserDao {

    getUserWithSubscriptions(userId: number): Promise<LocalUser> {
        return ds.getRepository(LocalUser)
            .createQueryBuilder("getUserById")
            .leftJoinAndSelect("getUserById.subscriptions", "sent")
            .where({'userId': userId})
            .getOne()
    }

    saveUser(user: LocalUser): Promise<LocalUser> {
        return ds.manager.save(user)
    }
}