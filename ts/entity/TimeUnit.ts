import {Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique} from "typeorm";
import {SubscriptionData} from "./SubscriptionData";
import {SubscriptionScheduledData} from "./SubscriptionScheduledData";

@Entity('time_unit')
@Unique("constraint_unique_time_unit", ['timeHours', 'subscription'])
export class TimeUnit {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    timeHours: number

    @ManyToOne(() => SubscriptionScheduledData,
        (SubscriptionScheduledData) => SubscriptionScheduledData.id,
        {nullable: false})
    subscription: SubscriptionScheduledData
}
