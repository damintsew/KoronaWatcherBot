import {Service} from "typedi";
import {PaymentSubscription} from "../entity/PaymentSubscription";
import moment from "moment/moment";
import {ds} from "../data-source";
import {Config} from "../wizard/PaymentValidationWizard";
import {LocalUser} from "../entity/LocalUser";
import {PendingTxId} from "../entity/PendingTxId";
import {GlobalMessageAnnouncerService} from "./GlobalMessageAnnouncerService";
import {PaymentSubscriptionNotification} from "../entity/PaymentSubscriptionNotification";

@Service()
export class PaymentSubscriptionService {

    constructor(public messageAnnouncer: GlobalMessageAnnouncerService) {
    }

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

    async findOutdatedSubscriptionsAndNotifyUser() {
        const allSubscriptions = await ds.manager.getRepository(PaymentSubscription)
            .createQueryBuilder("os")
            .leftJoinAndSelect("os.subscriptionNotifications", "subsNotif")
            .innerJoinAndSelect("os.user", "user")
            .where("os.expirationDate < :date", {date: new Date()})
            .getMany()

        for(let paymentSubscriptions of allSubscriptions) {
            if (paymentSubscriptions.subscriptionNotifications?.length == 0) {
                if (moment(paymentSubscriptions.expirationDate).isBefore(moment())) {

                    let message = `Ваша подписка на ${paymentSubscriptions.type} закончилась. Пожалуйста оформите новую.`

                    await this.messageAnnouncer.sendMessage(paymentSubscriptions.user, message)

                    const messageInfo = new PaymentSubscriptionNotification();
                    messageInfo.message = message
                    messageInfo.sendDate = new Date()

                    paymentSubscriptions.subscriptionNotifications.push(messageInfo)
                    await ds.manager.save(paymentSubscriptions)
                }
            }
        }
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

    // todo move to dao
    getActiveSubscription(userId: number): Promise<PaymentSubscription[]> {
        return ds.getRepository(PaymentSubscription).createQueryBuilder("p")
            .where("p.userUserId = :userId", {userId: userId})
            .getMany()
            .then((values: PaymentSubscription[]) => this.findActiveSubscriptions(values))
    }
}
