import {PaymentSubscription} from "../entity/PaymentSubscription";
import moment from "moment";
import {MyConversation, NewContext} from "../bot_config/Domain2";
import {Keyboard} from "@grammyjs/conversations/out/deps.node";
import {Service} from "typedi";
import {PaymentSubscriptionService} from "../service/PaymentSubscriptionService";

export interface Config {
    subscriptionId: string,
    subscriptionText: string,
    price: string,

    onSuccess: any
}

@Service()
export class PaymentValidationWizard {

    constructor(
        public paymentService: PaymentSubscriptionService
    ) {
    }

    private removeKeyb = {remove_keyboard: true};

    async trialValidator(conversation: MyConversation, ctx: NewContext, config: Config) {

        const activeTrial = this.findPredicate(ctx.user?.subscriptions,
            s => s.trial && s.type == config.subscriptionId)

        if (!activeTrial) {
            const keyboard = new Keyboard()
                .text("Да")
                .text("Отмена").row()
                .oneTime()
                .resized();
            await ctx.reply(`Данная функциф платная - стоимость подписки ${config.price} usdt/месяц\n` +
                'У вас доступна триальная версия - в течении 7 дней.\n' +
                'Желаете продолжить ?', {reply_markup: keyboard})

            const answer = await conversation.waitFor("message:text");

            if (answer.msg.text == "Да") {
                await this.paymentService.createTrialSubscription(config, ctx.user)
                await ctx.reply("Триал оформлен. В случае проблем пишите в /support")
                await ctx.reply("Оформление подписки Garantex", config.onSuccess)
            } else if (answer.msg.text == "Нет") {
                return ctx.reply("Отменяю", {reply_markup: {remove_keyboard: true}})
            }
        }

        if (activeTrial) {
            await ctx.reply("Оформление подписки Garantex", config.onSuccess)
            return;
        }

        const activeGarantexSubscription = this.findPredicate(ctx.user.subscriptions,
            s => s.type == config.subscriptionId)
        if (activeGarantexSubscription) {
            await ctx.reply("Оформление подписки Garantex", config.onSuccess)//{reply_markup: garantexSubscriptionMenu})
            return;
        } else {
            const keyboard = new Keyboard()
                .text("Да")
                .text("Отмена").row()
                .oneTime()
                .resized();

            await ctx.reply("Ваша подписка кончилась! Оплатите подписку\n" +
                `Стоимость подписки ${config.price} usdt/месяц.\n
                Перейти к оплате?`, {reply_markup: keyboard});

            const answer = await conversation.waitFor("message:text");

            if (answer.msg.text == "Да") {
                const keyboard = new Keyboard()
                    .text("Перевод отправлен")
                    .text("Отмена").row()
                    .oneTime()
                    .resized();

                await ctx.reply("Переведите на этот кошелек 1 usdt")
                await ctx.reply("TKH74x3dNGkBnWdFUESPkiGqrscHBgKGNK")
                await ctx.reply("После перевода. Пришлите мне номер транзакции. В случае проблем пишите /support",
                    {reply_markup: keyboard})

                let answer = await conversation.waitFor("message:text");
                if (answer.msg.text == "Перевод отправлен") {
                    await ctx.reply("Отправьте мне номер транзакции, пожалуйста")
                    answer = await conversation.waitFor("message:text");

                    // todo save answer

                } else if (answer.msg.text == "Отмена") {
                    return ctx.reply("Отменяю", {reply_markup: {remove_keyboard: true}})
                }

            } else if (answer.msg.text == "Нет") {
                return ctx.reply("Отменяю", {reply_markup: {remove_keyboard: true}})
            }
        }
    }

    private findPredicate(subscriptions: PaymentSubscription[], predicate: (s: PaymentSubscription) => {}) {
        if (subscriptions == null) {
            return null;
        }
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
}
