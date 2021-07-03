import 'reflect-metadata'

import { createConnection } from 'typeorm';


import { COOKIE_NAME, __prod__ } from './constants';

import express from 'express'
import {ApolloServer} from 'apollo-server-express'
import {buildSchema} from 'type-graphql'
import PostResolver from './resolvers/post';
import { UserResolver } from './resolvers/user';
import cors from 'cors'
import session from 'express-session';
import Redis from 'ioredis'

import { User } from './entities/User';
import { Post } from './entities/Post';

// The order of middleware declarations matter since it will tell ApolloServer to them in order
const main = async () => {
        
   await createConnection({
        type: "postgres",
        host: "localhost",
        port: 5432,
        logging: true,
        username: "postgres",
        password: "password",
        database: "lireddit2",
        entities: [User, Post],
        name: "default",
        synchronize: true,
    })

    // Post.delete({})
    // User.delete({})
   

    const app = express()

    const RedisStore = require('connect-redis')(session)
    const redis = new Redis()

    // use cors for client connections
    app.use(
        cors({
            origin: "http://localhost:3000",
            credentials: true
        })
    )

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({ client: redis, disableTouch: true }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                httpOnly: true,
                sameSite: 'lax', // csrf
                secure: __prod__ // cookie only works in https
            },
            saveUninitialized: false,
            secret: 'abcd1234',
            resave: false,
        })
    )


    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({ req, res, redis }),
    })
    apolloServer.applyMiddleware({app, cors: false})


    // start express server
    app.listen(4000, () => {
        console.log("người phục vụ (server) tên là Express-Graphql-ORM đang chờ lệnh ở cổng http://localhost:4000");
    })
  

}

main().catch((err) => {
    console.log(err);
})

// 0. init the dev environment 
// 1. setting up mikro-orm entities and migration
// 2. apply the TypeGraphQL middleware to the Express App through apolloServer
// 3. Store session cookies in cache memory using Redis (use session middleware inside the apollo middleware)
