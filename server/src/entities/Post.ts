
import {ObjectType, Field} from 'type-graphql'
import { Column, Entity, PrimaryGeneratedColumn, BaseEntity, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Updoot } from './Updoot';
import { User } from './User';

@ObjectType()
@Entity()
export class Post extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    _id!: number;

    @Field()
    @Column()
    title!: string;

    @Field()
    @Column()
    text!: string;

    @Field()
    @Column({type: "int", default: 0})
    points!: number;

    @Field()
    @Column()
    creatorId: number

    @Field()
    @ManyToOne(() => User, user => user.posts)
    creator: User;

    @OneToMany(() => Updoot, updoot => updoot.post)
    updoots: Updoot[];

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date
}