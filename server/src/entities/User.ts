import {ObjectType, Field} from 'type-graphql'
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Post } from './Post';

@ObjectType()
@Entity()
export class User extends BaseEntity{
    @Field()
    @PrimaryGeneratedColumn()
    _id!: number;

    @Field(() => String)
    @Column({unique: true})
    username!: string;

    @Field(() => String)
    @Column({unique: true})
    email!: string;

    @Field(() => String)
    @Column()
    password!: string;

    @OneToMany(() => Post, post => post.creator)
    posts: Post[];

}