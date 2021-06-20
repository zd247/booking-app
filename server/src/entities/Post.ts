
import {ObjectType, Field} from 'type-graphql'
import { Column, Entity, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@ObjectType()
@Entity()
export class Post extends BaseEntity {
    @Field()
    @PrimaryGeneratedColumn()
    _id!: number;

    @Field(() => String)
    @Column({nullable: true})
    title!: string;
}