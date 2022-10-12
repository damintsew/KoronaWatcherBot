// noinspection TypeScriptValidateJSTypes

import {Composer, Markup, Middleware, Scenes} from "telegraf";
import {MyContext, MyWizardSession} from "../Domain";
import {SubscriptionData} from "../entity/SubscriptionData";
import {ds} from "../data-source";
import {TimeUnit} from "../entity/TimeUnit";
import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {SubscriptionScheduledData} from "../entity/SubscriptionScheduledData";
import {countries, mapCountry} from "../service/FlagUtilities";
import {WizardContext, WizardContextWizard, WizardSessionData} from "telegraf/typings/scenes";

export class SubscriptionWizard {

    initialSelectionWizard(): Scenes.WizardScene<MyContext> {
        return new Scenes.WizardScene<MyContext>("platform-selection",
            async (ctx: MyContext) => {
                await ctx.replyWithMarkdown(
                    'Выберите подписку',
                    Markup.keyboard([
                        this.keyboard("Подписка на курс: Золотая Корона"),
                        this.keyboard("Подписка на курс: Garantex"),
                        this.keyboard("Получение Спредов ЗК + Garantex"),
                        this.keyboard("Отмена")
                    ]))
                return ctx.wizard.next()
            },
            async (ctx: MyContext) => {
                // @ts-ignore todo remove ignore
                if (ctx.message == null || ctx.message.text == null) {
                    await ctx.reply("Повтрите ввод")
                    return;
                }
                // @ts-ignore todo remove ignore
                if (ctx.message.text == "Отмена") {
                    await ctx.reply("Отменяю.", Markup.removeKeyboard())
                    ctx.scene.leave()
                    return;
                }

                // @ts-ignore todo remove ignore
                if (ctx.message.text === "Подписка на курс: Золотая Корона") {
                    ctx.scene.state["subscription_type"] = "KORONA"
                    ctx.scene.enter("korona-subscribe-wizard")
                }

                // @ts-ignore todo remove ignore
                if (ctx.message.text === "Подписка на курс: Garantex") {
                    ctx.scene.state["subscription_type"] = "GARANTEX"
                    ctx.scene.enter("payment-validation-wizard")
                }

                return ctx.wizard.next()
            })
    }



    createSubscriptionWizard(): Scenes.WizardScene<MyContext> {

        return new Scenes.WizardScene<MyContext>(
            'korona-subscribe-wizard',
            async (ctx) => {

                const keyboard = []
                for (let c of countries) {
                    if (c.isActive) {
                        keyboard.push(Markup.button.callback(c.text, c.code))
                    }
                }
                keyboard.push(Markup.button.callback("Отмена", "cancel"))

                await ctx.replyWithMarkdown(
                    'В какую страну перевод?',
                    Markup.keyboard(keyboard))
                return ctx.wizard.next()
            },
            async (ctx) => {
                // @ts-ignore todo remove ignore
                const countryCode = mapCountry(ctx.message?.text)
                // @ts-ignore todo remove ignore
                if (ctx.message == null || ctx.message.text == null) {
                    await ctx.reply("Повтрите ввод")
                    return;
                }
                // @ts-ignore todo remove ignore
                if (ctx.message.text == "Отмена") {
                    await ctx.reply("Отменяю.", Markup.removeKeyboard())
                    ctx.scene.leave()
                    return;
                }
                // @ts-ignore todo remove ignore
                if (countryCode == null) {
                    await ctx.reply("Введите название страны: ")
                    return;
                }

                ctx.scene.session.country = countryCode;
                await ctx.replyWithMarkdown('Каким образом оповещать:',
                    Markup.keyboard([
                        Markup.button.callback('При изменении цены', 'turkey'),
                        Markup.button.callback('По времени', 'georgia')
                    ]))
                return ctx.wizard.next()
            },
            async (ctx) => {
                // @ts-ignore todo remove ignore
                const text = ctx.message.text;

                if (text == "По времени") {
                    return ctx.scene.enter("time-selection-scene", {
                        country: ctx.scene.session.country
                    })
                } else if (text == "При изменении цены") {
                    return ctx.scene.enter("change-currency-scene", {
                        country: ctx.scene.session.country
                    })
                }
            }
        );
    }

    onChangeCurrencyWizard(): Scenes.WizardScene<MyContext> {

        return new Scenes.WizardScene<MyContext>(
            'change-currency-scene',
            async (ctx) => {
                ctx.scene.session.subscriptionData = new SubscriptionThresholdData()
                ctx.scene.session.subscriptionData.country = ctx.scene.state["country"]
                ctx.scene.session.subscriptionData.user = ctx.session.user
                // ctx.scene.session.subscriptionData.type = "ON_CHANGE"

                await ctx.replyWithMarkdown('Уведомлять при изменении курса более чем на:',
                    Markup.inlineKeyboard([
                        Markup.button.callback('➡️ 1 рубль', "100"),
                        Markup.button.callback('➡️ 50 копеек', '50'),
                        Markup.button.callback('➡️ 10 копеек', '10'),
                        Markup.button.callback('➡️ 5 копеек', '5'),
                        Markup.button.callback('➡️ 1 копейка', '1'),
                    ], {columns: 2}))
                return ctx.wizard.next()
            },
            this.stepHandler() //todo fix this awfull call
        );
    }

