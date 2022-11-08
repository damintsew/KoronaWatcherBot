import {ds} from "../data-source";
import {LocalUser} from "../entity/LocalUser";
import {Service} from "typedi";

@Service()
export class UserDao {

    getUserWithSubscriptions(userId: number): Promise<LocalUser> {
        return ds.getRepository(LocalUser)
            .createQueryBuilder("getUserById")
            .leftJoinAndSelect("getUserById.subscriptions", "sent")
            .where({'userId': userId})
            .cache(600_000)
            .getOne()
    }

    saveUser(user: LocalUser): Promise<LocalUser> {
        return ds.manager.save(user)
    }

    getAdmins() {
        return ds.getRepository(LocalUser)
            .createQueryBuilder("getUserById")
            .leftJoinAndSelect("getUserById.subscriptions", "sent")
            .where({'isAdmin': true})
            .getMany()
    }

    updateUser(user: LocalUser) {
        return ds.manager.save(user)
    }

    findUsersNotMarkedForDeletion() {
        return ds.getRepository(LocalUser)
            .createQueryBuilder("allUsers")
            .where({'deletionMark': false})
            .getMany()
    }

    findUsersMarkedForDeletion() {
        return ds.getRepository(LocalUser)
            .createQueryBuilder("getUserById")
            .leftJoinAndSelect("getUserById.subscriptions", "sent")
            .where({'deletionMark': true})
            .getMany()
    }

    async remove(user: LocalUser) {
        return ds.manager.remove(user)
    }
}
