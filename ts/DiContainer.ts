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
import {StatisticService} from "./service/StatisticService";
import {EventProcessor} from "./events/EventProcessor";
import {KoronaGarantexSpreadService} from "./service/KoronaGarantexSpreadService";
import {Container} from "typedi";

const token = env.TG_TOKEN
if (token === undefined) {
    throw new Error('TG_TOKEN must be provided!')
}
const bot = new Bot<NewContext>(token)

Container.set(Bot, bot);

const userDao = new UserDao()
const exchangeRatesDao = new ExchangeRatesDao();
const garantexDao = new GarantexDao();

const userService = new UserService(userDao)

const eventProcessor = new EventProcessor();

const statisticService = new StatisticService();

const spreadService = new KoronaGarantexSpreadService(bot.api);


const subscriptionService = new SubscriptionService(eventProcessor, spreadService);
const exchangeRateService = new ExchangeRatesService(exchangeRatesDao, statisticService)


const notificationService = new ThresholdNotificationService(bot.api, eventProcessor)
const scheduledNotificationService = new ScheduledNotificationService(bot.api, subscriptionService)
const messageAnnouncerService = new MessageAnouncerService(bot.api)
const garantexService = new GarantexService(exchangeRatesDao, garantexDao, subscriptionService, eventProcessor, bot.api)
const cronJobService = new CronJobService(notificationService, messageAnnouncerService, scheduledNotificationService,
    garantexService)

export {
    bot,
    userService,
    subscriptionService,
    exchangeRateService,

    eventProcessor
}
