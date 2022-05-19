import {Composer, Context, Markup, Scenes, session, Telegraf, Telegram} from 'telegraf'
import {MyContext, MyWizardSession} from "./Domain";
import {getManager} from "typeorm";
import {User} from "./entity/User";
import {DBConnection} from "./DBConnection";
import {SubsriptionData} from "./entity/SubsriptionData";
import {CronJobService} from "./CronJobService";
import {NotificationService} from "./dto/NotificationService";
import {env} from "node:process";
import {MessageAnouncerService} from "./MessageAnouncerService";

DBConnection.getConnection();

const token = env.TG_TOKEN  //prod
if (token === undefined) {
    throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf<MyContext>(token)

let tg = new Telegram(token);
tg.deleteMyCommands()
    .then(() => tg.setMyCommands([
        {command: 'subscribe', description: 'Подписаться на уведомления'},
        {command: 'unsubscribe', description: 'Отписаться от уведомлений'},
        {command: 'help', description: 'Список моих возможностей'}
    ]));


const stepHandler = new Composer<MyContext>()

function text(value: string) {
    return 'Буду уведомлять при изменении цены больше чем на ' + value;
}

async function saveSubscription(subscriptionData: SubsriptionData) {
    const entityManager = getManager(); // you can also get it via getConnection().manager
    try {
        await entityManager.save(subscriptionData);
    } catch (e) {
        console.log("This subscription already exists", e)
    }
}

stepHandler.action('100', async (ctx) => {
    await ctx.reply(text('1 рубль'), Markup.removeKeyboard())
    ctx.scene.session.subscriptionData.notificationThreshold = 100;
    await saveSubscription(ctx.scene.session.subscriptionData)
    return ctx.scene.leave()
}).action('50', async (ctx) => {
    await ctx.reply(text('50 копеек'), Markup.removeKeyboard())
    ctx.scene.session.subscriptionData.notificationThreshold = 50;
    await saveSubscription(ctx.scene.session.subscriptionData)
    return ctx.scene.leave()
}).action('10', async (ctx) => {
    await ctx.reply(text('10 копеек'), Markup.removeKeyboard())
    ctx.scene.session.subscriptionData.notificationThreshold = 10;
    await saveSubscription(ctx.scene.session.subscriptionData)
    return ctx.scene.leave()
}).action('1', async (ctx) => {
    ctx.scene.session.subscriptionData.notificationThreshold = 1;
    await ctx.reply(text('1 копейку'), Markup.removeKeyboard())
    await saveSubscription(ctx.scene.session.subscriptionData)
    return ctx.scene.leave()
})

function mapCountry(countryString: string) {
   const map = {
        "➡️ Турция": "TUR",
        "➡️ Грузия": "GEO"
    }
    return map[countryString];
}

const subscribeWizard = new Scenes.WizardScene<MyContext>(
    'subscribe-wizard',
    async (ctx) => {
        ctx.scene.session.subscriptionData = new SubsriptionData();
        ctx.scene.session.subscriptionData.user = ctx.session.user;

        await ctx.replyWithMarkdown('В какую страну перевод?',
            Markup.keyboard([
                Markup.button.callback('➡️ Турция', 'turkey'),
                Markup.button.callback('➡️ Грузия', 'georgia'),
                Markup.button.callback('➡️ Добавить страну', 'add_country'),
            ]))
        return ctx.wizard.next()
    },
    async (ctx) => {
        // @ts-ignore todo remove ignore
        const countryCode = mapCountry(ctx.message.text)
        // @ts-ignore todo remove ignore
        if (ctx.message.text == "➡️ Добавить страну" || countryCode == null) {
            await ctx.reply("Введите название страны: ")
            return;
        }

        ctx.scene.session.subscriptionData.country = countryCode;
        await ctx.replyWithMarkdown('Уведомлять при изменении курса более чем на:',
            Markup.inlineKeyboard([
                Markup.button.callback('➡️ 1 рубль', "100"),
                Markup.button.callback('➡️ 50 копеек', '50'),
                Markup.button.callback('➡️ 10 копеек', '10'),
                Markup.button.callback('➡️ 1 копейка', '1'),
            ], {columns: 1}))
        return ctx.wizard.next()
    },
    stepHandler
);

const stage = new Scenes.Stage<MyContext>([subscribeWizard])

bot.use(session())
bot.use(stage.middleware())
bot.use(async (ctx, next) => {

    if (!ctx?.session.isUserSaved) {
        const entityManager = getManager(); // you can also get it via getConnection().manager
        if (ctx.message == null || ctx.message.from == null || ctx.message.from.id == null) {
            return next();
        }
        const from = ctx?.message?.from;

        const userFromDB = await entityManager.findOneBy(User, {userId: from.id});
        if (userFromDB == null) {
            const newUser = new User();

            newUser.userId = from.id
            // @ts-ignore
            newUser.chatId = ctx.message.chat.id
            newUser.username = from.username
            newUser.firstName = from.first_name
            newUser.lastName = from.last_name

            newUser.isAdmin = from.id === 152984728;

            await entityManager.save(newUser)
            ctx.session.user = newUser;
        } else {
            ctx.session.user = userFromDB;
        }
        ctx.session.isUserSaved = true;
    }

    return next()
})

bot.command('subscribe', (ctx) => ctx.scene.enter('subscribe-wizard'))
bot.command('list', (ctx) => ctx.reply("under construction"))
bot.command('unsubscribe', (ctx) => ctx.reply("under construction"))

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
