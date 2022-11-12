import {LocalUser} from "../LocalUser";

export interface ThresholdSubscription {

    notificationThreshold: number
    lastNotifiedValue: number
    user: LocalUser
}
