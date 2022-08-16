import {ChildEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique} from "typeorm";
import {User} from "./User";
import {TimeUnit} from "./TimeUnit";
import {SubscriptionData} from "./SubscriptionData";

@Entity('subscription_threshold_data')
@Unique("constraint_unique_threshold_subscription", ['country', "notificationThreshold", "user"])
export class SubscriptionThresholdData extends SubscriptionData {

    @Column({nullable: true, type: "float"})
    lastNotifiedValue: number

    @Column()
    notificationThreshold: number
}
