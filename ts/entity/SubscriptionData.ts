import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, TableInheritance, Unique} from "typeorm";
import {User} from "./User";
import {TimeUnit} from "./TimeUnit";

// @Entity('subsription_data')
// @TableInheritance({ column: { type: "varchar", name: "type", default: "subscription_threshold_data" } })
export abstract class SubscriptionData {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    country: string

    @ManyToOne(() => User)
    user: User

    // @Column({enum: ["SCHEDULED", "ON_CHANGE"], default: "ON_CHANGE"})
    // type: string

    // @OneToMany(() => TimeUnit, (timeUnit) => timeUnit.subscription,
    //     {nullable: true, cascade: ["insert", "update", "remove"]})
    // triggerTime: TimeUnit[]
}
