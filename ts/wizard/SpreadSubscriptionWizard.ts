import {Menu, MenuRange} from "@grammyjs/menu";
import {countries} from "../service/FlagUtilities";
import {MyConversation, NewContext} from "../bot_config/Domain";
import {QueryFailedError} from "typeorm";
import {KoronaGarantexSpreadSubscription} from "../entity/subscription/KoronaGarantexSpreadSubscription";
import {SpreadReferenceData} from "../entity/subscription/SpreadReferenceData";
import {Container} from "typedi";
import {SubscriptionService} from "../service/SubscriptionService";
import {PaymentValidationWizard} from "./PaymentValidationWizard";

/** This is how the dishes look that this bot is managing */
interface Dish { //todo rename
    text: string,
    id: string,
    selected: boolean
}

const paymentValidationWizard = Container.get(PaymentValidationWizard);
const subscriptionService = Container.get(SubscriptionService);

async function spreadConversation(conversation: MyConversation, ctx: NewContext) {
    return paymentValidationWizard.trialValidator(conversation, ctx, {
        subscriptionId: "SPREAD",
        price: "2",
        subscriptionText: "Спреды",
        onSuccess: null,
        startNewSubscription: async (ctx: NewContext) => {
            await ctx.reply("Каким образом уведомлять?\n" +
                "  При изменени значения спреда: например изменился спред на 0.25%\n" +
                "  При достижении определенного занчения: например когда спред стал 1.5%\n",
                {reply_markup: spreadSubscriptionMenu})
        }
    })
}

async function spreadOnlySubscribe(conversation: MyConversation, ctx: NewContext) {
    return paymentValidationWizard.trialValidator(conversation, ctx, {
        subscriptionId: "SPREAD",
        price: "2",
        subscriptionText: "Спреды",
        onSuccess: null,
        startNewSubscription: null
    })
}

const spreadSubscriptionMenu = new Menu<NewContext>('spread-subscription-menu')
spreadSubscriptionMenu.dynamic(() => {

    // todo duplicate
    const range = new MenuRange<NewContext>()
    range.submenu(
        {text: `Изменение значения`, payload: "SPREAD_CHANGE"},
        'spread-change-subscription-menu',
        ctx => {
            ctx.session.message = `Создание новой подписки:\n\nПри изменении значения:`
            return ctx.editMessageText(ctx.session.message, {
                parse_mode: 'HTML',
            })
        }
    )
    range.submenu(
        {text: `Достижение значения`, payload: "SPREAD_ABSOLUTE_VALUE"},
        'spread-absolute-subscription-menu',
        ctx => {
            ctx.session.message = `Создание новой подписки:\n\nПо достижению значения:`
            return ctx.editMessageText(ctx.session.message, {
                parse_mode: 'HTML',
            })
        }
    )
        .row()

    return range
})

const spreadChangeSubscriptionMenu = new Menu<NewContext>('spread-change-subscription-menu')
spreadChangeSubscriptionMenu.dynamic(() => {

    // todo duplicate
    const range = new MenuRange<NewContext>()
    range.addRange(createDishMenu("1%", "1", "SPREAD_CHANGE"))
    range.addRange(createDishMenu("0.75 %", "0.75", "SPREAD_CHANGE").row())
    range.addRange(createDishMenu("0.50 %", "0.50", "SPREAD_CHANGE"))
    range.addRange(createDishMenu("0.25 %", "0.25", "SPREAD_CHANGE").row())
    range.addRange(createDishMenu("0.10 %", "0.1", "SPREAD_CHANGE"))
    range.addRange(createDishMenu("0.05 %", "0.05", "SPREAD_CHANGE").row())
    range.addRange(createDishMenu("0.01 %", "0.01", "SPREAD_CHANGE")) // todo ugly function calls
    range.addRange(
        new MenuRange<NewContext>()
            .row()
            .back({text: 'Back'}))

    return range
})

const spreadAbsoluteSubscriptionMenu = new Menu<NewContext>('spread-absolute-subscription-menu')
spreadAbsoluteSubscriptionMenu.dynamic(() => {

    // todo duplicate
    const range = new MenuRange<NewContext>()
    range.addRange(createDishMenu("2.5 %", "2.5", "SPREAD_ABSOLUTE_VALUE"))
    range.addRange(createDishMenu("2 %", "2", "SPREAD_ABSOLUTE_VALUE").row())
    range.addRange(createDishMenu("1.75 %", "1.75", "SPREAD_ABSOLUTE_VALUE"))
    range.addRange(createDishMenu("1.5 %", "1.5", "SPREAD_ABSOLUTE_VALUE").row())
    range.addRange(createDishMenu("1.25 %", "1.25", "SPREAD_ABSOLUTE_VALUE"))
    range.addRange(createDishMenu("1 %", "1", "SPREAD_ABSOLUTE_VALUE").row())
    range.addRange(createDishMenu("0.5 %", "0.5", "SPREAD_ABSOLUTE_VALUE")) // todo ugly function calls
    range.addRange(
        new MenuRange<NewContext>()
            .row()
            .back({text: 'Back'}))

    return range
})

function createDishMenu(text: string, payload: string, changeType: string) {
    return new MenuRange<NewContext>()
        .text(
            {text: text, payload: payload},
            async ctx => {
                ctx.session.subscriptionData = new KoronaGarantexSpreadSubscription()
                ctx.session.subscriptionData.user = ctx.user
                ctx.session.subscriptionData.notificationThreshold = Number.parseFloat(payload)
                ctx.session.subscriptionData.type = "SPREAD"
                ctx.session.subscriptionData.changeType = changeType
                ctx.session.subscriptionData.referenceData = staticReferenceDates()

                let message;
                let success = false;

                try {
                    await subscriptionService.saveNewSubscription(ctx.session.subscriptionData)
                    if (changeType == "SPREAD_CHANGE") {
                        message = "Оповещать при изменении спреда на " + text
                    } else {
                        message = "Оповещать при достижении спреда " + text
                    }
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
                    await ctx.reply("Подписка успешно сохранена", {reply_markup: {remove_keyboard: true}})
                }
                return ctx.menu.close()
            }
        )
}

const staticReferenceDates = () => {
    const res = []
    for (const c of countries) {
        if (c.isActive) {
            res.push(spreadRef(c.code))
        }
    }

    return res;
}

function spreadRef(country: string) {
    const sp = new SpreadReferenceData()
    sp.country = country

    return sp;
}

spreadSubscriptionMenu.register(spreadAbsoluteSubscriptionMenu)
spreadSubscriptionMenu.register(spreadChangeSubscriptionMenu)

export {spreadSubscriptionMenu, spreadConversation, spreadOnlySubscribe}

