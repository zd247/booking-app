import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
import { User } from './entities/User';
import path from 'path'

export default {
    migrations: {
        path: path.join(__dirname, './migrations'),
        pattern: /^[\w-]+\d+\.[tj]s$/, 
    },
    user: 'postgres',
    password: 'password',
    entities: [Post, User],
    dbName: "lireddit",
    debug: !__prod__,
    type: "postgresql"
} as Parameters<typeof MikroORM.init>[0];