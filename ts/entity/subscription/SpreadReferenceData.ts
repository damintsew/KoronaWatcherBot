import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {KoronaGarantexSpreadSubscription} from "./KoronaGarantexSpreadSubscription";

@Entity("spread_reference_data")
export class SpreadReferenceData {

    @PrimaryGeneratedColumn()
    id: number

    @Column({nullable: false})
    country: string

    @Column({nullable: true, type: "float"})
    koronaLastNotifiedValue: number

    @ManyToOne(type => KoronaGarantexSpreadSubscription, {eager: true})
    subscription: KoronaGarantexSpreadSubscription
}
