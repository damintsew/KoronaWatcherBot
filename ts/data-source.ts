import {createConnection, DataSource} from "typeorm";
import {User} from "./entity/User";
import {Connection} from "typeorm/connection/Connection";
import {SubscriptionData} from "./entity/SubscriptionData";
import {env} from 'node:process';
import {Announcements} from "./entity/Announcements";
import {TimeUnit} from "./entity/TimeUnit";
import {SubscriptionScheduledData} from "./entity/SubscriptionScheduledData";
import {SubscriptionThresholdData} from "./entity/SubscriptionThresholdData";
import {ExchangeHistory} from "./entity/ExchangeHistory";


//'postgres://pacmsvjcskwfrm:c7df8f05dbd6d232b9dfa8ed3fc0ae17b083d301800334d7d59dff61c053c311@ec2-54-204-46-236.compute-1.amazonaws.com:5432/d6b1vm2e0qvo9q',

export const ds = new DataSource({
    type: "postgres",
    host: env.DB_HOST,
    port: 5432,
    username: "postgres",
    password: "changeme",
    database: "postgres",
    entities: [
        User, SubscriptionScheduledData, SubscriptionThresholdData, Announcements, TimeUnit, ExchangeHistory
    ],
    synchronize: true,
    logging: true
});
