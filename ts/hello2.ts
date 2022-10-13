import {Bot, Context, session, SessionFlavor} from 'grammy'
import {Menu, MenuRange} from '@grammyjs/menu'
import {countries} from "./service/FlagUtilities";
import {SubscriptionThresholdData} from "./entity/SubscriptionThresholdData";
import {SubscriptionData} from "./entity/SubscriptionData";
import {User} from "./entity/User";
import {SubscriptionScheduledData} from "./entity/SubscriptionScheduledData";
import {TimeUnit} from "./entity/TimeUnit";
import {NewContext, SessionData} from "./bot_config/Domain2";
import mainMenu from "./wizard/NewSubscriptionWizard";
import {UserService} from "./service/UserService";


/**
 * All known dishes. Users can rate them to store which ones are their favorite
 * dishes.
 *
 * They can also decide to delete them. If a user decides to delete a dish, it
 * will be gone for everyone.
 */

const userService = new UserService()

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
        ctx.user = new User(); // todo
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

bot.catch(console.error.bind(console))
bot.start()
