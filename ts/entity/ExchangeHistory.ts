import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, TableInheritance, Unique} from "typeorm";
import {User} from "./User";
import {TimeUnit} from "./TimeUnit";

@Entity('exchange_history')
// @TableInheritance({ column: { type: "varchar", name: "type", default: "subscription_threshold_data" } })
export class ExchangeHistory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    country: string

    @Column()
    currency: string

    @Column({nullable: false, type: "float"})
    value: number

    @Column()
    dateTime: Date

}
