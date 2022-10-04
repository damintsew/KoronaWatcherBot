import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Announcements} from "../Announcements";
import {User} from "../User";

@Entity('send_to_user')
export class SendToUser {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Announcements, (ann) => ann.messageId)
    announcement!: Announcements

    @ManyToOne(() => User, (user) => user.userId)
    user!: User

    @Column()
    date!: Date

}
