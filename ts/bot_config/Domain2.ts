import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {SubscriptionData} from "../entity/SubscriptionData";
import {Context, SessionFlavor} from "grammy";
import {LocalUser} from "../entity/LocalUser";
import {Conversation, ConversationFlavor} from "@grammyjs/conversations";
import {GarantexSubscription} from "../entity/subscription/GarantexSubscription";


export interface SessionData {
    message: string
    country: string;
    subscriptionData: SubscriptionThresholdData | SubscriptionData | GarantexSubscription
    selectedSubscriptionButtons: any // todo remove
}

export type NewContext = Context & SessionFlavor<SessionData> & ConversationFlavor & {
    user: LocalUser
}

export type MyConversation = Conversation<NewContext>;
