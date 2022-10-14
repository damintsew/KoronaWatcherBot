import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {SubscriptionData} from "../entity/SubscriptionData";
import {Context, SessionFlavor} from "grammy";
import {LocalUser} from "../entity/LocalUser";
import {ConversationFlavor} from "@grammyjs/conversations";


export interface SessionData {
    message: string
    country: string;
    subscriptionData: SubscriptionThresholdData | SubscriptionData
    selectedSubscriptionButtons: any // todo remove
}

export type NewContext = Context & SessionFlavor<SessionData> & ConversationFlavor & {
    user: LocalUser
}
