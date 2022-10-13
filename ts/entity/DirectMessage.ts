import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity('direct_message')
export class DirectMessage {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    messageId: number

    @Column()
    sourceMessageId: number

    @Column()
    userId: number

    @Column()
    text: string;
}
