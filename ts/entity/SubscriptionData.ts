import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, TableInheritance, Unique} from "typeorm";
import {User} from "./User";

export abstract class SubscriptionData {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    country: string

    @ManyToOne(() => User)
    user: User
}
