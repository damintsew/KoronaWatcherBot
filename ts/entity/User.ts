import {Entity, PrimaryGeneratedColumn, Column, PrimaryColumn} from "typeorm";

@Entity()
export class User {

    @PrimaryColumn()
    userId: number

    @Column({nullable: true})
    chatId: number

    @Column({nullable: true})
    firstName: string;

    @Column({nullable: true})
    lastName: string;

    @Column({nullable: true})
    username: string;

    @Column({nullable: true})
    isAdmin: boolean

}
