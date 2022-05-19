import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity('announcement')
export class Announcements {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({unique: true})
    messageId: number

    @Column()
    text: string;

    @Column()
    isSent: boolean;

    @Column()
    timeToSent: Date

}
