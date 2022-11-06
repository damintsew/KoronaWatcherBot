import {Menu, MenuRange} from "@grammyjs/menu";
import {MyConversation, NewContext} from "../bot_config/Domain";
import {GarantexSubscription} from "../entity/subscription/GarantexSubscription";
import {QueryFailedError} from "typeorm";
import {Container} from "typedi";
import {PaymentValidationWizard} from "./PaymentValidationWizard";
import {SubscriptionService} from "../service/SubscriptionService";

const paymentValidationWizard = Container.get(PaymentValidationWizard);
const subscriptionService = Container.get(SubscriptionService);

async function garantexCreateSubscription(conversation: MyConversation, ctx: NewContext) {
    return paymentValidationWizard.trialValidator(conversation, ctx, {
        subscriptionId: "GARANTEX",
        price: "1",
        subscriptionText: "Гарантекс",
        onSuccess: {reply_markup: garantexSubscriptionMenu, remove_keyboard: true},
        startNewSubscription: null
    })
}

async function garantexOnlySubscription(conversation: MyConversation, ctx: NewContext) {
    return paymentValidationWizard.trialValidator(conversation, ctx, {
        subscriptionId: "GARANTEX",
        price: "1",
        subscriptionText: "",
        onSuccess: null,
        startNewSubscription: null
    })
}

const garantexSubscriptionMenu = new Menu<NewContext>('garantex-subscription-menu')
garantexSubscriptionMenu.dynamic(() => {

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
                ctx.session.subscriptionData = new GarantexSubscription()
                ctx.session.subscriptionData.user = ctx.user
                ctx.session.subscriptionData.notificationThreshold = Number.parseInt(ctx.match)
                ctx.session.subscriptionData.type = "GARANTEX"
                ctx.session.subscriptionData.market = "usdtrub"

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

export {garantexSubscriptionMenu, garantexCreateSubscription, garantexOnlySubscription}

