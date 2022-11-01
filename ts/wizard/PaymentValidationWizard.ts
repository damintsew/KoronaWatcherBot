import {PaymentSubscription} from "../entity/PaymentSubscription";
import moment from "moment";
import {MyConversation, NewContext} from "../bot_config/Domain";
import {Keyboard} from "@grammyjs/conversations/out/deps.node";
import {Service} from "typedi";
import {PaymentSubscriptionService} from "../service/PaymentSubscriptionService";
import {AdminNotificationService} from "../service/AdminNotificationService";

export interface Config {
    subscriptionId: string,
    subscriptionText: string,
    price: string,

    onSuccess: any | null
}

@Service()
export class PaymentValidationWizard {

    constructor(
        public paymentService: PaymentSubscriptionService,
        public adminNotification: AdminNotificationService
    ) {
    }

    async trialValidator(conversation: MyConversation, ctx: NewContext, config: Config) {
        const trial = this.findTrial(ctx.user?.subscriptions, config.subscriptionId)
        const activeSubscription = this.findPredicate(ctx.user.subscriptions,
            s => s.type == config.subscriptionId)

        if (!trial) {
            await this.activateTrial(conversation, ctx, config);
            return
        }

        if (this.isSubscriptionActive(trial) || activeSubscription) {
            await ctx.reply("Оформление подписки Garantex", config.onSuccess)
        } else {
            await this.activateSubscription(conversation, ctx, config)
        }
    }

    private async activateTrial(conversation: MyConversation, ctx: NewContext, config: Config) {
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

    private async activateSubscription(conversation: MyConversation, ctx: NewContext, config: Config) {
        const keyboard = new Keyboard()
            .text("Да")
            .text("Отмена").row()
            .oneTime()
            .resized();

        await ctx.reply("Ваша подписка кончилась! Оплатите подписку\n" +
            `Стоимость подписки ${config.price} usdt/месяц.\n` +
            `Перейти к оплате?`, {reply_markup: keyboard});

        const answer = await conversation.waitFor("message:text");

        if (answer.msg.text == "Да") {
            const keyboard = new Keyboard()
                .text("Отмена").row()
                .oneTime()
                .resized();

            await ctx.reply("Переведите на этот кошелек 1 usdt")
            await ctx.reply("TKH74x3dNGkBnWdFUESPkiGqrscHBgKGNK")
            await ctx.reply("После перевода. Пришлите мне номер транзакции. В случае проблем пишите /support",
                {reply_markup: keyboard})

            let answer = await conversation.waitFor("message:text");
            if (answer.msg.text == "Отмена") {
                return ctx.reply("Отменяю", {reply_markup: {remove_keyboard: true}})
            } else if (answer.msg.text) {
                await this.paymentService.saveTransactionId(ctx.user, answer.msg.text)
                await this.adminNotification.notifyAdmins(ctx.user.userId, answer.msg.text)

                await ctx.reply("Спасибо! Когда транзакция придет - вы получите уведомление",
                    {reply_markup: {remove_keyboard: true}})
            }

        } else if (answer.msg.text == "Нет") {
            return ctx.reply("Отменяю", {reply_markup: {remove_keyboard: true}})
        }
    }

    private findTrial(subscriptions: PaymentSubscription[], subscriptionType: string) {
        if (subscriptions == null) {
            return null;
        }
        for (let s of subscriptions) {
            if (s.trial && s.type == subscriptionType) {
                return s
            }
        }
        return null
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
        return subscriptions.filter(this.isSubscriptionActive);
    }

    private isSubscriptionActive(s: PaymentSubscription) {
        const now = moment()
        return now.isBetween(s.startDate, s.expirationDate)
    }
}
