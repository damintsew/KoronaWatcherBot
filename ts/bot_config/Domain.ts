import {SubscriptionThresholdData} from "../entity/subscription/threshold/SubscriptionThresholdData";
import {SubscriptionData} from "../entity/SubscriptionData";
import {Context, SessionFlavor} from "grammy";
import {LocalUser} from "../entity/LocalUser";
import {Conversation, ConversationFlavor} from "@grammyjs/conversations";
import {GarantexSubscription} from "../entity/subscription/threshold/GarantexSubscription";
import {KoronaGarantexSpreadSubscription} from "../entity/subscription/KoronaGarantexSpreadSubscription";


export interface SessionData {
    message: string
    country: string;
    subscriptionData: SubscriptionThresholdData | SubscriptionData | GarantexSubscription | KoronaGarantexSpreadSubscription
    selectedSubscriptionButtons: any // todo remove
}

export type NewContext = Context & SessionFlavor<SessionData> & ConversationFlavor & {
    user: LocalUser
}

export type MyConversation = Conversation<NewContext>;
