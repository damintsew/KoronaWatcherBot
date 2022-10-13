import {Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, TableInheritance, Unique} from "typeorm";
import {LocalUser} from "./LocalUser";
import {TimeUnit} from "./TimeUnit";

@Entity('exchange_history')
export class ExchangeHistory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false, default: "KORONA"})
    type: string

    @Column({nullable: true})
    market: string //garantex

    @Index("country_ind")
    @Column({nullable: true})
    country: string //corona

    @Column()
    currency: string

    @Column({nullable: false, type: "float"})
    value: number

    @Column()
    dateTime: Date

}
