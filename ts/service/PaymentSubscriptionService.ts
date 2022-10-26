import {Service} from "typedi";
import {PaymentSubscription} from "../entity/PaymentSubscription";
import moment from "moment/moment";
import {ds} from "../data-source";
import {Config} from "../wizard/PaymentValidationWizard";
import {LocalUser} from "../entity/LocalUser";
import {SessionFlavor} from "grammy";
import {SessionData} from "../bot_config/Domain2";
import {PendingTxId} from "../entity/PendingTxId";


@Service()
export class PaymentSubscriptionService {

    async createTrialSubscription(config: Config, user: LocalUser) {
        const trialSubscription = new PaymentSubscription();

        trialSubscription.type = config.subscriptionId
        trialSubscription.trial = true
        trialSubscription.startDate = new Date()
        trialSubscription.expirationDate = moment().add(7, "d").toDate()
        trialSubscription.user = user

        await ds.manager.save(trialSubscription)
    }

    async saveTransactionId(user: LocalUser, answer: string) {
        const tx = new PendingTxId();
        tx.transactionId = answer;
        tx.user = user;

        await ds.manager.save(tx)
    }

    filterByActiveSubscription(subscriptions: PaymentSubscription[], type: string) {
        return this.findPredicate(subscriptions, s => s.type == type)
    }

    isActiveSubscription(subscription: PaymentSubscription, type: string) {
        return this.findPredicate([subscription], s => s.type == type)
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
