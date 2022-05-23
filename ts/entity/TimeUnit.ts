import {Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique} from "typeorm";
import {SubsriptionData} from "./SubsriptionData";

@Entity('time_unit')
@Unique("constraint_unique_time_unit", ['timeHours', 'subscription'])
export class TimeUnit {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    timeHours: number

    @ManyToOne(() => SubsriptionData, (SubsriptionData) => SubsriptionData.id)
    subscription: SubsriptionData
}
