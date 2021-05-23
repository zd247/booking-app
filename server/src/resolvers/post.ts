import { MyContext } from './../types';
import { Post } from './../entities/Post';
import { Resolver, Query, Ctx, Arg, Mutation} from "type-graphql";

@Resolver()
export default class PostResolver {
    @Query(() => [Post], {nullable: true})
    posts (@Ctx() {em}: MyContext): Promise<Post[]> {
        return em.find(Post, {})
    }

    @Query(() => Post, {nullable: true})
    post ( 
        @Arg('id') _id: number,
        @Ctx() {em}: MyContext
    ): Promise<Post | null> {
        return em.findOne(Post, {_id})
    }

    @Mutation(() => Post)
    async createPost ( 
        @Arg('title') title: string,
        @Ctx() {em}: MyContext
        ): Promise<Post> {
        const post = em.create(Post, {title})
        await em.persistAndFlush(post)
        return post
    }

    @Mutation(() => Post, {nullable: true})
    async updatePost ( 
        @Arg('id') _id: number,
        @Arg('title', () => String, {nullable: true}) title: string,
        @Ctx() {em}: MyContext
    ): Promise<Post | null> {
        const post = await em.findOne(Post, {_id})
        if (!post) return null

        if (typeof title !== undefined){
            post.title = title
            await em.persistAndFlush(post)
        }
        return post
    }

    @Mutation(() => Boolean)
    async deletePost ( 
        @Arg('id') _id: number,
        @Ctx() {em}: MyContext
    ): Promise<boolean> {
        await em.nativeDelete(Post , {_id})
        return true
    }
}