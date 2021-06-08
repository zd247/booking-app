import { FORGET_PASSWORD_PREFIX } from './../constants';
import { MyContext } from './../types';
import { Resolver, Query, Mutation, Arg, Ctx, Field, ObjectType} from 'type-graphql';
import { User } from '../entities/User';
import argon2 from 'argon2'
import { COOKIE_NAME } from '../constants';
import { isValidEmail } from '../utils/isValidEmail';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { validateRegister } from '../utils/validateRegister';
import { sendEmail } from '../utils/sendEmail'
import { v4 } from 'uuid'

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

    /**
     * This function check for errors
     * @param token 
     * @param newPassword 
     * @param param2 
     */
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() {em, redis, req}: MyContext
    ) {
        if (newPassword.length <= 2) {
            return {errors: [
                    {
                        field: "newPassword",
                        message: "length must be greater than 2",
                    },
                ]
            }
        }

        const userId = await redis.get(FORGET_PASSWORD_PREFIX +  token)
        if (!userId) {
            return {
                errors: [
                    {
                        field: "token",
                        message: "token expired",
                    },
                ]
            }
        }

        const user = await em.findOne(User, {_id: parseInt(userId)})

        
        if (!user) {
            return {errors: [
                    {
                        field: "token",
                        message: "user no longer exists",
                    },
                ]
            }
        }
        
        user.password = await argon2.hash(newPassword)
        em.persistAndFlush(user)

        // log in the user after change the password
        req.session.userId = user._id;

        return {user: user}
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() {em, redis}: MyContext,
    ) {
        const user = await em.findOne(User , {email})
        if (!user) {
            console.log ("there's no user with that email")
            return false
        }

        const token = v4()
        redis.set(
            FORGET_PASSWORD_PREFIX + token,
            user._id,
            'ex',
            1000 * 60 * 60 * 24 * 3) // 3 days stored in redis
        
        sendEmail(email, `<a href="http://localhost:3000/change-password/${token}">reset password</a>`)

        return true
    }


    @Mutation(()=> UserResponse)
    async register (
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() {em, req} : MyContext
    ): Promise<UserResponse>{
        const errors = validateRegister(options)
        if (errors) {
            return {errors}
        }

        const hashedPassword = await argon2.hash(options.password)
        const user = em.create(User, {
            email: options.email,
            username: options.username,
            password: hashedPassword
        })
        await em.persistAndFlush(user)


        // store the user's id in session, this will keep them logged in
        req.session.userId = user._id

        return {user}
    }

    @Mutation(()=> UserResponse)
    async login (
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() {em, req} : MyContext
    ){
        const user = await em.findOne(User,
            isValidEmail(usernameOrEmail) ? {email: usernameOrEmail} : {username: usernameOrEmail} )
        if (!user) {
            return {
                errors: [
                    {
                        field: "username or email",
                        message: "username or email provided doesn't exist",
                    }
                ]
            }
        }

        const valid = await argon2.verify(user.password, password)
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

    @Mutation(() => Boolean)
    logout (
        @Ctx() {res, req} : MyContext
    ) {
        
        return new Promise(resolve => req.session.destroy(err => {
            res.clearCookie(COOKIE_NAME)
            
            if (err) {
                console.log (err)
                resolve(false)
                return
            }
            

            resolve(true)
        })) 
    }
}
