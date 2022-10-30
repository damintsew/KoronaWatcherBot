import {DataSource} from "typeorm";
import {LocalUser} from "./entity/LocalUser";
import {env} from 'node:process';
import {Announcements} from "./entity/Announcements";
import {TimeUnit} from "./entity/TimeUnit";
import {SubscriptionScheduledData} from "./entity/SubscriptionScheduledData";
import {SubscriptionThresholdData} from "./entity/SubscriptionThresholdData";
import {ExchangeHistory} from "./entity/ExchangeHistory";
import {SendToUser} from "./entity/announcement/SendToUser";
import {PaymentSubscription} from "./entity/PaymentSubscription";
import {BaseSubscription} from "./entity/subscription/BaseSubscription";
import {GarantexSubscription} from "./entity/subscription/GarantexSubscription";
import {Statistic} from "./entity/Statistic";
import {KoronaGarantexSpreadSubscription} from "./entity/subscription/KoronaGarantexSpreadSubscription";
import {SpreadReferenceData} from "./entity/subscription/SpreadReferenceData";
import {PendingTxId} from "./entity/PendingTxId";
import {PaymentSubscriptionNotification} from "./entity/PaymentSubscriptionNotification";

export const ds = new DataSource({
    type: "postgres",
    host: env.DB_HOST,
    port: 5432,
    username: "postgres",
    password: "changeme",
    database: "postgres",
    entities: [
        LocalUser, SubscriptionScheduledData, SubscriptionThresholdData, Announcements, TimeUnit, ExchangeHistory,
        SendToUser, PaymentSubscription, PaymentSubscriptionNotification,
        BaseSubscription, GarantexSubscription, KoronaGarantexSpreadSubscription, SpreadReferenceData,
        Statistic,
        PendingTxId
    ],
    synchronize: true,
    logging: true
});
