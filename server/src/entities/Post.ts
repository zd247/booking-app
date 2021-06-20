
import {ObjectType, Field} from 'type-graphql'
import { Column, Entity, PrimaryGeneratedColumn, BaseEntity, ManyToOne } from 'typeorm';
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

    @ManyToOne(() => User, user => user.posts)
    creator: User;
}