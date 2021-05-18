import { __prod__ } from './constants';
import {MikroORM} from '@mikro-orm/core'
import { Post } from './entities/Post';
import mikroConfig from './mikro-orm.config'

const main = async () => {
    const orm = await MikroORM.init(mikroConfig)    

    await orm.getMigrator().up()
    
    // const tempPost = orm.em.create(Post, {title: 'title1'})
    // orm.em.persistAndFlush(tempPost)

}

main().catch((err) => {
    console.log(err);
})