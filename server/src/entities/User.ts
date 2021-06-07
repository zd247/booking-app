import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import {ObjectType, Field} from 'type-graphql'

@ObjectType()
@Entity()
export class User {
    @Field()
    @PrimaryKey()
    _id!: number;

    @Field(() => String)
    @Property({type: 'text', unique: true})
    username!: string;

    @Field(() => String)
    @Property({type: 'text', unique: true})
    email!: string;

    @Field(() => String)
    @Property({type: 'text'})
    password!: string;

}