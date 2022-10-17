import {UserDao} from "./dao/UserDao";
import {UserService} from "./service/UserService";
import {SubscriptionService} from "./service/SubscriptionService";
import {ExchangeRatesService} from "./service/ExchangeRatesService";
import {ExchangeRatesDao} from "./dao/ExchangeRatesDao";
import {CronJobService} from "./service/CronJobService";
import {ThresholdNotificationService} from "./service/ThresholdNotificationService";
import {ScheduledNotificationService} from "./service/ScheduledNotificationService";
import {MessageAnouncerService} from "./MessageAnouncerService";
import {GarantexService} from "./service/GarantexService";
import {GarantexDao} from "./dao/GarantexDao";
import {Bot} from "grammy";
import {NewContext} from "./bot_config/Domain2";
import {env} from "node:process";

const token = env.TG_TOKEN
if (token === undefined) {
    throw new Error('TG_TOKEN must be provided!')
}
const bot = new Bot<NewContext>(token)

const userDao = new UserDao()
const exchangeRatesDao = new ExchangeRatesDao();
const garantexDao = new GarantexDao();

const userService = new UserService(userDao)

const subscriptionService = new SubscriptionService();
const exchangeRateService = new ExchangeRatesService(exchangeRatesDao)

const notificationService = new ThresholdNotificationService(bot.api)
const scheduledNotificationService = new ScheduledNotificationService(bot.api, subscriptionService)
const messageAnnouncerService = new MessageAnouncerService(bot.api)
const garantexService = new GarantexService(exchangeRatesDao, garantexDao, subscriptionService, bot.api)
const cronJobService = new CronJobService(notificationService, messageAnnouncerService, scheduledNotificationService,
    garantexService)

export {
    bot,
    userService,
    subscriptionService,
    exchangeRateService
}
