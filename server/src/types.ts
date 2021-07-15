import { Redis } from 'ioredis';
import { Request, Response } from "express"
import { createUpdootLoader } from "./utils/createUpdootLoader";

export type MyContext = {
    req: Request & { session: Express.Session }
    redis: Redis
    res: Response
    updootLoader: ReturnType<typeof createUpdootLoader>;
}