import {SubscriptionThresholdData} from "../entity/SubscriptionThresholdData";
import {SubscriptionData} from "../entity/SubscriptionData";
import {Context, SessionFlavor} from "grammy";
import {User} from "../entity/User";


export interface SessionData {
    message: string
    country: string;
    subscriptionData: SubscriptionThresholdData | SubscriptionData
    selectedSubscriptionButtons: any // todo remove
}

export interface NewContext extends Context, SessionFlavor<SessionData> {
    user: User
}
