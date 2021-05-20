import 'reflect-metadata'

import { __prod__ } from './constants';

import {MikroORM} from '@mikro-orm/core'
import mikroConfig from './mikro-orm.config'

import express from 'express'
import {ApolloServer} from 'apollo-server-express'
import {buildSchema} from 'type-graphql'
import HelloResolver from './resolvers/hello';
import PostResolver from './resolvers/post';


const main = async () => {
    // init ORM and migrate to latest
    const orm = await MikroORM.init(mikroConfig)    
    await orm.getMigrator().up()

    // express app
    const app = express()

    // init GRAPHQL and apply in Express app
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver],
            validate: false,
        }),
        context: () => ({em: orm.em})
    })
    apolloServer.applyMiddleware({app})



    // routes
    app.get('/', (_, res) => {
        res.send("hello")
    })

    // init 
    app.listen(4000, () => {
        console.log("server is running on port 4000s");
    })
  

}

main().catch((err) => {
    console.log(err);
})