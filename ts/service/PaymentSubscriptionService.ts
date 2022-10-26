import {Service} from "typedi";
import {PaymentSubscription} from "../entity/PaymentSubscription";
import moment from "moment/moment";
import {ds} from "../data-source";
import {Config} from "../wizard/PaymentValidationWizard";
import {LocalUser} from "../entity/LocalUser";


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
}
