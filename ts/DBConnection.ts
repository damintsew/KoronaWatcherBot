import {createConnection} from "typeorm";
import {User} from "./entity/User";
import {Connection} from "typeorm/connection/Connection";
import {SubsriptionData} from "./entity/SubsriptionData";
import { env } from 'node:process';


//'postgres://pacmsvjcskwfrm:c7df8f05dbd6d232b9dfa8ed3fc0ae17b083d301800334d7d59dff61c053c311@ec2-54-204-46-236.compute-1.amazonaws.com:5432/d6b1vm2e0qvo9q',

export class DBConnection {

    static async getConnection(): Promise<Connection> {
        return createConnection({
            type: "postgres",
            host: "localhost",//env.DB_HOST,
            port: 5432,
            username: "postgres",
            password: "changeme",
            database: "postgres",
            entities: [
                User, SubsriptionData
            ],
            synchronize: true,
            logging: true
        })
            // return createConnection({
            //     type: "postgres",
            //     host: "ec2-54-204-46-236.compute-1.amazonaws.com",
            //     port: 5432,
            //     username: "pacmsvjcskwfrm",
            //     password: "c7df8f05dbd6d232b9dfa8ed3fc0ae17b083d301800334d7d59dff61c053c311",
            //     database: "d6b1vm2e0qvo9q",
            //     entities: [
            //         DirectMessage
            //     ],
            //     synchronize: true,
            //     logging: true
            // })
            // .then(connection => {
            //     console.log(connection)
            //
            //     console.log("Inserting a new user into the database...");
            //     const user = new User();
            //     user.firstName = "Timber";
            //     user.lastName = "Saw";
            //     user.age = 25;
            //     connection.manager.save(user);
            //     // here you can start to work with your entities
            // }).catch(error => console.log(error));
    }
}
