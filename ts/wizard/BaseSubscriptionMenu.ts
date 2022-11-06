import {MyConversation, NewContext} from "../bot_config/Domain";
import {Keyboard} from "@grammyjs/conversations/out/deps.node";
import {garantexCreateSubscription, garantexOnlySubscription} from "./GarantexSubscriptionWizard";
import {spreadConversation, spreadOnlySubscribe} from "./SpreadSubscriptionWizard";
import {Service} from "typedi";
import {koronaSubscriptionMenu} from "./KoronaSubscriptionWizard";

@Service()
export class BaseSubscriptionMenu {

    async createSubscriptionMenu(conversation: MyConversation, ctx: NewContext) {
        const keyboard = new Keyboard()
            .text("Подписка на курс: Золотая Корона").row()
            .text("Подписка на курс: Garantex").row()
            .text("Получение Спредов ЗК + Garantex").row()
            .text("Отмена")
            .oneTime()
            .resized();
        await ctx.reply('Выберите подписку', {reply_markup: keyboard})

        const titleCtx = await conversation.waitFor("message:text");
        if (titleCtx.msg.text == "Подписка на курс: Золотая Корона") {
            return ctx.reply("Создание новой подписки:", {reply_markup: koronaSubscriptionMenu})
        }
        if (titleCtx.msg.text == "Подписка на курс: Garantex") {
            return garantexCreateSubscription(conversation, ctx);
        }
        if (titleCtx.msg.text == "Получение Спредов ЗК + Garantex") {
            // return ctx.reply("В разработке! Скоро будет!", {reply_markup: {remove_keyboard: true}});
            return spreadConversation(conversation, ctx)
        }
        return ctx.reply("", {reply_markup: {remove_keyboard: true}});
    }

    async createOnlySubscribeMenu(conversation: MyConversation, ctx: NewContext) {
        const keyboard = new Keyboard()
            .text("Подписка на курс: Garantex").row()
            .text("Получение Спредов ЗК + Garantex").row()
            .text("Отмена")
            .oneTime()
            .resized();
        await ctx.reply('Выберите подписку', {reply_markup: keyboard})

        const titleCtx = await conversation.waitFor("message:text");
        if (titleCtx.msg.text == "Подписка на курс: Garantex") {
            return garantexOnlySubscription(conversation, ctx);
        }
        if (titleCtx.msg.text == "Получение Спредов ЗК + Garantex") {
            return spreadOnlySubscribe(conversation, ctx)
        }
        return ctx.reply("", {reply_markup: {remove_keyboard: true}});
    }
}
