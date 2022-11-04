import {ChildEntity, Column, Unique} from "typeorm";
import {BaseSubscription} from "./BaseSubscription";

@ChildEntity()
@Unique("constraint_garantex_subscr", ["user", "market", "type"])
export class GarantexSubscription extends BaseSubscription {

    @Column({nullable: false, type: "float"})
    notificationThreshold: number

    @Column({nullable: false})
    market: string

    //todo maybe move to some middle entoty
    @Column({nullable: true, type: "float"})
    lastNotifiedValue: number
}
