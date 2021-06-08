import { Redis } from 'ioredis';
import {  IDatabaseDriver, Connection, EntityManager } from "@mikro-orm/core"
import { Request, Response } from "express"

export type MyContext = {
    em: EntityManager<IDatabaseDriver<Connection>>
    req: Request & { session: Express.Session }
    redis: Redis
    res: Response
}