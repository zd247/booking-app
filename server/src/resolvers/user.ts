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
    async me (@Ctx() { req} : MyContext){
        if (!req.session.userId) return null

        const user = await User.findOne(req.session.userId)
        return user
    }

    /**
     * check for user with the email in the params, if invalid then nah
     * if it's ok then we generate token with uuid
     * store user's id in redis with the set key
     * send email with reset-password link with token as query-params
     * 
     * @param email email to send to reset password link
     * @param param1 Context type
     * @returns True if the email is sucessfully sent by NodeMailer.
     */
     @Mutation(() => Boolean)
     async forgotPassword(
         @Arg('email') email: string,
         @Ctx() {redis}: MyContext,
     ) {
         const user = await User.findOne({where: {email}})
         if (!user) {
             console.log ("there's no user with that email")
             return false
         }
 
         // storing the user id with token as the key in the user's local memory and it will last 3 days
         const token = v4()
         redis.set(
             FORGET_PASSWORD_PREFIX + token,
             user._id,
             'ex',
             1000 * 60 * 60 * 24 * 3
         ) // 3 days stored in redis
         
         sendEmail(email, `<a href="http://localhost:3000/change-password/${token}">reset password</a>`)
 
         return true
     }

    /**
     * Only RUNS this funcion when the user pressed on the token link.
     * This function takes in the token from the query params
     * that returns user id.
     * From that we find the user and then
     * edit the password with the newPassword param and then hash
     * it. After that we update the database by using {em}
     * @param token query params for the token
     * @param newPassword newPassword input
     * @param context Custom context 
     */
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() {redis, req}: MyContext
    ): Promise<UserResponse>  {
        if (newPassword.length <= 2) {
            return {errors: [
                    {
                        field: "newPassword",
                        message: "length must be greater than 2",
                    },
                ]
            }
        }

        // check for stored user id in the local memory via redis
        const key = FORGET_PASSWORD_PREFIX +  token
        const userId = await redis.get(key)

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

        const userIdNum = parseInt(userId)
        const user = await User.findOne(userIdNum)   

        if (!user) {
            return {errors: [
                    {
                        field: "token",
                        message: "user no longer exists",
                    },
                ]
            }
        }
        
        const updatedPassword = await argon2.hash(newPassword)
        
        User.update(userIdNum, {password: updatedPassword})

        await redis.del(key) // can't change the token to reset the password.

        // log in the user after change the password
        req.session.userId = user._id;

        return {user}
    }

    


    /**
     * take in the options params from UsernamePasswordInput
     * validate the params option
     * hash the password
     * use em to create a new User and store mutated options field
     * in the database
     * @param options 
     * @param param1 
     * @returns 
     */
    @Mutation(()=> UserResponse)
    async register (
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() {req} : MyContext
    ): Promise<UserResponse>{
        const errors = validateRegister(options)
        if (errors) {
            return {errors}
        }

        const hashedPassword = await argon2.hash(options.password)
        
        const user = await User.create({
            email: options.email,
            username: options.username,
            password: hashedPassword
        }).save()


        // store the user's id in session, this will keep them logged in
        req.session.userId = user._id

        return {user}
    }


    /**
     * check for the valid email or username
     * unhash the password with argon2.verify() method 
     * return error if fail
     * else save the returned user detail to express session
     * @param usernameOrEmail 
     * @param password 
     * @param param2 
     * @returns user object
     */
    @Mutation(()=> UserResponse)
    async login (
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() {req} : MyContext
    ){
        const user = await User.findOne(
            isValidEmail(usernameOrEmail) ?
            {email: usernameOrEmail} :
            {username: usernameOrEmail}
        )
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


    /**
     * clear the cookie from the browser express-session
     * @param param0 
     * @returns 
     */
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
