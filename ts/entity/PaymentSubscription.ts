import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique} from "typeorm";
import {LocalUser} from "./LocalUser";
import {PaymentSubscriptionNotification} from "./PaymentSubscriptionNotification";

@Entity('payment_subscription')
@Unique("constraint_unique_payment_subscription", ['type', "user", "trial"])
export class PaymentSubscription {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => LocalUser)
    user: LocalUser

    @Column({nullable: false})
    startDate: Date

    @Column({nullable: false})
    expirationDate: Date

    @Column({nullable: false})
    type: string

    @Column()
    trial: boolean

    @OneToMany(() => PaymentSubscriptionNotification,
        subscr => subscr.subscription, {cascade: ["insert", "update", "remove"]})
    subscriptionNotifications: PaymentSubscriptionNotification[]
}
