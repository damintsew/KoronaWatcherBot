import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {PaymentSubscription} from "./PaymentSubscription";

@Entity('payment_subscription_notification')
export class PaymentSubscriptionNotification {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: false})
    sendDate: Date

    @Column({nullable: false})
    message: string

    @ManyToOne(() => PaymentSubscription)
    subscription: PaymentSubscription
}
