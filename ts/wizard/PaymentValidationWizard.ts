// noinspection TypeScriptValidateJSTypes

import {MyContext} from "../Domain";
import {Markup, Scenes} from "telegraf";
import {PaymentSubscription} from "../entity/PaymentSubscription";
import moment from "moment";
import {ds} from "../data-source";

export class PaymentValidationWizard {

    paymentValidationWizard(): Scenes.WizardScene<MyContext> {
        return new Scenes.WizardScene<MyContext>(
            "payment-validation-wizard",
            async (ctx: MyContext) => {
                let user = ctx.session.user;

                if (user.subscriptions == null || user.subscriptions.length == 0) {
                    await ctx.replyWithMarkdown(
                        'Данная функциф платная - стоимость подписки 1 usdt/месяц\n' +
                        'У вас доступна триальная версия - в течении 7 дней.\n' +
                        'Желаете продолжить ?',
                        Markup.keyboard([
                            this.keyboard("Да"),
                            this.keyboard("Нет")
                        ]))
                    //todo move to handle questions
                    return ctx.wizard.selectStep(1)
                }

                const activeTrial = this.findPredicate(user.subscriptions,
                    s => s.trial == true && s.type == "GARANTEX")
                if (activeTrial) {
                    ctx.scene.enter("change-currency-scene")
                    return;
                }

                const activeGarantexSubscription = this.findPredicate(user.subscriptions,
                    s => s.type == "GARANTEX")
                if (activeGarantexSubscription) {
                    ctx.scene.enter("change-currency-scene")
                    return;
                }

                await ctx.replyWithMarkdown(
                    'Данная функциф платная - стоимость подписки 1 usdt/месяц\n' +
                    'Пожалуйста переведите 1 usdt на кошелек %номер кошелька% и ОБЯЗАТЕЛЬНО в сообщении укажите Ваш номер пользователя.\n' +
                    'Ваш номер: ' + user.userId + "\n" +
                    "Когда отправите нажмите кнопку ниже. Я проверю платеж и вы получите доступ",
                    Markup.keyboard([
                        this.keyboard("Деньги отправлены"),
                        this.keyboard("Отмена")
                    ]))
                return ctx.wizard.selectStep(2)
            },
            async (ctx: MyContext) => {
                // @ts-ignore
                if (ctx.message?.text == "Да") {
                    const trialSubscription = new PaymentSubscription();
                    trialSubscription.type ="GARANTEX"
                    trialSubscription.trial = true
                    trialSubscription.startDate = new Date()
                    trialSubscription.expirationDate = moment().add(7, "d").toDate()
                    trialSubscription.user = ctx.session.user

                    await ds.manager.save(trialSubscription)
                    await ctx.reply("Триал оформлен. В случае проблем пишите в /support")
                    ctx.scene.enter("change-currency-scene")
                } else { // @ts-ignore
                    if (ctx.message?.text == "Нет") {
                        ctx.scene.leave()
                    }
                }
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

                // @ts-ignore
                if (ctx.message?.text == "Деньги отправлены") {
                    //todo alert admin!!!!
                }
            }
        )
    }

    private findPredicate(subscriptions: PaymentSubscription[], predicate: (s: PaymentSubscription) => {}) {
        for (let s of this.findActiveSubscriptions(subscriptions)) {
            if (predicate(s)) {
                return s
            }
        }
        return null
    }

    private findActiveSubscriptions(subscriptions: PaymentSubscription[]) {
        const result = []
        const now = moment()
        for (let s of subscriptions) {
            if (now.isBetween(s.startDate, s.expirationDate)) {
                result.push(s)
            }
        }

        return result;
    }

    private keyboard(text: string) {
        return Markup.button.callback(text, "")
    }
}