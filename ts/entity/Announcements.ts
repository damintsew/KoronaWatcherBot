import {Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {LocalUser} from "./LocalUser";
import {JoinTable} from "typeorm/browser";
import {SendToUser} from "./announcement/SendToUser";

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

    @OneToMany(() => SendToUser, sendToUser => sendToUser.announcement,
        {cascade: true})
    sendToUser: SendToUser[]
}
