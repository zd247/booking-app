import { MyContext } from './../types';
import { Resolver, Query, Mutation, Arg, Ctx, Field, InputType, ObjectType} from 'type-graphql';
import { User } from '../entities/User';
import argon2 from 'argon2'

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string

    @Field()
    password: string
}

@ObjectType()
class FieldError {
    @Field()
    field: string

    @Field()
    message: string
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[]

    @Field(() => User, {nullable: true})
    user?: User
}

@Resolver()
export class UserResolver {

    // return user based on the stored session cookie
    @Query(() => User, {nullable: true})
    async me (@Ctx() {em, req} : MyContext){
        if (!req.session.userId) return null

        const user = await em.findOne(User , {_id: req.session.userId})
        return user

    }


    @Mutation(()=> UserResponse)
    async register (
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() {em, req} : MyContext
    ){
        if (options.username.length <= 2) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "length must be greater than 2"
                    }
                ],
            }
        }

        const tempUser = await em.findOne(User , {username: options.username})
        if (tempUser) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "username already existed"
                    }
                ],
            }
        }

        if (options.password.length <= 3) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "length must be greater than 3"
                    }
                ],
            }
        }


        const hashedPassword = await argon2.hash(options.password)
        const user = em.create(User, {username: options.username, password: hashedPassword})
        await em.persistAndFlush(user)


        // store the user's id in session, this will keep them logged in
        req.session.userId = user._id

        return {user}
    }

    @Mutation(()=> UserResponse)
    async login (
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() {em, req} : MyContext
    ){
        const user = await em.findOne(User , {username: options.username})
        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "username provided doesn't exist",
                    }
                ]
            }
        }

        const valid = await argon2.verify(user.password, options.password)
        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "incorrect password"
                    }
                ]
            }
        }

        // store 
        req.session!.userId = user._id;

        return {user}
        
    }
}
