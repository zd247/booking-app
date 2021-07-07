import { Field, InputType } from 'type-graphql';

/**
 * see https://typegraphql.com/docs/extensions.html#using-the-extensions-decorator
 * for better 
 */
@InputType()
export class UsernamePasswordInput {
    @Field()
    email: string;

    @Field()
    username: string;

    @Field()
    password: string;
}