    onScheduledTimeWizard(): Scenes.WizardScene<MyContext> {

        const stepHandler = new Composer<MyContext>()
        stepHandler.action(/\d+/, async (ctx) => {

            const selectedTime = ctx.match[0];

            let selectedButton = ctx.scene.session.timeSelectionButtons[selectedTime];
            selectedButton.selected = !selectedButton.selected;

            const buttons = this.processSelectedButtons(ctx.scene.session.timeSelectionButtons)
            buttons.push(Markup.button.callback("Сохранить", "next"))

            ctx.editMessageText("Выберите часы, в которые вы хотели бы получать уведомления от бота.",
                Markup.inlineKeyboard(buttons, {columns: 2}))
        }).action("next", async (ctx) => {
            const selectedOptions = this.filterSelectedItems(ctx.scene.session.timeSelectionButtons)
            if (selectedOptions.length == 0) {
                //todo show notification
                ctx.answerCbQuery("Пожалуйста выберите временной слот.")
                return;
            }
            const subscriptionToCreate = ctx.scene.session.subscriptionData as SubscriptionScheduledData
            subscriptionToCreate.triggerTime = selectedOptions.map(selectedOptions => {
                const unit = new TimeUnit();
                unit.timeHours = selectedOptions.id
                unit.subscription = subscriptionToCreate

                return unit
            })
            const existingSubscriptions = await ds.getRepository(SubscriptionScheduledData)
                .createQueryBuilder("getScheduledSubscriptions")
                .innerJoinAndSelect("getScheduledSubscriptions.user", "user")
                .innerJoinAndSelect("getScheduledSubscriptions.triggerTime", "trigger")
                .where("user.userId = :userId AND country = :countryCode",
                    {userId: subscriptionToCreate.user.userId, countryCode: subscriptionToCreate.country})
                .getMany()
            for (let s of existingSubscriptions) {
                await ds.manager.remove(s.triggerTime)
                await ds.manager.remove(s)
            }
            // await ds.manager.remove(existingSubscriptions)
            await this.saveSubscription(subscriptionToCreate)
            await ctx.reply("Настройки подписки сохранены.", Markup.removeKeyboard())
        })

        return new Scenes.WizardScene<MyContext>(
            'time-selection-scene',
            async (ctx) => {
                ctx.scene.session.subscriptionData = new SubscriptionScheduledData();
                ctx.scene.session.subscriptionData.country = ctx.scene.state["country"]
                ctx.scene.session.subscriptionData.user = ctx.session.user

                ctx.scene.session.timeSelectionButtons = this.createButtonsConfig()

                const buttons = this.processSelectedButtons(ctx.scene.session.timeSelectionButtons)
                buttons.push(Markup.button.callback("Сохранить", "next"))

                await ctx.replyWithMarkdown('Выберите часы, в которые вы хотели бы получать уведомления от бота.',
                    Markup.inlineKeyboard(buttons, {columns: 2}))
                return ctx.wizard.next()
            },
            stepHandler
        );
    }

    private processSelectedButtons(timeSelectionButtons) {
        const buttons = []

        for (let key in timeSelectionButtons) {
            let buttonConfig = timeSelectionButtons[key];
            const text = `${buttonConfig.selected ? "✅" : ""} ${buttonConfig.text}`
            buttons.push(Markup.button.callback(text, key))
        }

        return buttons;
    }

    private createButtonsConfig() {
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

    private stepHandler(): Composer<MyContext> {

        const stepHandler = new Composer<MyContext>()

        const replyMap = {
            1: "1 копейка",
            5: "5 копеек",
            10: "10 копеек",
            25: "25 копеек",
            50: "50 копеек",
            75: "75 копеек",
            100: "1 рубль"
        }

        stepHandler.action(/\d{1,3}/, async (ctx) => {
            let selectedThreshold: number;
            try {
                selectedThreshold = Number.parseInt(ctx.match[0]);
            } catch (e) {
                console.log("Error choosing Threshold", e)
            }

            const replyText = `Буду уведомлять при изменении цены больше чем на ${replyMap[selectedThreshold]}`
            const subscription = ctx.scene.session.subscriptionData as SubscriptionThresholdData
            subscription.notificationThreshold = selectedThreshold;

            ds.getRepository(SubscriptionThresholdData)
                .createQueryBuilder("findSubscriptions")
                .innerJoinAndSelect("findSubscriptions.user", "userJoin")
                .where("userJoin.userId = :userId AND country = :countryCode",
                    {userId: subscription.user.userId, countryCode: subscription.country})
                .delete()
            await this.saveSubscription(subscription)
            await ctx.reply(replyText, Markup.removeKeyboard())

            return ctx.scene.leave()
        })

        return stepHandler;
    }

    private filterSelectedItems(timeSelectionButtons) {
        const filteredButtons = []

        for (let key in timeSelectionButtons) {
            let value = timeSelectionButtons[key]
            if (value.selected) {
                filteredButtons.push(value)
            }
        }
        return filteredButtons;
    }

    private async saveSubscription(subscriptionData: SubscriptionData) {
        try {
            await ds.manager.getRepository(SubscriptionThresholdData).createQueryBuilder()
                .where({})
            await ds.manager.save(subscriptionData);
        } catch (e) {
            console.log("This subscription already exists", e)
        }
    }

    private keyboard(text: string) {
        return Markup.button.callback(text, "")
    }
}
