import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./User";

@Entity('subsription_data')
export class SubsriptionData {

    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    country: string
    // @Column()
    // notificationType: string

    @Column()
    notificationThreshold: number
    // @Column()
    // workType: string
    // @Column()
    // overallDescription: string
    @ManyToOne(() => User)
    user: User
}
