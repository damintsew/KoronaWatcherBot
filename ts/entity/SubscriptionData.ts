import {Column, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {LocalUser} from "./LocalUser";

export abstract class SubscriptionData {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    country: string;

    @ManyToOne(() => LocalUser)
    user: LocalUser

    @Column({default: "KORONA"})
    type: string
}
