import { fastify, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { fastifyCors } from '@fastify/cors';
import type { Logger } from 'winston';

import { connectDB, Block, IBlock } from './db';
import { blockHashSchema, blockNumSchema, bodySchema } from './schema';
import { getLogger } from './logger';
import { ErrorTypes, ErrorMessages } from './error';
import { resolveMessages, sendMessage, SentMsg } from './routerMsg';
import type { Config } from '../config';

export interface Status {
    chainId: number;
    localBlock: number;
    savedBlocks: number;
    onSync: boolean;
    errors: ErrorTypes[];
}

export async function handleStatus(router: Router, reply: FastifyReply) {
    const {
        config: { chainId },
    } = router;

    const [{ localBlock, onSync, errors }, savedBlocks] = await Promise.all([
        sendMessage<{
            localBlock: number;
            onSync: boolean;
            errors: ErrorTypes[];
        }>(router, { type: 'status' }),
        Block.countDocuments({}),
    ]);

    reply.header('Content-Type', 'application/json; charset=utf-8').send(
        JSON.stringify(
            {
                chainId,
                localBlock,
                savedBlocks,
                onSync,
                errors,
            } as Status,
            null,
            2,
        ),
    );
}

export interface BlocksQuery {
    id?: number;
    length?: number;
    timestamp_gte?: number;
    timestamp_lte?: number;
}

export async function handleBlocksQuery(router: Router, req: FastifyRequest, reply: FastifyReply) {
    try {
        const {
            config: { maxReturn },
        } = router;

        const queries: BlocksQuery[] = [];

        if (!Array.isArray(req.body)) {
            const r = req.body as BlocksQuery;

            if (r.length && r.length > maxReturn) {
                throw new Error('Exceeds return length');
            }

            queries.push({
                ...r,
                id: r.id || 0,
            });
        } else {
            queries.push(
                ...(req.body as BlocksQuery[]).map((r, i) => {
                    if (r.length && r.length > maxReturn) {
                        throw new Error('Exceeds return length');
                    }

                    return {
                        ...r,
                        id: r.id || i,
                    };
                }),
            );
        }

        const facetQuery = queries.reduce(
            (acc, curr) => {
                const timestamp: Record<string, number> = {};

                if (curr.timestamp_gte) {
                    timestamp['$gte'] = curr.timestamp_gte;
                }

                if (curr.timestamp_lte) {
                    timestamp['$lte'] = curr.timestamp_lte;
                }

                // mongodb pipeline
                const pipeline = [];

                pipeline.push({ $sort: { timestamp: -1 } });

                if (Object.keys(timestamp).length) {
                    pipeline.push({ $match: { timestamp } });
                }

                pipeline.push({ $limit: curr.length || maxReturn });

                acc[curr.id as number] = pipeline;

                return acc;
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {} as Record<string, any[]>,
        );

        const aggregateResult = (await Block.aggregate([{ $facet: facetQuery }]))[0] as Record<string, IBlock[]>;

        const result = queries.map((q) => ({
            id: q.id,
            blocks: aggregateResult[q.id as number].map(({ hash, number, timestamp }) => ({ hash, number, timestamp })),
        }));

        reply.send(!Array.isArray(req.body) ? result[0] : result);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        reply.code(502).send({ error: `Failed to query blocks: ${err.message}` });
    }
}

export async function handleBlockQuery(type: 'blockHash' | 'blockNum', req: FastifyRequest, reply: FastifyReply) {
    try {
        const blockQuery =
            type === 'blockHash'
                ? {
                      hash: (req.params as unknown as { blockHash: string }).blockHash,
                  }
                : {
                      number: (req.params as unknown as { blockNum: number }).blockNum,
                  };

        const { hash, number, timestamp } = (await Block.findOne(blockQuery).exec()) || {};

        reply.send({
            hash,
            number,
            timestamp,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        reply.code(502).send({ error: `Failed to query blocks: ${err.message}` });
    }
}

export async function listenRouter(router: Router) {
    const { config, logger, app, admin, forkId } = router;

    await connectDB(config.mongoUrl);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.register(fastifyCors, () => (req: FastifyRequest, callback: any) => {
        callback(null, {
            origin: req.headers.origin || '*',
            credentials: true,
            methods: ['GET, POST, OPTIONS'],
            headers: [
                'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type',
            ],
            maxAge: 1728000,
        });
    });

    app.get('/', (_, reply) => {
        handleStatus(router, reply);
    });

    app.get('/hash/:blockHash', { schema: blockHashSchema }, (req, reply) => {
        handleBlockQuery('blockHash', req, reply);
    });

    app.get('/number/:blockNum', { schema: blockNumSchema }, (req, reply) => {
        handleBlockQuery('blockNum', req, reply);
    });

    app.post('/', { schema: bodySchema }, (req, reply) => {
        handleBlocksQuery(router, req, reply);
    });

    const { port, host } = config;

    app.listen({ port, host }, (err, address) => {
        if (err) {
            logger.error('Router Error');
            console.log(err);
            throw err;
        } else {
            logger.info(`Router listening on ${address}`);
        }
    });

    admin.get('/errors', (_, reply) => {
        (async () => {
            const { errors } = await sendMessage<{
                errors: ErrorMessages[];
            }>(router, { type: 'errors' });

            reply.header('Content-Type', 'application/json').send(JSON.stringify(errors, null, 2));
        })();
    });

    admin.listen({ port: port + 100, host }, (err, address) => {
        if (err) {
            logger.error('Admin Router Error');
            console.log(err);
            throw err;
        } else {
            if (forkId === 0) {
                logger.info(`Admin Router listening on ${address}`);
            }
        }
    });

    resolveMessages(router);
}

export class Router {
    config: Config;
    logger: Logger;
    forkId: number;

    app: FastifyInstance;

    // For viewing error logs
    admin: FastifyInstance;

    messages: SentMsg[];

    constructor(config: Config, forkId = 0) {
        this.config = config;
        this.logger = getLogger(`[Router ${forkId} (${config.chainId})]`, config.logLevel);
        this.forkId = forkId;

        const app = fastify({
            trustProxy: config.reverseProxy ? 1 : false,
            ignoreTrailingSlash: true,
        });

        const admin = fastify();

        this.app = app;
        this.admin = admin;
        this.messages = [];

        listenRouter(this);
    }
}
