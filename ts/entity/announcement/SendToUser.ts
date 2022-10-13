import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Announcements} from "../Announcements";
import {LocalUser} from "../LocalUser";

@Entity('send_to_user')
export class SendToUser {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Announcements, (ann) => ann.messageId)
    announcement!: Announcements

    @ManyToOne(() => LocalUser, (user) => user.userId)
    user!: LocalUser

    @Column()
    date!: Date

}
