import {UserDao} from "./dao/UserDao";
import {UserService} from "./service/UserService";
import {SubscriptionService} from "./service/SubscriptionService";
import {ExchangeRatesService} from "./service/ExchangeRatesService";
import {ExchangeRatesDao} from "./dao/ExchangeRatesDao";

const userDao = new UserDao()
const exchangeRatesDao = new ExchangeRatesDao();

const userService = new UserService(userDao)

const subscriptionService = new SubscriptionService();
const exchangeRateService = new ExchangeRatesService(exchangeRatesDao)

export {
    userService,
    subscriptionService,
    exchangeRateService}
