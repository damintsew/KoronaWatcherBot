import {Column, Entity, ManyToOne, PrimaryGeneratedColumn, TableInheritance} from "typeorm";
import {LocalUser} from "../LocalUser";

@Entity("subscription")
@TableInheritance({column: {type: "varchar", name: "class_type"}})
export class BaseSubscription {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => LocalUser)
    user: LocalUser

    @Column({nullable: false})
    type: string

}
