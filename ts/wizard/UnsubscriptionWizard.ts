import {Menu, MenuRange} from "@grammyjs/menu";
import {NewContext} from "../bot_config/Domain2";
import {subscriptionService} from "../DiContainer";
import {findCountryByCode} from "../service/FlagUtilities";
import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {SubscriptionScheduledData} from "../entity/SubscriptionScheduledData";
import {TimeUnit} from "../entity/TimeUnit";
import {raw} from "express";

const unsubscribeMenu = new Menu<NewContext>('unsubscription-wizard')
unsubscribeMenu.dynamic(async (ctx) => {
    const range = new MenuRange<NewContext>()

    const thresholdSubscriptions = await subscriptionService.getThresholdSubscriptionsByUser(ctx.user.userId) //as SubscriptionThresholdData[]
    for (const subscription of thresholdSubscriptions) {
        range.addRange(createButton(subscription))
    }

    const scheduledSubscriptions = await subscriptionService.getScheduledSubscriptionsByUser(ctx.user.userId) //as SubscriptionThresholdData[]
    for (const subscription of scheduledSubscriptions) {
        range.addRange(createButton(subscription))
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
