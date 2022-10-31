import {SubscriptionService} from "./SubscriptionService";
import {UserDao} from "../dao/UserDao";
import {Service} from "typedi";

@Service()
export class UserCleanerService {

    constructor(public subscriptionService: SubscriptionService,
                public userDao: UserDao) {
    }

    async findAndDelete() {
        const usersToDelete = await this.userDao.findUsersMarkedForDeletion()
        for (const user of usersToDelete) {
            await this.subscriptionService.removeSubscriptionsByUserId(user.userId)
            await this.userDao.remove(user)
        }
    }
}
