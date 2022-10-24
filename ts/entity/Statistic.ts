import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {LocalUser} from "./LocalUser";

@Entity()
export class Statistic {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    date: Date

    @Column()
    action: string

    @ManyToOne(() => LocalUser)
    user: LocalUser
}
