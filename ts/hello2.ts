import {Bot, session} from 'grammy'
import {NewContext, SessionData} from "./bot_config/Domain2";
import {mainMenu} from "./wizard/NewSubscriptionWizard";
import {exchangeRateService, userService} from "./DiContainer";
import {ds} from "./data-source";
import {formatUnsubscribeText, unsubscribeMenu} from "./wizard/UnsubscriptionWizard";


/**
 * All known dishes. Users can rate them to store which ones are their favorite
 * dishes.
 *
 * They can also decide to delete them. If a user decides to delete a dish, it
 * will be gone for everyone.
 */

(async function () {
    await ds.initialize(); //todo get rid of this
})()

const bot = new Bot<NewContext>('5220606033:AAFvlqk47pUZgnQKn4_NVhigzz3Sx3WfZzs')

bot.api.setMyCommands([
    {command: 'rates', description: 'Показать текущий курс'},
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
        ctx.user = user
    }
    await next();
});

bot.use(mainMenu)
bot.use(unsubscribeMenu)

bot.command('rates', async (ctx) => {
    await exchangeRateService.getAllRates(ctx)
})

bot.command('subscribe',
    ctx => ctx.reply("Выберите подписку для удаления:", {reply_markup: mainMenu}))
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

bot.command('help', async ctx => {
    const text = 'Привет!\n Я показываю курсы валют в Золотой Короне.\n' +
        '/subscribe чтобы подписаться на уведомления. \n/unsubscribe - отписаться. \n/list показывает активные подписки \n/help для помощи\n' +
        'За помощью, вопросами и предложениями по работе бота пишите в группу @KoronaWatcherSupportBot'

    await ctx.reply(text)
})

bot.catch(console.error.bind(console))
bot.start()
