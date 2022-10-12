import {Entity, PrimaryGeneratedColumn, Column, PrimaryColumn, OneToMany} from "typeorm";
import {PaymentSubscription} from "./PaymentSubscription";

@Entity()
export class User {

    @PrimaryColumn({type: "bigint"})
    userId: number

    @Column({nullable: true, type: "bigint"})
    chatId: number

    @Column({nullable: true})
    firstName: string;

    @Column({nullable: true})
    lastName: string;

    @Column({nullable: true})
    username: string;

    @Column({nullable: true})
    isAdmin: boolean

    @OneToMany(() => PaymentSubscription,
        subscr => subscr.user)
    subscriptions: PaymentSubscription[]

}
