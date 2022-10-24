import {Menu, MenuRange} from "@grammyjs/menu";
import {countries} from "../service/FlagUtilities";
import {SubscriptionScheduledData} from "../entity/SubscriptionScheduledData";
import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {TimeUnit} from "../entity/TimeUnit";
import {MyConversation, NewContext} from "../bot_config/Domain2";
import {subscriptionService} from "../DiContainer";
import {Keyboard} from "@grammyjs/conversations/out/deps.node";
import {koronaSubscriptionMenu} from "./KoronaSubscriptionWizard";
import {PaymentSubscription} from "../entity/PaymentSubscription";
import moment from "moment/moment";
import {ds} from "../data-source";
import {unsubscribeMenu} from "./UnsubscriptionWizard";
import {GarantexSubscription} from "../entity/subscription/GarantexSubscription";
import {QueryFailedError} from "typeorm";
import {KoronaGarantexSpreadService} from "../service/KoronaGarantexSpreadService";
import {KoronaGarantexSpreadSubscription} from "../entity/subscription/KoronaGarantexSpreadSubscription";
import {SpreadReferenceData} from "../entity/subscription/SpreadReferenceData";

/** This is how the dishes look that this bot is managing */
interface Dish { //todo rename
    text: string,
    id: string,
    selected: boolean
}

async function spreadConversation(conversation: MyConversation, ctx: NewContext) {

    if (ctx.user.subscriptions == null || ctx.user.subscriptions.length == 0) {
        const keyboard = new Keyboard()
            .text("Да")
            .text("Отмена").row()
            .oneTime()
            .resized();
        await ctx.reply('Данная функциф платная - стоимость подписки 1 usdt/месяц\n' +
            'У вас доступна триальная версия - в течении 7 дней.\n' +
            'Желаете продолжить ?', {reply_markup: keyboard})


        const answer = await conversation.waitFor("message:text");

        if (answer.msg.text == "Да") {
            const trialSubscription = new PaymentSubscription(); // todo move to Subscr service
            trialSubscription.type ="GARANTEX-SPREAD"
            trialSubscription.trial = true
            trialSubscription.startDate = new Date()
            trialSubscription.expirationDate = moment().add(7, "d").toDate()
            trialSubscription.user = ctx.user

            await ds.manager.save(trialSubscription)
            await ctx.reply("Триал оформлен. В случае проблем пишите в /support")
            await ctx.reply("Оформление подписки Garantex", {reply_markup: spreadSubscriptionMenu})
            // todo move to subcription
        } else if (answer.msg.text == "Нет") {
            return ctx.reply("Отменяю") //todo remove keyboard
        }
    }

    const activeTrial = findPredicate(ctx.user.subscriptions,
        s => s.trial && s.type == "GARANTEX-SPREAD")
    if (activeTrial) {
        await ctx.reply("Оформление подписки Garantex", {reply_markup: spreadSubscriptionMenu})
        return;
    }

    const activeGarantexSubscription = findPredicate(ctx.user.subscriptions,
        s => s.type == "GARANTEX-SPREAD")
    if (activeGarantexSubscription) {
        await ctx.reply("Оформление подписки Garantex", {reply_markup: spreadSubscriptionMenu})
        return;
    }


    return ctx.reply("Ваша подписка кончилась! Оплатите подписку", {reply_markup: {remove_keyboard: true}});
}

const spreadSubscriptionMenu = new Menu<NewContext>('spread-subscription-menu')
spreadSubscriptionMenu.dynamic(() => {

    // todo duplicate
    const range = new MenuRange<NewContext>()
    range.addRange(createDishMenu("1 рубль", "100"))
    range.addRange(createDishMenu("75 копеек", "75").row())
    range.addRange(createDishMenu("50 копеек", "50"))
    range.addRange(createDishMenu("25 копеек", "25").row())
    range.addRange(createDishMenu("10 копеек", "10"))
    range.addRange(createDishMenu("5 копеек", "5").row())
    range.addRange(createDishMenu("1 копейка", "1")) // todo ugly function calls
    range.addRange(
        new MenuRange<NewContext>()
            .row()
            .back({text: 'Back'}))

    return range
})

/** Creates a menu that can render any given dish */
function createDishMenu(text: string, payload: string) {
    return new MenuRange<NewContext>()
        .text(
            {text: text, payload: payload},
            async ctx => {
                const sp = new SpreadReferenceData()
                sp.country = "TUR"

                ctx.session.subscriptionData = new KoronaGarantexSpreadSubscription()
                ctx.session.subscriptionData.user = ctx.user
                ctx.session.subscriptionData.notificationThreshold = Number.parseInt(ctx.match)
                ctx.session.subscriptionData.type = "SPREAD"
                ctx.session.subscriptionData.referenceData = [sp]
                // ctx.session.subscriptionData.market = "usdtrub"

                let message;
                let success = false;

                try {
                    await subscriptionService.saveNewSubscription(ctx.session.subscriptionData)
                    message = "Оповещать при изменении цены на " + text
                    success = true
                } catch (e) {
                    console.log(e)
                    if (e instanceof QueryFailedError) {
                        if (e.driverError?.code == "23505") {
                            message = "У вас уже существует подписка на этот сервис. Отпишитесь сначала /unsubscribe"
                        }
                    } else {
                        message = "Произошла неизвесnная ошибка. Если она будет повторяться, то пишите в /support"
                    }
                }
                await ctx.editMessageText(message)
                if (success) {
                    await ctx.reply("Подписка успешно сохранена")
                }
                return ctx.menu.close()
            }
        )
}

function findPredicate(subscriptions: PaymentSubscription[], predicate: (s: PaymentSubscription) => {}) {
    for (let s of findActiveSubscriptions(subscriptions)) {
        if (predicate(s)) {
            return s
        }
    }
    return null
}

function findActiveSubscriptions(subscriptions: PaymentSubscription[]) {
    const result = []
    const now = moment()
    for (let s of subscriptions) {
        if (now.isBetween(s.startDate, s.expirationDate)) {
            result.push(s)
        }
    }

    return result;
}

export {spreadSubscriptionMenu, spreadConversation}

