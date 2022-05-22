import {createConnection, DataSource} from "typeorm";
import {User} from "./entity/User";
import {Connection} from "typeorm/connection/Connection";
import {SubsriptionData} from "./entity/SubsriptionData";
import { env } from 'node:process';
import {Announcements} from "./entity/Announcements";


//'postgres://pacmsvjcskwfrm:c7df8f05dbd6d232b9dfa8ed3fc0ae17b083d301800334d7d59dff61c053c311@ec2-54-204-46-236.compute-1.amazonaws.com:5432/d6b1vm2e0qvo9q',

export const ds = new DataSource({
            type: "postgres",
            host: env.DB_HOST,
            port: 5432,
            username: "postgres",
            password: "changeme",
            database: "postgres",
            entities: [
                User, SubsriptionData, Announcements
            ],
            synchronize: true,
            logging: true
        });