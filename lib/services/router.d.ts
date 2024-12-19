import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Logger } from 'winston';
import { ErrorTypes } from './error';
import { SentMsg } from './routerMsg';
import type { Config } from '../config';
export interface Status {
    chainId: number;
    localBlock: number;
    savedBlocks: number;
    onSync: boolean;
    errors: ErrorTypes[];
}
export declare function handleStatus(router: Router, reply: FastifyReply): Promise<void>;
export interface BlocksQuery {
    id?: number;
    length?: number;
    timestamp_gte?: number;
    timestamp_lte?: number;
}
export declare function handleBlocksQuery(router: Router, req: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function handleBlockQuery(type: 'blockHash' | 'blockNum', req: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function listenRouter(router: Router): Promise<void>;
export declare class Router {
    config: Config;
    logger: Logger;
    forkId: number;
    app: FastifyInstance;
    admin: FastifyInstance;
    messages: SentMsg[];
    constructor(config: Config, forkId?: number);
}
