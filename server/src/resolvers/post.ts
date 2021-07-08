import { isAuth } from './../middleware/isAuth';
import { MyContext } from './../types';
import { Post } from './../entities/Post';
import { Resolver, Query, Arg, Mutation, Field, InputType, Ctx, UseMiddleware, Int, FieldResolver, Root} from "type-graphql";
import { getConnection } from 'typeorm';

@InputType()
class PostInput {
    @Field()
    title: string
    @Field()
    text: string
}


@Resolver(Post)
export default class PostResolver {
    /**
     * with this FieldResolver() decorator in place...
     * this function will add a new return field for this entity's resolver
     * ONLY USE THIS FUNCTION FOR SPECIAL QUERY 
     * the name of the function will represent the field name.
     * see https://typegraphql.com/docs/extensions.html#using-the-extensions-decorator
     * 
     * @param root The Entity to add field to
     */
    @FieldResolver(() => String)
    textSnippet (@Root() root: Post) {
        return root.text.slice(0, 50)
    }


    /**
     * This function query all posts data object from the Post entity with pagination
     * This function also contain post paginations to reduce the load for server req
     * and also the front-end for better rendering experience and caching.
     * 
     * @param limit limiting how 
     * @param cursor pick a location in the list of Post, the function will 
     * take all data before or after it
     */
    @Query(() => [Post], {nullable: true})
    async posts(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string | null
    ){
        // set the limit 
        const realLimit = Math.min(50, limit)

        // using typeORM query builder to better query for the post with predefined options.
        const qb = (
            getConnection()
            .getRepository(Post)
            .createQueryBuilder("p")
            .orderBy('"createdAt"', 'DESC')
            .take(realLimit)
        )
        

        // if the cursor params is passed, let the query builder to selectively query data
        if (cursor) {
            qb.where('"createdAt" < :cursor', {cursor: new Date(parseInt(cursor))})
        }

        return qb.getMany()

    }

    /**
     * find the post with the given id in the params
     * @param _id id of the post to be found.
     */
    @Query(() => Post, {nullable: true})
    async post ( 
        @Arg('id') _id: number
    ) {
        return await Post.findOne(_id)
    }


    /**
     * insert new post data to the Post table
     */
    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost ( 
        @Arg("input") input : PostInput,
        @Ctx() {req}:  MyContext
    ): Promise<Post> {
        return await Post.create({
            ...input,
            creatorId: req.session.userId
        }).save()
        
    }

    
    
    @Mutation(() => Post, {nullable: true})
    @UseMiddleware(isAuth)
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