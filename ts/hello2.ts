import {session} from 'grammy'
import {NewContext, SessionData, MyConversation} from "./bot_config/Domain2";
import {koronaSubscriptionMenu} from "./wizard/KoronaSubscriptionWizard";
import {bot, exchangeRateService, userService} from "./DiContainer";
import {ds} from "./data-source";
import {formatUnsubscribeText, unsubscribeMenu} from "./wizard/UnsubscriptionWizard";
import {conversations, createConversation,} from "@grammyjs/conversations";
import {Keyboard} from '@grammyjs/conversations/out/deps.node';
import {garantexConversation, garantexSubscriptionMenu} from "./wizard/GarantexSubscriptionWizard";

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

async function movie(conversation: MyConversation, ctx: NewContext) {
    const keyboard = new Keyboard()
        .text("Подписка на курс: Золотая Корона").row()
        .text("Подписка на курс: Garantex").row()
        .text("Скоро будет! Получение Спредов ЗК + Garantex").row()
        .text("Отмена")
        .oneTime()
        .resized();
    await ctx.reply('Выберите подписку', {reply_markup: keyboard})

    const titleCtx = await conversation.waitFor("message:text");
    if (titleCtx.msg.text == "Подписка на курс: Золотая Корона") {
        return ctx.reply("Создание новой подписки:", {reply_markup: koronaSubscriptionMenu})
    }
    if (titleCtx.msg.text == "Подписка на курс: Garantex") {
        // await ctx.conversation.exit()
        return garantexConversation(conversation, ctx);
    }
    if (titleCtx.msg.text == "Скоро будет! Получение Спредов ЗК + Garantex") {
        return ctx.reply("В процессе разработки. Ожидайте оповещение!", {reply_markup: {remove_keyboard: true}})
    }
    return ctx.reply("", {reply_markup: {remove_keyboard: true}});
}

bot.use(koronaSubscriptionMenu)
bot.use(garantexSubscriptionMenu)
bot.use(unsubscribeMenu)

bot.use(conversations());
bot.use(createConversation(movie, "subscription-main"));
bot.use(createConversation(garantexConversation, "garantex-subscription"));

bot.command('rates', async (ctx) => {
    await exchangeRateService.getAllRates(ctx)
})

bot.command('subscribe', async ctx => {
    await ctx.conversation.enter("subscription-main");
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

bot.command('help', async ctx => {
    const text = 'Привет!\n Я показываю курсы валют в Золотой Короне.\n' +
        '/subscribe чтобы подписаться на уведомления. \n/unsubscribe - отписаться. \n/list показывает активные подписки \n/help для помощи\n' +
        'За помощью, вопросами и предложениями по работе бота пишите в группу @KoronaWatcherSupportBot'

    await ctx.reply(text)
})

bot.catch(console.error.bind(console))
bot.start()
