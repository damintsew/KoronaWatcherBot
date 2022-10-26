import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {LocalUser} from "./LocalUser";


@Entity()
export class PendingTxId {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => LocalUser)
    user: LocalUser

    @Column({nullable: false})
    transactionId: string
}
