import {Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique} from "typeorm";
import {KoronaGarantexSpreadSubscription} from "./KoronaGarantexSpreadSubscription";

@Entity("spread_reference_data")
@Unique("usnique_suncription_data", ["country", "subscription"])
export class SpreadReferenceData {

    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: false})
    country: string

    @Column({nullable: true, type: "float"})
    koronaLastNotifiedValue: number

    @Column({nullable: true, type: "float"})
    lastNotifiedSpreadValue: number

    @Index("subscription_ind")
    @ManyToOne(type => KoronaGarantexSpreadSubscription,
        {
            eager: false, onDelete: "CASCADE", orphanedRowAction: 'delete'
        })
    subscription: KoronaGarantexSpreadSubscription
}
