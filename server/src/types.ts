import { MikroORM, IDatabaseDriver, Connection, EntityManager } from "@mikro-orm/core"

export type MyContext = {
    em: MikroORM<IDatabaseDriver<Connection>> & EntityManager<IDatabaseDriver<Connection>>    
}