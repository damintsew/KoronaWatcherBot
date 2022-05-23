import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique} from "typeorm";
import {User} from "./User";
import {TimeUnit} from "./TimeUnit";

@Entity('subsription_data')
// @Unique("constraint_unique_subscription_2", ['country',  "user"])// todo !! notificationThreshold'
export class SubsriptionData {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    country: string

    @Column({nullable: true})
    notificationThreshold: number

    @Column({nullable: true, type: "float"})
    lastNotifiedValue: number

    @ManyToOne(() => User)
    user: User

    @Column({enum: ["SCHEDULED", "ON_CHANGE"], default: "ON_CHANGE"})
    type: string

    @OneToMany(() => TimeUnit, (timeUnit) => timeUnit.subscription,
        {nullable: true, cascade: ["insert", "update", "remove"]})
    triggerTime: TimeUnit[]
}
