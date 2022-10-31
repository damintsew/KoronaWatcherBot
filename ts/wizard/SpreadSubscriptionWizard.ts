import {Menu, MenuRange} from "@grammyjs/menu";
import {countries} from "../service/FlagUtilities";
import {SubscriptionScheduledData} from "../entity/SubscriptionScheduledData";
import {TimeUnit} from "../entity/TimeUnit";
import {MyConversation, NewContext} from "../bot_config/Domain2";
import {Keyboard} from "@grammyjs/conversations/out/deps.node";
import {PaymentSubscription} from "../entity/PaymentSubscription";
import moment from "moment/moment";
import {ds} from "../data-source";
import {QueryFailedError} from "typeorm";
import {KoronaGarantexSpreadSubscription} from "../entity/subscription/KoronaGarantexSpreadSubscription";
import {SpreadReferenceData} from "../entity/subscription/SpreadReferenceData";
import {Container} from "typedi";
import {SubscriptionService} from "../service/SubscriptionService";

/** This is how the dishes look that this bot is managing */
interface Dish { //todo rename
    text: string,
    id: string,
    selected: boolean
}

const subscriptionService = Container.get(SubscriptionService);

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
range.addRange(createDishMenu("1%", "1"))
    range.addRange(createDishMenu("0.75 %", "0.75").row())
    range.addRange(createDishMenu("0.50 %", "0.50"))
    range.addRange(createDishMenu("0.25 %", "0.25").row())
    range.addRange(createDishMenu("0.10 %", "0.1"))
    range.addRange(createDishMenu("0.05 %", "0.05").row())
    range.addRange(createDishMenu("0.01 %", "0.01")) // todo ugly function calls
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

const scheduledMenu = new Menu<NewContext>('time-subscription')
scheduledMenu.dynamic(ctx => {

    const range = new MenuRange<NewContext>()
    let i = 1;
    for (let country of countries) {
        const time = ctx.session.selectedSubscriptionButtons[country.code]
        range.addRange(createTimeButtonMenu(time.text, time.id))
        if (i % 2 == 0) { // todo looks ugly
            range.row()
        }
        i++;
    }
    range.addRange(
        new MenuRange<NewContext>()
            .row()
            .addRange(
                new MenuRange<NewContext>().text(
                    'Save',
                    async ctx => {
                        let subscriptionData = ctx.session.subscriptionData;
                        if (subscriptionData instanceof SubscriptionScheduledData) {
                            subscriptionData.triggerTime = Object.values(ctx.session.selectedSubscriptionButtons)
                                .filter((selected: Dish) => selected.selected)
                                .map((selectedOptions: Dish) => {
                                    const unit = new TimeUnit();
                                    unit.timeHours = Number.parseInt(selectedOptions.id)

                                    //todo remove instanceof
                                    if (subscriptionData instanceof SubscriptionScheduledData) {
                                        unit.subscription = subscriptionData
                                    }

                                    return unit
                                })

                            subscriptionData.user = ctx.user
                            subscriptionData.type = "KORONA"

                            console.log(subscriptionData)
                            await subscriptionService.saveSubscription(subscriptionData)
                        }
                        await ctx.reply("Подписка успешно сохранена")
                        return ctx.menu.close()
                    })))
    range.addRange(
        new MenuRange<NewContext>()
            .row()
            .back({text: 'Back'}))

    return range
})

function createTimeButtonMenu(text: string, payload: string) {
    return new MenuRange<NewContext>()
        .text(
            {
                text: ctx => {
                    const timeSlot = ctx.session.selectedSubscriptionButtons[payload]
                    return timeSlot.selected ? `✅${timeSlot.text}` : timeSlot.text
                }, payload: payload
            },
            async ctx => {
                const timeSlot = ctx.session.selectedSubscriptionButtons[ctx.match as string]
                timeSlot.selected = !timeSlot.selected
                return ctx.menu.update()
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

