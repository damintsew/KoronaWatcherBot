import {UserDao} from "./dao/UserDao";
import {UserService} from "./service/UserService";
import {SubscriptionService} from "./service/SubscriptionService";

const userDao = new UserDao()
const userService = new UserService(userDao)

const subscriptionService = new SubscriptionService();


export {userService, subscriptionService}
