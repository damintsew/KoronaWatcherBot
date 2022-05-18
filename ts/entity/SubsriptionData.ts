import {Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique} from "typeorm";
import {User} from "./User";

@Entity('subsription_data')
@Unique("constraint_unique_subscription", ['country', 'notificationThreshold', "user"])
export class SubsriptionData {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    country: string

    @Column()
    notificationThreshold: number

    @ManyToOne(() => User)
    user: User
}
