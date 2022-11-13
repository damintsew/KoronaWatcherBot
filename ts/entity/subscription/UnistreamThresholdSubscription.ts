import {ChildEntity, Column, Unique} from "typeorm";
import {BaseSubscription} from "./BaseSubscription";
import {ThresholdSubscription} from "./ThresholdSubscription";

@ChildEntity()
@Unique("constraint_unistream_subscr", ["user", "country", "type"])
export class UnistreamThresholdSubscription extends BaseSubscription implements ThresholdSubscription {

    @Column({nullable: false, type: "float"})
    notificationThreshold: number

    //todo maybe move to some middle entoty
    @Column({nullable: true, type: "float"})
    lastNotifiedValue: number

    @Column({nullable: true})
    country: string;
}
