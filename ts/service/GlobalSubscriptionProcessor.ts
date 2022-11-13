import {GarantexSubscription} from "../entity/subscription/GarantexSubscription";
import {UnistreamThresholdSubscription} from "../entity/subscription/UnistreamThresholdSubscription";
import {KoronaGarantexSpreadService} from "./subscription/KoronaGarantexSpreadService";
import {GarantexService} from "./subscription/GarantexService";
import {UnistreamService} from "./external/UnistreamService";
import {SubscriptionService} from "./SubscriptionService";
import {Service} from "typedi";

@Service()
export class GlobalSubscriptionProcessor {

    private spreadService: KoronaGarantexSpreadService
    private garantexService: GarantexService
    private unistreamService: UnistreamService
    private subscriptionService: SubscriptionService

    constructor(spreadService: KoronaGarantexSpreadService,
                garantexService: GarantexService,
                unistreamService: UnistreamService,
                subscriptionService: SubscriptionService) {
        this.spreadService = spreadService;
        this.garantexService = garantexService;
        this.unistreamService = unistreamService;
        this.subscriptionService = subscriptionService;
    }

    async processSubscriptions() {
        const baseSubscriptions = await this.subscriptionService.getSubscriptions()
        for (const subscription of baseSubscriptions) {
            if (subscription instanceof GarantexSubscription) {
                await this.garantexService.process(subscription)
            }
            if (subscription instanceof UnistreamThresholdSubscription) {
                await this.unistreamService.process(subscription)
            }
        }
    }
}
