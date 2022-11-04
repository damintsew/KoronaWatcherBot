import {ChildEntity, Column, OneToMany, Unique} from "typeorm";
import {BaseSubscription} from "./BaseSubscription";
import {SpreadReferenceData} from "./SpreadReferenceData";

@ChildEntity()
// @Unique("constraint_kotona-garantex_spread_subscr", ["user", "county", "type"])
export class KoronaGarantexSpreadSubscription extends BaseSubscription {

    @Column({nullable: false, type: "float"})
    notificationThreshold: number

    @Column({nullable: true, type: "float"})
    garantexLastNotifiedValue: number

    @OneToMany(() => SpreadReferenceData, referenceData => referenceData.subscription,
        {cascade: ["insert", "update", "remove"]/*, eager: true*/})
    referenceData: SpreadReferenceData[]
}
