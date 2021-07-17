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
import { Updoot } from "./../entities/Updoot";

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
  /* -------------------------------------------------------------------------- */
  /*                               Field resolvers                              */
  /* -------------------------------------------------------------------------- */
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

  // @FieldResolver(() => Int, { nullable: true })
  // async voteStatus(
  //   @Root() post: Post,
  //   @Ctx() { updootLoader, req }: MyContext
  // ) {
  //   if (!req.session.userId) {
  //     return null;
  //   }

  //   const updoot = await updootLoader.load({
  //     postId: post._id,
  //     userId: req.session.userId,
  //   });

  //   return updoot ? updoot.value : null;
  // }

  /* -------------------------------------------------------------------------- */
  /*                            extra functionalities                           */
  /* -------------------------------------------------------------------------- */

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

    // see if the user has an entry in the database (with the postId and userId)
    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // the user has voted on the post before
    // and they are changing their vote
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        // update the updoot entry
        await tm.query(
          `
          update updoot
          set value = $1
          where "postId" = $2 and "userId" = $3
          `,
          [realValue, postId, userId]
        );

        // update the post points. (if the user upvoted before, then the value is 1, thus when the user click the downvote then the value should be -2 or 2.
        await tm.query(
          `
          update post
          set points = points + $1
          where _id = $2
        `,
          [2 * realValue, postId]
        );
      });
    } else if (!updoot) {
      // has never voted before
      await getConnection().transaction(async (tm) => {
        // create an updoot entry
        await tm.query(
          `
          insert into updoot ("userId", "postId", value)
          values ($1, $2, $3)
          `,
          [userId, postId, realValue]
        );

        // update the points value of the post.
        await tm.query(
          `
          update post
          set points = points + $1
          where _id = $2
          `,
          [realValue, postId]
        );
      });
    }
    return true;
  }

  /* -------------------------------------------------------------------------- */
  /*                                    CRUD                                    */
  /* -------------------------------------------------------------------------- */

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
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    // 20 -> 21
    const realLimit = Math.min(50, limit);
    const reaLimitPlusOne = realLimit + 1;

    const replacements: any[] = [reaLimitPlusOne];

    if (req.session.userId) {
      replacements.push(req.session.userId);
    }

    let cursorIdx = 3;
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      cursorIdx = replacements.length;
    }

    const posts = await getConnection().query(
      `
     select p.*,
     json_build_object(
       '_id', u._id,
       'username', u.username,
       'email', u.email,
       'createdAt', u."createdAt",
       'updatedAt', u."updatedAt"
       ) creator,
     ${
       req.session.userId
         ? '(select value from updoot where "userId" = $2 and "postId" = p._id) "voteStatus"'
         : 'null as "voteStatus"'
     }
     from post p
     inner join public.user u on u._id = p."creatorId"
     ${cursor ? `where p."createdAt" < $${cursorIdx}` : ""}
     order by p."createdAt" DESC
     limit $1
     `,
      replacements
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === reaLimitPlusOne,
    };
  }

  /**
   * find the post with the given id in the params
   * @param _id id of the post to be found.
   */
  @Query(() => Post, { nullable: true })
  async post(@Arg("id", () => Int) _id: number): Promise<Post> {
    const post = await getConnection().query(
      `
    select p.*,
    json_build_object(
      '_id', u._id,
      'username', u.username,
      'email', u.email,
      'createdAt', u."createdAt",
      'updatedAt', u."updatedAt"
      ) creator
    from post p
    inner join public.user u
     on u._id = p."creatorId"
    where p._id = $1
    `,
      [_id]
    );

    return post[0]
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
    @Arg("id", () => Int) _id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('_id = :id and "creatorId" = :creatorId', {
        _id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) _id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // not cascade way
    // const post = await Post.findOne(_id);
    // if (!post) {
    //   return false;
    // }
    // if (post.creatorId !== req.session.userId) {
    //   throw new Error("not authorized");
    // }

    // await Updoot.delete({ postId: _id });
    // await Post.delete({ _id });

    await Post.delete({ _id, creatorId: req.session.userId });
    return true;
  }
}
