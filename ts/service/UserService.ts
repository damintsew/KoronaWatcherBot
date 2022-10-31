import {User} from "@grammyjs/menu/out/deps.node";
import {UserDao} from "../dao/UserDao";
import {LocalUser} from "../entity/LocalUser";
import {Service} from "typedi";

@Service()
export class UserService {
    private userDao: UserDao;

    constructor(userDao: UserDao) {
        this.userDao = userDao
    }

    getUser(id: number): Promise<LocalUser> {
        return this.userDao.getUserWithSubscriptions(id);
    }

    createUser(userToCreate: User): Promise<LocalUser> {
        const user = new LocalUser()
        user.userId = userToCreate.id
        // user.chatId = userToCreate.chatId
        user.username = userToCreate.username
        user.firstName = userToCreate.first_name
        user.lastName = userToCreate.last_name

        return this.userDao.saveUser(user)
    }
}
