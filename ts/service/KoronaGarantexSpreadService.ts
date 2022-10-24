import {SpreadBaseService} from "./SpreadBaseService";
import {ExchangeHistory} from "../entity/ExchangeHistory";
import {KoronaGarantexSpreadSubscription} from "../entity/subscription/KoronaGarantexSpreadSubscription";
import {SpreadReferenceData} from "../entity/subscription/SpreadReferenceData";
import {ds} from "../data-source";

export class KoronaGarantexSpreadService extends SpreadBaseService {

    async processBase(baseRate: ExchangeHistory, subscription: KoronaGarantexSpreadSubscription) {
        if (subscription.garantexLastNotifiedValue == null) {
            subscription.garantexLastNotifiedValue = baseRate.value;
            await ds.getRepository(KoronaGarantexSpreadSubscription).save(subscription)
        }
        subscription.referenceData = await ds.getRepository(SpreadReferenceData).createQueryBuilder()
            .where({subscription: subscription})
            .getMany()

        const spreads = [];
        let spreadExceeded = false;
        for (const ref of subscription.referenceData) {
            if (ref.koronaLastNotifiedValue == null) continue;

            const spread = this.calculateSpread(baseRate.value, ref.koronaLastNotifiedValue)
            spreads.push({country: ref.country, spread: spread})
            if (spread >= subscription.notificationThreshold) {
                spreadExceeded = true;
            }
        }

        if (spreadExceeded) {
            await ds.getRepository(KoronaGarantexSpreadSubscription).save(subscription)
            this.notifyUser(subscription.user.userId, baseRate.value, spreads)
        }
    }

    async processReference(referenceRates: ExchangeHistory[], subscription: KoronaGarantexSpreadSubscription) {
        if (subscription.garantexLastNotifiedValue == null) {
            return;
        }

        subscription.referenceData = await ds.getRepository(SpreadReferenceData).createQueryBuilder()
            .where({subscription: subscription})
            .getMany()

        const spreads = [];
        let spreadExceeded = false;
        for (const rate of referenceRates) {

            let referenceData = subscription.referenceData.find(r => r.country == rate.country)

            if (referenceData == null) {
                return
            }

            const spread = this.calculateSpread(subscription.garantexLastNotifiedValue, rate.value)
            spreads.push({country: referenceData.country, spread: spread})
            if (spread >= subscription.notificationThreshold) {
                spreadExceeded = true;
            }
        }

        if (spreadExceeded) {
            await ds.getRepository(KoronaGarantexSpreadSubscription).save(subscription)
            this.notifyUser(subscription.user.userId, subscription.garantexLastNotifiedValue, spreads)
        }
    }

    private notifyUser(userId: number, base: number, spreads: any[]) {
        const lines = [`Garantex: ${base}`, ""]
        for (let s of spreads) {
            lines.push(`  ${s.country} | ${s.spread}`)
        }

        this.tg.sendMessage(userId, lines.join(","))
    }

    private calculateSpread(baseVal: number, relativeVal: number) {
        return (baseVal - relativeVal) / baseVal * 100;
    }
}
