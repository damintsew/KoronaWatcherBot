import {Composer, Markup, Scenes, session, Telegraf, Telegram} from 'telegraf'
import {MyContext} from "./Domain";
import {User} from "./entity/User";
import {ds} from "./data-source";
import {SubsriptionData} from "./entity/SubsriptionData";
import {CronJobService} from "./CronJobService";
import {NotificationService} from "./dto/NotificationService";
import {env} from "node:process";
import {MessageAnouncerService} from "./MessageAnouncerService";
import {SubscriptionService} from "./service/SubscriptionService";
import {SubscriptionWizard} from "./wizard/SubscriptionWizard";


(async function () {
    await ds.initialize(); //todo get rid of this
})()

const token = env.TG_TOKEN
if (token === undefined) {
    throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf<MyContext>(token)

const subscriptionService = new SubscriptionService();

let tg = new Telegram(token);
tg.deleteMyCommands()
    .then(() => tg.setMyCommands([
        {command: 'subscribe', description: 'Подписаться на уведомления'},
        {command: 'list', description: 'Список подписок'},
        {command: 'unsubscribe', description: 'Отписаться от уведомлений'},
        {command: 'help', description: 'Список моих возможностей'}
    ]));


const subscribeWizardService = new SubscriptionWizard();

const unsubscribeWizard = new Scenes.WizardScene<MyContext>(
    'unsubscribe-wizard',
    async (ctx) => {
        let subscriptions = await subscriptionService.getUserSubscriptions(ctx.session.user.userId)
        let keyboard = [];
        let replyLines = []
        replyLines.push("Активные подписки:")
        for (let [i, s] of subscriptions.entries()) {
            const text = `${i+1}: ${NotificationService.mapCountryToFlag(s.country)} шаг срабатывания: ${s.notificationThreshold}`
            keyboard.push(Markup.button.text(text))
            replyLines.push(text)
        }
        keyboard.push(Markup.button.text("Отмена"))

        ctx.scene.session.activeSubscriptions = subscriptions;

        await ctx.replyWithMarkdown(replyLines.join("\n"),
            Markup.keyboard(keyboard))
        return ctx.wizard.next()
    },
    async (ctx) => {
        // @ts-ignore todo remove ignore
        let reply = ctx.message.text as string;
        try {
            if (reply === "Отмена") {
                await ctx.reply("Отменяю.", Markup.removeKeyboard())
                return ctx.scene.leave();
            }

            const selectedIndex = Number.parseInt(reply.substring(0, 1)) - 1
            const subscriptions = ctx.scene.session.activeSubscriptions

            if (selectedIndex > subscriptions.length) {
                throw new Error("Wrong index") //todo leave like this or refactor?
            }

            let subscriptionToRemove = subscriptions[selectedIndex];
            await subscriptionService.remove(subscriptionToRemove);
            await ctx.reply("Подписка удалена", Markup.removeKeyboard())

            return ctx.scene.leave();

        } catch (e) {
            await ctx.reply("Повторите ввод")
        }
    });

const stage = new Scenes.Stage<MyContext>([
    subscribeWizardService.createSubscriptionWizard(), subscribeWizardService.onChangeCurrencyWizard(),
    subscribeWizardService.onScheduledTimeWizard(), unsubscribeWizard])

bot.use(session())
bot.use(stage.middleware())
bot.use(async (ctx, next) => {

    if (!ctx?.session.isUserSaved) {
        if (ctx.message == null || ctx.message.from == null || ctx.message.from.id == null) {
            return next();
        }
        const from = ctx?.message?.from;

        const userFromDB = await ds.manager.findOneBy(User, {userId: from.id});
        if (userFromDB == null) {
            const newUser = new User();

            newUser.userId = from.id
            // @ts-ignore
            newUser.chatId = ctx.message.chat.id
            newUser.username = from.username
            newUser.firstName = from.first_name
            newUser.lastName = from.last_name

            newUser.isAdmin = from.id === 152984728;

            await ds.manager.save(newUser)
            ctx.session.user = newUser;
        } else {
            ctx.session.user = userFromDB;
        }
        ctx.session.isUserSaved = true;
    }

    return next()
})

bot.command('subscribe', (ctx) => ctx.scene.enter('subscribe-wizard'))
bot.command('list', async (ctx) => {
    let subscriptions = await subscriptionService.getUserSubscriptions(ctx.session.user.userId)
    let text = "Активные подписки:\n"
    text += subscriptions.map(s => `${NotificationService.mapCountryToFlag(s.country)} шаг срабатывания: ${s.notificationThreshold}`)
        .join("\n")
    text += "\nЧтобы отписаться команда /unsubscribe"

    ctx.reply(text)
})
bot.command('unsubscribe', (ctx) => ctx.scene.enter('unsubscribe-wizard'))

bot.command('help', (ctx) => ctx.reply("/subscribe /list /unsubscribe"))
bot.command('start', (ctx) => ctx.reply('Привет!\n Я показываю курсы валют в Золотой Короне.\n' +
    '/subscribe чтобы подписаться на уведомления. \n/unsubscribe - отписаться. \n/list показывает активные подписки \n/help для помощи'));

bot.on('message',
    (ctx) => ctx.reply("Для получения списка команд и моих возможностей введите /help."))

bot.launch()

const notificationService = new NotificationService(tg)
const mas = new MessageAnouncerService(tg)
const cron = new CronJobService(notificationService, mas);

// Enable graceful stop
process.once('SIGINT', () => {
    bot.stop('SIGINT')
    cron.stop()
})
process.once('SIGTERM', () => {
    bot.stop('SIGTERM')
    cron.stop()
})
