import "reflect-metadata";
import { createConnection } from "typeorm";
import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import PostResolver from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import cors from "cors";
import session from "express-session";
import Redis from "ioredis";
import path from "path";
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import { Updoot } from "./entities/Updoot";

// The order of middleware declarations matter since it will tell ApolloServer to them in order
const main = async () => {
  // create a connection with the TypeORM with psql (declare new entities here)
  const conn = await createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    logging: true,
    username: "postgres",
    password: "password",
    database: "lireddit2",
    entities: [User, Post, Updoot],
    name: "default",
    migrations: [path.join(__dirname, "./migrations/*")],
    synchronize: false,
  });

  // running custom migrations
  await conn.runMigrations();

  // Uncomment these below when you need to reset all entities
  // Post.delete({})
  // User.delete({})

  // declare redis
  const RedisStore = require("connect-redis")(session);
  const redis = new Redis();

  // init Express app (I think express is a framework that let javascript talk to the web browser)
  const app = express();
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
  // https://www.npmjs.com/package/express-session
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __prod__, // cookie only works in https
      },
      saveUninitialized: false,
      secret: "abcd1234",
      resave: false,
    })
  );

  // Graphql server client middleware (register resolvers here)
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res, redis }),
  });
  apolloServer.applyMiddleware({ app, cors: false });

  // start express server
  app.listen(4000, () => {
    console.log(
      "người phục vụ (server) tên là Express-Graphql-ORM đang chờ lệnh ở cổng http://localhost:4000"
    );
  });
};

main().catch((err) => {
  console.log(err);
});
