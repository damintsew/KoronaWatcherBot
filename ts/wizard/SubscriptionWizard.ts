import {Composer, Markup, Scenes} from "telegraf";
import {MyContext} from "../Domain";
import {SubsriptionData} from "../entity/SubsriptionData";
import {ds} from "../data-source";

export class SubscriptionWizard {

    createSubscriptionWizard(): Scenes.WizardScene<MyContext>{

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
                await ctx.replyWithMarkdown('Уведомлять при изменении курса более чем на:',
                    Markup.inlineKeyboard([
                        Markup.button.callback('➡️ 1 рубль', "100"),
                        Markup.button.callback('➡️ 50 копеек', '50'),
                        Markup.button.callback('➡️ 10 копеек', '10'),
                        Markup.button.callback('➡️ 5 копеек', '5'),
                        Markup.button.callback('➡️ 1 копейка', '1'),
                    ], {columns: 1}))
                return ctx.wizard.next()
            },
            this.stepHandler() //todo fix this awfull call
        );
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

        async function saveSubscription(subscriptionData: SubsriptionData) {
            try {
                await ds.manager.save(subscriptionData);
            } catch (e) {
                console.log("This subscription already exists", e)
            }
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
            await saveSubscription(ctx.scene.session.subscriptionData)
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
}
