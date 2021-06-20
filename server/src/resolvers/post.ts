import { Post } from './../entities/Post';
import { Resolver, Query, Arg, Mutation} from "type-graphql";

@Resolver()
export default class PostResolver {
    @Query(() => [Post], {nullable: true})
    async posts (): Promise<Post[]> {
        return await Post.find()
    }

    @Query(() => Post, {nullable: true})
    async post ( 
        @Arg('id') _id: number
    ) {
        return await Post.findOne(_id)
    }

    @Mutation(() => Post)
    async createPost ( 
        @Arg('title') title: string
    ): Promise<Post> {
        const post = await Post.create({title}).save()
        
        return post
    }

    @Mutation(() => Post, {nullable: true})
    async updatePost ( 
        @Arg('id') _id: number,
        @Arg('title', () => String, {nullable: true}) title: string
    ): Promise<Post | null> {
        const post = await Post.findOne(_id)
        if (!post) return null

        if (typeof title !== undefined){
            await Post.update(_id, {
                title: title
            })
        }
        return post
    }

    @Mutation(() => Boolean)
    async deletePost ( 
        @Arg('id') _id: number
    ): Promise<boolean> {
        await Post.delete(_id)
        return true
    }
}