import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Post {

    @PrimaryKey()
    _id!: number;

    @Property({type: 'text'})
    title!: string;

}