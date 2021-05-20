import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import {ObjectType, Field} from 'type-graphql'

@ObjectType()
@Entity()
export class Post {
    @Field()
    @PrimaryKey()
    _id!: number;

    @Field(() => String)
    @Property({type: 'text'})
    title!: string;

}