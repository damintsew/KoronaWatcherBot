import 'reflect-metadata';
import {env} from "node:process";
import {Bot, session} from 'grammy'
import {MyConversation, NewContext, SessionData} from "./bot_config/Domain";
import {conversations, createConversation,} from "@grammyjs/conversations";
import {GrammyError, HttpError, Keyboard} from '@grammyjs/conversations/out/deps.node';
import {Container} from "typedi";

const token = env.TG_TOKEN
if (token === undefined) {
    throw new Error('TG_TOKEN must be provided!')
}
const bot = new Bot<NewContext>(token)

Container.set(Bot, bot);

import {koronaSubscriptionMenu} from "./wizard/KoronaSubscriptionWizard";
import {ds} from "./data-source";
import {formatUnsubscribeText, unsubscribeMenu} from "./wizard/UnsubscriptionWizard";
import {garantexSubscriptionMenu} from "./wizard/GarantexSubscriptionWizard";
import {spreadConversation, spreadSubscriptionMenu} from "./wizard/SpreadSubscriptionWizard";
import {UserService} from "./service/UserService";
import {ExchangeRatesService} from "./service/ExchangeRatesService";
import {CronJobService} from "./service/cron/CronJobService";
import {KoronaGarantexSpreadService} from "./service/subscription/KoronaGarantexSpreadService";
import {BaseSubscriptionMenu} from "./wizard/BaseSubscriptionMenu";
import {BinanceService} from "./service/BinanceService";
import {unistreamSubscriptionMenu} from "./wizard/UnistreamSubscriptionWizard";

(async function () {
    await ds.initialize(); //todo get rid of this
})()

const userService = Container.get(UserService);
const exchangeRateService = Container.get(ExchangeRatesService);
const spreadService = Container.get(KoronaGarantexSpreadService);
const baseSubscriptionMenu = Container.get(BaseSubscriptionMenu);

bot.api.setMyCommands([
    {command: 'rates', description: 'Показать текущий курс'},
    {command: 'spread', description: 'Показать текущий спред'},
    {command: 'subscribe', description: 'Подписаться на уведомления'},
    {command: 'list', description: 'Список подписок'},
    {command: 'unsubscribe', description: 'Отписаться от уведомлений'},
    {command: 'help', description: 'Список моих возможностей'},
    {command: 'support', description: 'Вопросы / предложения'}
])

bot.use(
    session({
        initial(): SessionData {
            return {
                message: null,
                subscriptionData: null,
                country: null,
                selectedSubscriptionButtons: []
            }
        },
    })
)

bot.use(async (ctx, next) => {
    if (!ctx.user) {
        let user = await userService.getUser(ctx.from.id)
        if (user == null) {
            user = await userService.createUser(ctx.from)
        }
        if (user.deletionMark) {
            await userService.activeUser(user)
        }
        ctx.user = user
    }
    await next();
});

bot.use(unistreamSubscriptionMenu)
bot.use(koronaSubscriptionMenu)
bot.use(garantexSubscriptionMenu)
bot.use(spreadSubscriptionMenu)
bot.use(unsubscribeMenu)

bot.use(conversations());
bot.use(createConversation(baseSubscriptionMenu.createSubscriptionMenu, "subscription-main"));
bot.use(createConversation(baseSubscriptionMenu.createOnlySubscribeMenu, "base-only-subscription"));
bot.use(createConversation(spreadConversation, "spread-subscription"));

bot.command('rates', async (ctx) => {
    await exchangeRateService.getAllRates(ctx)
})

bot.command('spread', async (ctx) => {
    await spreadService.getSpread(ctx)
})

bot.command('subscribe', async ctx => {
    await ctx.conversation.enter("subscription-main");
})

bot.command('payments', async ctx => {
    await ctx.conversation.enter("base-only-subscription");
})

bot.command('unsubscribe',
    async ctx => {
        const messages = await formatUnsubscribeText(ctx.user.userId)
        messages.push("")
        messages.push("Нажмите на подписку, которую надо удалить")

        return ctx.reply(messages.join("\n"), {reply_markup: unsubscribeMenu})
    })

bot.command("list", async ctx => {
    const messages = await formatUnsubscribeText(ctx.user.userId)
    messages.unshift("Активные подписки:")
    messages.unshift("")

    messages.push("")
    messages.push("Чтобы отписаться команда /unsubscribe")

    return ctx.reply(messages.join("\n"))
})

bot.command(['help', 'start'], async ctx => {
    const text = 'Привет!\n' +
        'Я показываю курсы валют в Золотой Короне.\n' +
        '/rates курсы валют по всем странам.\n' +
        '/spread спред по бирже Гарантекс и Золотой Короне.\n' +
        '/subscribe чтобы подписаться на уведомления. \n' +
        '/unsubscribe - отписаться. \n' +
        '/list показывает активные подписки \n' +
        '/help для помощи\n' +
        '/support ссылка на группу помощи по боту.\n' +
        'За помощью, вопросами и предложениями по работе бота пишите в группу @KoronaWatcherSupportBot'

    await ctx.reply(text)
})

// const und = Container.get(UnistreamDao)
bot.command('debug', async ctx => {
    await ctx.reply(`userId = ${ctx.user.userId}`)
    // console.log(await und.getLatestTrades())
})

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e);
    } else {
        console.error("Unknown error:", e);
    }
});

bot.start()

const cronJobService = Container.get(CronJobService)


