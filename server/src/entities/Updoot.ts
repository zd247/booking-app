import { ObjectType, Field } from "type-graphql";
import {
  Column,
  Entity,
  BaseEntity,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

// many to many
// many users can upvote the same post
// an user can upvote many posts
// user <-> posts
// user -> join table <- posts
// use -> updoot <- posts

@Entity()
export class Updoot extends BaseEntity {
  @Column({ type: "int" })
  value: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.updoots)
  user: User;

  @PrimaryColumn()
  postId: number;

  @ManyToOne(() => Post, (post) => post.updoots, {
    onDelete: "CASCADE",
  })
  post: Post;
}
