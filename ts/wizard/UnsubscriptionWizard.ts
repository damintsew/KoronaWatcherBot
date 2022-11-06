import {Menu, MenuRange} from "@grammyjs/menu";
import {NewContext} from "../bot_config/Domain";
import {findCountryByCode} from "../service/FlagUtilities";
import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {SubscriptionScheduledData} from "../entity/SubscriptionScheduledData";
import {TimeUnit} from "../entity/TimeUnit";
import {BaseSubscription} from "../entity/subscription/BaseSubscription";
import {GarantexSubscription} from "../entity/subscription/GarantexSubscription";
import {Container} from "typedi";
import {PaymentSubscriptionService} from "../service/PaymentSubscriptionService";
import moment from "moment";
import {SubscriptionService} from "../service/SubscriptionService";
import {KoronaGarantexSpreadSubscription} from "../entity/subscription/KoronaGarantexSpreadSubscription";
import {KoronaGarantexSpreadService} from "../service/KoronaGarantexSpreadService";

const paymentSubscriptionService = Container.get(PaymentSubscriptionService)
const subscriptionService = Container.get(SubscriptionService);
const koronaGarantexSpreadService = Container.get(KoronaGarantexSpreadService)

const unsubscribeMenu = new Menu<NewContext>('unsubscription-wizard')
unsubscribeMenu.dynamic(async (ctx) => {
    const range = new MenuRange<NewContext>()

    const thresholdSubscriptions = await subscriptionService.getThresholdSubscriptionsByUser(ctx.user.userId) //as SubscriptionThresholdData[]
    for (const subscription of thresholdSubscriptions) {
        range.addRange(createButton(subscription))
    }

    const scheduledSubscriptions = await subscriptionService.getScheduledSubscriptionsByUser(ctx.user.userId)
    for (const subscription of scheduledSubscriptions) {
        range.addRange(createButton(subscription))
    }

    const baseSubscriptions = await subscriptionService.getBaseSubscriptions(ctx.user.userId)
    for (const subscription of baseSubscriptions) {
        range.addRange(newButton(subscription))
    }

    range.addRange(
        new MenuRange<NewContext>()
            .row()
            .text({text: 'Отмена'}, async ctx => {
                let messages = await formatUnsubscribeText(ctx.user.userId);
                messages.unshift("Существующие подписки:")
                await ctx.editMessageText(messages.join("\n"))
                return ctx.menu.close()
            }))

    return range
})

function createButton(subscription: SubscriptionThresholdData | SubscriptionScheduledData) {
    return new MenuRange<NewContext>()
        .text(
            {
                text: () => {
                    const country = findCountryByCode(subscription.country)
                    let message = `${country.flag} ${country.text}`
                    if (subscription instanceof SubscriptionThresholdData) {
                        message += " по шагу"
                    } else if (subscription instanceof SubscriptionScheduledData) {
                        message += " по времени"
                    }
                    return message;
                },
                payload: subscription.id.toString()
            },
            async ctx => {
                if (subscription instanceof SubscriptionThresholdData) {
                    await subscriptionService.removeThresholdById(Number.parseInt(ctx.match))
                } else if (subscription instanceof SubscriptionScheduledData) {
                    await subscriptionService.removeScheduledById(Number.parseInt(ctx.match))
                }

                const msg = await formatUnsubscribeText(ctx.user.userId)
                return ctx.editMessageText(msg.join("\n"), {
                    parse_mode: 'HTML',
                })
            })
        .row()
}

function newButton(subscription: BaseSubscription) {
    return new MenuRange<NewContext>()
        .text(
            {
                text: () => formatButtonText(subscription),
                payload: subscription.id.toString()
            },
            async ctx => {
                await subscriptionService.removeBaseSubscription(Number.parseInt(ctx.match))

                const msg = await formatUnsubscribeText(ctx.user.userId)
                return ctx.editMessageText(msg.join("\n"), {
                    parse_mode: 'HTML',
                })
            })
        .row()
}

function formatTextMessage(s: BaseSubscription) {
    if (s instanceof GarantexSubscription) {
        return `Garantex: ${s.market} уведомлять при изменении на ${s.notificationThreshold}`
    }
    if (s instanceof KoronaGarantexSpreadSubscription) {
        return koronaGarantexSpreadService.formatTextMessage(s)
    }
}

function formatButtonText(s: BaseSubscription) {
    if (s instanceof GarantexSubscription) {
        return `Garantex: ${s.market} изменение на ${s.notificationThreshold}`
    }
    if (s instanceof KoronaGarantexSpreadSubscription) {
        return koronaGarantexSpreadService.formatButtonText(s)
    }
}

async function formatUnsubscribeText(userId: number) {
    const messages = []
    const thresholdSubscriptions = await subscriptionService.getThresholdSubscriptionsByUser(userId) //as SubscriptionThresholdData[]
    for (const subscription of thresholdSubscriptions) {
        messages.push(formatText(subscription))
    }

    const scheduledSubscriptions = await subscriptionService.getScheduledSubscriptionsByUser(userId) //as SubscriptionThresholdData[]
    for (const subscription of scheduledSubscriptions) {
        messages.push(formatText(subscription))
    }

    const baseSubscriptions = await subscriptionService.getBaseSubscriptions(userId)
    for (const subscription of baseSubscriptions) {
        messages.push(formatTextMessage(subscription))
    }

    const paymentSubs = await paymentSubscriptionService.getActiveSubscription(userId)
    if (paymentSubs.length > 0) {
        messages.push("", "Платные подписки:")
        for (let paym of paymentSubs) {
            let msg = `${paym.type}, заканчивается ${moment(paym.expirationDate).format("DD.MM.YYY HH:ss")}`
            if (paym.trial) {
                msg += " Триальная подписка"
            }
            messages.push(msg)
        }
    } else {
        messages.push("", "У вас нет платных подписок.")
    }

    return messages;
}

function formatText(subscription: SubscriptionThresholdData | SubscriptionScheduledData) {
    const country = findCountryByCode(subscription.country)
    let message = `${country.flag} ${country.text}`
    if (subscription instanceof SubscriptionThresholdData) {
        message += ` шаг срабатывания ${subscription.notificationThreshold}`
    } else if (subscription instanceof SubscriptionScheduledData) {
        message += ` время оповещения: ${concatDates(subscription.triggerTime)}`
    }

    return message;
}

function concatDates(timeUnits: TimeUnit[]) {
    return timeUnits.map(time => time.timeHours).join(",")
}

export {unsubscribeMenu, formatUnsubscribeText}
