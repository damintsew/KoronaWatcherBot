import {Menu, MenuRange} from "@grammyjs/menu";
import {countries} from "../service/FlagUtilities";
import {SubscriptionScheduledData} from "../entity/SubscriptionScheduledData";
import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {TimeUnit} from "../entity/TimeUnit";
import {NewContext} from "../bot_config/Domain2";

/** This is how the dishes look that this bot is managing */
interface Dish { //todo rename
    text: string,
    id: string,
    selected: boolean
}


const mainMenu = new Menu<NewContext>('country-selection-menu')
mainMenu.dynamic(() => {
    const range = new MenuRange<NewContext>()
    for (const country of countries) {
        range
            .submenu(
                {text: `${country.flag} ${country.text}`, payload: country.code}, // label and payload
                'subscription-type', // navigation target menu
                ctx => {
                    ctx.session.country = ctx.match
                    ctx.session.message = `Создание новой подписки:\n\n${country.flag} ${country.text}`
                    return ctx.editMessageText(ctx.session.message, {
                        parse_mode: 'HTML',
                    }) // handler
                }
            )
            .row()
    }
    return range
})

const dishMenu = new Menu<NewContext>('subscription-type')
dishMenu.dynamic(_ctx => {

    const range = new MenuRange<NewContext>()
    range.submenu(
        {text: "По времени", payload: "time"},
        "time-subscription",
        ctx => {
            const subscription = new SubscriptionScheduledData()
            subscription.country = ctx.session.country
            ctx.session.subscriptionData = subscription
            ctx.session.selectedSubscriptionButtons = createButtonsConfig()

            ctx.session.message += "\nУведомление по часам:"

            return ctx.editMessageText(ctx.session.message, {
                parse_mode: 'HTML',
            })
        }
    )
    range.submenu(
        {text: "По изменению цены", payload: "threshold"},
        "threshold-subscription",
        ctx => {
            const subscription = new SubscriptionThresholdData()
            subscription.country = ctx.session.country
            ctx.session.subscriptionData = subscription

            ctx.session.message += "\nИзменение по пороговому значению:"

            return ctx.editMessageText(ctx.session.message, {
                parse_mode: 'HTML',
            })
        }
    )

    return range
})

const threshHoldMenu = new Menu<NewContext>('threshold-subscription')
threshHoldMenu.dynamic(_ctx => {

    const range = new MenuRange<NewContext>()
    range.addRange(createDishMenu("1 рубль", "100"))
    range.addRange(createDishMenu("75 копеек", "75").row())
    range.addRange(createDishMenu("50 копеек", "50"))
    range.addRange(createDishMenu("25 копеек", "25").row())
    range.addRange(createDishMenu("10 копеек", "10"))
    range.addRange(createDishMenu("5 копеек", "5").row())
    range.addRange(createDishMenu("1 копейка", "1"))
    range.addRange(
        new MenuRange<NewContext>()
            .row()
            .back({text: 'Back'}))

    return range
})

const scheduledMenu = new Menu<NewContext>('time-subscription')
scheduledMenu.dynamic(ctx => {

    const range = new MenuRange<NewContext>()
    let i = 1;
    for (let key in ctx.session.selectedSubscriptionButtons) {
        const time = ctx.session.selectedSubscriptionButtons[key]
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
                        }
                        subscriptionData.user = ctx.user

                        console.log(subscriptionData)
                        await ctx.reply("Подписка успешно сохранена")
                        return ctx.menu.close()
                    })))
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
                if (ctx.session.subscriptionData instanceof SubscriptionThresholdData) {
                    ctx.session.subscriptionData.notificationThreshold = Number.parseInt(ctx.match)
                }
                ctx.session.subscriptionData.user = ctx.user

                console.log(ctx.session.subscriptionData)
                ctx.session.message += " " + text

                await ctx.editMessageText(ctx.session.message, {
                    parse_mode: 'HTML',
                })
                await ctx.reply("Подписка успешно сохранена")
                return ctx.menu.close()
            }
        )
}

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

let createButtonsConfig = () => {
    return {
        "9": {text: '9:00', id: "9", selected: false},
        "10": {text: '10:00', id: "10", selected: false},
        "11": {text: '11:00', id: "11", selected: false},
        "12": {text: '12:00', id: "12", selected: false},
        "13": {text: '13:00', id: "13", selected: false},
        "14": {text: '14:00', id: "14", selected: false},
        "15": {text: '15:00', id: "15", selected: false},
        "16": {text: '16:00', id: "16", selected: false},
        "17": {text: '17:00', id: "17", selected: false},
        "18": {text: '18:00', id: "18", selected: false},
        "19": {text: '19:00', id: "19", selected: false},
        "20": {text: '20:00', id: "20", selected: false},
        "21": {text: '21:00', id: "21", selected: false},
        "22": {text: '22:00', id: "22", selected: false},
    };
}

mainMenu.register(dishMenu)
mainMenu.register(threshHoldMenu)
mainMenu.register(scheduledMenu)


export default mainMenu
