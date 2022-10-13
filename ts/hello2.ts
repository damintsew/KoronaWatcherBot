import {Bot, session} from 'grammy'
import {NewContext, SessionData} from "./bot_config/Domain2";
import {mainMenu} from "./wizard/NewSubscriptionWizard";
import {UserService} from "./service/UserService";
import {UserDao} from "./dao/UserDao";
import {subscriptionService, userService} from "./DiContainer";
import {ds} from "./data-source";
import {TimeUnit} from "./entity/TimeUnit";
import {mapCountryToFlag} from "./service/FlagUtilities";


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

bot.command('subscribe', ctx => ctx.reply("Создание новой подписки", {reply_markup: mainMenu}))
bot.command('help', async ctx => {
    const text =
        'Send /start to see and rate dishes. Send /fav to list your favorites!'
    await ctx.reply(text)
})

bot.command('list', async (ctx) => {
    function concatDates(timeUnits: TimeUnit[]) {
        return timeUnits.map(time => time.timeHours).join(",")
    }

    let subscriptionsByThreshold = await subscriptionService.getThresholdSubscriptionsByUser(ctx.user.userId)
    const lines = []
    lines.push("Активные подписки:")

    if (subscriptionsByThreshold.length > 0) {
        lines.push( "Подписка по изменению цены:")
        lines.push(...subscriptionsByThreshold
            .map(s => ` - ${mapCountryToFlag(s.country)} шаг срабатывания: ${s.notificationThreshold}`))

        lines.push("")
    }
    let scheduledSubscriptions = await subscriptionService.getScheduledSubscriptionsByUser(ctx.user.userId)
    if (scheduledSubscriptions.length > 0) {
        lines.push("Подписка по времени:")
        for(let s of scheduledSubscriptions) {
            lines.push(`\t - ${mapCountryToFlag(s.country)} время оповещения: ${concatDates(s.triggerTime)}`)
        }
        lines.push("")
    }

    lines.push("Чтобы отписаться команда /unsubscribe")

    await ctx.reply(lines.join("\n"))
})

bot.catch(console.error.bind(console))
bot.start()
