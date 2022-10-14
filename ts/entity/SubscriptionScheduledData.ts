import {Column, Entity, OneToMany} from "typeorm";
import {TimeUnit} from "./TimeUnit";
import {SubscriptionData} from "./SubscriptionData";

@Entity('subsription_scheduled_data')
// @Unique("constraint_unique_scheduled_subscription", ["country",  "user", "type"])// todo !! notificationThreshold'
export class SubscriptionScheduledData extends SubscriptionData {

    @Column({nullable: true, type: "float"})
    lastNotifiedValue: number

    @OneToMany(() => TimeUnit, (timeUnit) => timeUnit.subscription,
        {nullable: true, cascade: ["insert", "update", "remove"], onDelete: 'CASCADE'})
    triggerTime: TimeUnit[]
}
