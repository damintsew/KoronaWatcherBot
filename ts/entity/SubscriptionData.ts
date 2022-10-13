import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, TableInheritance, Unique} from "typeorm";
import {LocalUser} from "./LocalUser";

export abstract class SubscriptionData {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    country: string

    @ManyToOne(() => LocalUser)
    user: LocalUser
}
