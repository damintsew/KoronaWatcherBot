import {Column, Entity, OneToMany, PrimaryColumn} from "typeorm";
import {PaymentSubscription} from "./PaymentSubscription";

@Entity("user")
export class LocalUser {

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

    @Column({nullable: false, default: false})
    deletionMark: boolean

}
