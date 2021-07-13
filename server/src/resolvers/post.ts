import { isAuth } from "./../middleware/isAuth";
import { MyContext } from "./../types";
import { Post } from "./../entities/Post";
import {
  Resolver,
  Query,
  Arg,
  Mutation,
  Field,
  InputType,
  Ctx,
  UseMiddleware,
  Int,
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";
import { getConnection } from "typeorm";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field()
  hasMore: boolean;
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
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1; // upvote or downvote
    const { userId } = req.session; // <=> const userId = req.session.userId

    // // create new upvote object which describes the voting
    // await Updoot.insert({
    //   userId,
    //   postId,
    //   value: realValue,
    // })

    // update the post points through raw sql query.
    // do this so that if one of the query fail, they both fail.
    await getConnection().query(
      `
    START TRANSACTION;

      insert into updoot ("userId", "postId", value)
      values (${userId}, ${postId}, ${realValue});

      update post
      set points = points + ${realValue}
      where _id = ${postId};
      
    COMMIT;
    `
    )

    return true;
  }

  /**
   * This function query all posts data object from the Post entity with pagination
   * This function also contain post paginations to reduce the load for server req
   * and also the front-end for better rendering experience and caching.
   *
   * hasMore indicator shows that if there's any data left to query after each pagination
   *
   * @param limit limiting how
   * @param cursor pick a location in the list of Post, the function will
   * take all data before or after it
   */
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    // cap the limit at 50 if we pass more than 50, prevent fetching the whole database
    const realLimit = Math.min(50, limit); // fetching 1 more than what we need
    const realLimitPlusOne = realLimit + 1;

    // advanced SQL statements for replacing query builder.
    const replacements: any[] = [realLimitPlusOne];
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
    }
    const posts = await getConnection().query(
      `
    select p.*,
    json_build_object (
      '_id', u._id,
      'username', u.username,
      'email', u.email
    ) creator
    from post p
    inner join public.user u on u._id = p."creatorId"
    ${cursor ? `where p."createdAt" < $2` : ""}
    order by p."createdAt" DESC
    limit $1
    `,
      replacements
    );

    // // using typeORM query builder to use more advanced query
    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   // get user with joinning relations
    //   // see https://typeorm.io/#/select-query-builder/joining-relations for more
    //   .innerJoinAndSelect("p.creator", "u", 'u._id = p."creatorId')
    //   .orderBy('p."createdAt"', "DESC")
    //   .take(realLimitPlusOne);
    // // if the cursor params is passed, let the query builder to selectively query data
    // if (cursor) {
    //   qb.where('p."createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
    // }

    // // execute fetching query
    // const posts = await qb.getMany();

    console.log (posts)

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  /**
   * find the post with the given id in the params
   * @param _id id of the post to be found.
   */
  @Query(() => Post, { nullable: true })
  async post(@Arg("id") _id: number) {
    return await Post.findOne(_id);
  }

  /**
   * insert new post data to the Post table
   */
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return await Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id") _id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(_id);
    if (!post) return null;

    if (typeof title !== undefined) {
      await Post.update(_id, {
        title: title,
      });
    }
    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id") _id: number): Promise<boolean> {
    await Post.delete(_id);
    return true;
  }
}
