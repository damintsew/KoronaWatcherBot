import {createConnection, DataSource} from "typeorm";
import {LocalUser} from "./entity/LocalUser";
import {Connection} from "typeorm/connection/Connection";
import {SubscriptionData} from "./entity/SubscriptionData";
import {env} from 'node:process';
import {Announcements} from "./entity/Announcements";
import {TimeUnit} from "./entity/TimeUnit";
import {SubscriptionScheduledData} from "./entity/SubscriptionScheduledData";
import {SubscriptionThresholdData} from "./entity/SubscriptionThresholdData";
import {ExchangeHistory} from "./entity/ExchangeHistory";
import {SendToUser} from "./entity/announcement/SendToUser";
import { PaymentSubscription } from "./entity/PaymentSubscription";

export const ds = new DataSource({
    type: "postgres",
    host: env.DB_HOST,
    port: 5432,
    username: "postgres",
    password: "changeme",
    database: "postgres",
    entities: [
        LocalUser, SubscriptionScheduledData, SubscriptionThresholdData, Announcements, TimeUnit, ExchangeHistory,
        SendToUser, PaymentSubscription
    ],
    synchronize: true,
    logging: true
});
