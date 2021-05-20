import { MyContext } from './../types';
import { Resolver,  Mutation, Arg, Ctx } from 'type-graphql';
import { User } from 'src/entities/User';


@Resolver()
export class UserResolver {
    @Mutation()
    async createUser (
        @Arg('username') username: string,
        @Arg('password') password: string,
        @Ctx() {em} : MyContext
    ){
        const user = em.create(User, {username})
        await em.persistAndFlush(user)
        return user
    }
}
