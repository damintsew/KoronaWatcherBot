import {Composer, Markup, Scenes} from "telegraf";
import {MyContext} from "../Domain";
import {SubsriptionData} from "../entity/SubsriptionData";
import {ds} from "../data-source";
import {TimeUnit} from "../entity/TimeUnit";

export class SubscriptionWizard {

    createSubscriptionWizard(): Scenes.WizardScene<MyContext> {

        return new Scenes.WizardScene<MyContext>(
            'subscribe-wizard',
            async (ctx) => {
                ctx.scene.session.subscriptionData = new SubsriptionData();
                ctx.scene.session.subscriptionData.user = ctx.session.user;

                await ctx.replyWithMarkdown('В какую страну перевод?',
                    Markup.keyboard([
                        Markup.button.callback('➡️ Турция', 'turkey'),
                        Markup.button.callback('➡️ Грузия', 'georgia'),
                        Markup.button.callback('➡️ Добавить страну', 'add_country'),
                    ]))
                return ctx.wizard.next()
            },
            async (ctx) => {
                // @ts-ignore todo remove ignore
                const countryCode = this.mapCountry(ctx.message.text)
                // @ts-ignore todo remove ignore
                if (ctx.message.text == "➡️ Добавить страну" || countryCode == null) {
                    await ctx.reply("Введите название страны: ")
                    return;
                }

                ctx.scene.session.subscriptionData.country = countryCode;
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
                        subscriptionData: ctx.scene.session.subscriptionData
                    })
                } else if (text == "При изменении цены") {
                    return ctx.scene.enter("change-currency-scene", {
                        subscriptionData: ctx.scene.session.subscriptionData
                    })
                }
            }
        );
    }

    onChangeCurrencyWizard(): Scenes.WizardScene<MyContext> {

        return new Scenes.WizardScene<MyContext>(
            'change-currency-scene',
            async (ctx) => {
                ctx.scene.session.subscriptionData = ctx.scene.state["subscriptionData"] as SubsriptionData;
                ctx.scene.session.subscriptionData.type = "ON_CHANGE"
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

            const buttons = this.processSelectedBUttons(ctx.scene.session.timeSelectionButtons)
            buttons.push(Markup.button.callback("Сохранить", "next"))

            ctx.editMessageText("Выберите часы, в которые вы хотели бы получать уведомления от бота.",
                Markup.inlineKeyboard(buttons, {columns: 2}))
        }).action("next", async (ctx) => {
            const selectedOptions = this.filterSelectedItems(ctx.scene.session.timeSelectionButtons)
            if (selectedOptions.length == 0) {
                //todo show notification
                return;
            }
            const subscriptionToCreate = ctx.scene.session.subscriptionData
            subscriptionToCreate.triggerTime = selectedOptions.map(selectedOptions => {
                const unit = new TimeUnit();
                unit.timeHours = selectedOptions.id
                unit.subscription = subscriptionToCreate

                return unit
            })
            await this.saveSubscription(subscriptionToCreate)
        })

        return new Scenes.WizardScene<MyContext>(
            'time-selection-scene',
            async (ctx) => {
                ctx.scene.session.subscriptionData = ctx.scene.state["subscriptionData"] as SubsriptionData;
                ctx.scene.session.subscriptionData.type = "SCHEDULED"
                ctx.scene.session.timeSelectionButtons = createButtonsConfig()

                const buttons = this.processSelectedBUttons(ctx.scene.session.timeSelectionButtons)
                buttons.push(Markup.button.callback("Сохранить", "next"))

                await ctx.replyWithMarkdown('Выберите часы, в которые вы хотели бы получать уведомления от бота.',
                    Markup.inlineKeyboard(buttons, {columns: 2}))
                return ctx.wizard.next()
            },
            stepHandler
        );
    }

    private processSelectedBUttons(timeSelectionButtons) {
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
            50: "50 копеек",
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
            ctx.scene.session.subscriptionData.notificationThreshold = selectedThreshold;
            await this.saveSubscription(ctx.scene.session.subscriptionData)
            await ctx.reply(replyText, Markup.removeKeyboard())

            return ctx.scene.leave()
        })

        return stepHandler;
    }

    private mapCountry(countryString: string): string {
        const map = {
            "➡️ Турция": "TUR",
            "➡️ Грузия": "GEO"
        }
        return map[countryString];
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

    private async saveSubscription(subscriptionData: SubsriptionData) {
        try {
            await ds.manager.save(subscriptionData);
        } catch (e) {
            console.log("This subscription already exists", e)
        }
    }
}
