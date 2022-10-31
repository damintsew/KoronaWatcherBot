import 'reflect-metadata';
import {Bot, session} from 'grammy'
import {MyConversation, NewContext, SessionData} from "./bot_config/Domain2";
import {koronaSubscriptionMenu} from "./wizard/KoronaSubscriptionWizard";
import {exchangeRateService, userService} from "./DiContainer";
import {ds} from "./data-source";
import {formatUnsubscribeText, unsubscribeMenu} from "./wizard/UnsubscriptionWizard";
import {conversations, createConversation,} from "@grammyjs/conversations";
import {GrammyError, HttpError, Keyboard} from '@grammyjs/conversations/out/deps.node';
import {
    garantexCreateSubscription,
    garantexOnlySubscription,
    garantexSubscriptionMenu
} from "./wizard/GarantexSubscriptionWizard";
import {spreadConversation, spreadSubscriptionMenu} from "./wizard/SpreadSubscriptionWizard";
import {Container} from "typedi";

(async function () {
    await ds.initialize(); //todo get rid of this
})()

const bot = Container.get(Bot) as Bot<NewContext>;

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
        .text("В разработке: Получение Спредов ЗК + Garantex").row()
        .text("Отмена")
        .oneTime()
        .resized();
    await ctx.reply('Выберите подписку', {reply_markup: keyboard})

    const titleCtx = await conversation.waitFor("message:text");
    if (titleCtx.msg.text == "Подписка на курс: Золотая Корона") {
        return ctx.reply("Создание новой подписки:", {reply_markup: koronaSubscriptionMenu})
    }
    if (titleCtx.msg.text == "Подписка на курс: Garantex") {
        return garantexCreateSubscription(conversation, ctx);
    }
    if (titleCtx.msg.text == "В разработке: Получение Спредов ЗК + Garantex") {
        return ctx.reply("В разработке! Скоро будет!", {reply_markup: {remove_keyboard: true}});
        // return spreadConversation(conversation, ctx)
    }
    return ctx.reply("", {reply_markup: {remove_keyboard: true}});
}

bot.use(koronaSubscriptionMenu)
bot.use(garantexSubscriptionMenu)
bot.use(spreadSubscriptionMenu)
bot.use(unsubscribeMenu)

bot.use(conversations());
bot.use(createConversation(movie, "subscription-main"));
bot.use(createConversation(garantexOnlySubscription, "garantex-only-trial-subscription"));
bot.use(createConversation(spreadConversation, "spread-subscription"));

bot.command('rates', async (ctx) => {
    await exchangeRateService.getAllRates(ctx)
})

bot.command('subscribe', async ctx => {
    await ctx.conversation.enter("subscription-main");
})

bot.command('payments', async ctx => {
    await ctx.conversation.enter("garantex-only-trial-subscription");
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
        '/subscribe чтобы подписаться на уведомления. \n' +
        '/unsubscribe - отписаться. \n' +
        '/list показывает активные подписки \n' +
        '/help для помощи\n' +
        '/support ссылка на группу помощи по боту.\n' +
        'За помощью, вопросами и предложениями по работе бота пишите в группу @KoronaWatcherSupportBot'

    await ctx.reply(text)
})

bot.command('debug', async ctx => {
    await ctx.reply(`userId = ${ctx.user.userId}`)
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
