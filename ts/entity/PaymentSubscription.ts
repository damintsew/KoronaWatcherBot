import {Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique} from "typeorm";
import {User} from "./User";

@Entity('payment_subscription')
@Unique("constraint_unique_payment_subscription", ['type', "user", "trial"])
export class PaymentSubscription {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User)
    user: User

    @Column({nullable: false})
    startDate: Date

    @Column({nullable: false})
    expirationDate: Date

    @Column({nullable: false})
    type: string

    @Column()
    trial: boolean
}