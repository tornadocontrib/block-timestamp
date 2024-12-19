"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
exports.handleStatus = handleStatus;
exports.handleBlocksQuery = handleBlocksQuery;
exports.handleBlockQuery = handleBlockQuery;
exports.listenRouter = listenRouter;
const fastify_1 = require("fastify");
const cors_1 = require("@fastify/cors");
const db_1 = require("./db");
const schema_1 = require("./schema");
const logger_1 = require("./logger");
const routerMsg_1 = require("./routerMsg");
async function handleStatus(router, reply) {
    const { config: { chainId }, } = router;
    const [{ localBlock, onSync, errors }, savedBlocks] = await Promise.all([
        (0, routerMsg_1.sendMessage)(router, { type: 'status' }),
        db_1.Block.countDocuments({}),
    ]);
    reply.header('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify({
        chainId,
        localBlock,
        savedBlocks,
        onSync,
        errors,
    }, null, 2));
}
async function handleBlocksQuery(router, req, reply) {
    try {
        const { config: { maxReturn }, } = router;
        const queries = [];
        if (!Array.isArray(req.body)) {
            const r = req.body;
            if (r.length && r.length > maxReturn) {
                throw new Error('Exceeds return length');
            }
            queries.push({
                ...r,
                id: r.id || 0,
            });
        }
        else {
            queries.push(...req.body.map((r, i) => {
                if (r.length && r.length > maxReturn) {
                    throw new Error('Exceeds return length');
                }
                return {
                    ...r,
                    id: r.id || i,
                };
            }));
        }
        const facetQuery = queries.reduce((acc, curr) => {
            const timestamp = {};
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
            acc[curr.id] = pipeline;
            return acc;
        }, 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {});
        const aggregateResult = (await db_1.Block.aggregate([{ $facet: facetQuery }]))[0];
        const result = queries.map((q) => ({
            id: q.id,
            blocks: aggregateResult[q.id].map(({ hash, number, timestamp }) => ({ hash, number, timestamp })),
        }));
        reply.send(!Array.isArray(req.body) ? result[0] : result);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }
    catch (err) {
        reply.code(502).send({ error: `Failed to query blocks: ${err.message}` });
    }
}
async function handleBlockQuery(type, req, reply) {
    try {
        const blockQuery = type === 'blockHash'
            ? {
                hash: req.params.blockHash,
            }
            : {
                number: req.params.blockNum,
            };
        const { hash, number, timestamp } = (await db_1.Block.findOne(blockQuery).exec()) || {};
        reply.send({
            hash,
            number,
            timestamp,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }
    catch (err) {
        reply.code(502).send({ error: `Failed to query blocks: ${err.message}` });
    }
}
async function listenRouter(router) {
    const { config, logger, app, admin, forkId } = router;
    await (0, db_1.connectDB)(config.mongoUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.register(cors_1.fastifyCors, () => (req, callback) => {
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
    app.get('/hash/:blockHash', { schema: schema_1.blockHashSchema }, (req, reply) => {
        handleBlockQuery('blockHash', req, reply);
    });
    app.get('/number/:blockNum', { schema: schema_1.blockNumSchema }, (req, reply) => {
        handleBlockQuery('blockNum', req, reply);
    });
    app.post('/', { schema: schema_1.bodySchema }, (req, reply) => {
        handleBlocksQuery(router, req, reply);
    });
    const { port, host } = config;
    app.listen({ port, host }, (err, address) => {
        if (err) {
            logger.error('Router Error');
            console.log(err);
            throw err;
        }
        else {
            logger.info(`Router listening on ${address}`);
        }
    });
    admin.get('/errors', (_, reply) => {
        (async () => {
            const { errors } = await (0, routerMsg_1.sendMessage)(router, { type: 'errors' });
            reply.header('Content-Type', 'application/json').send(JSON.stringify(errors, null, 2));
        })();
    });
    admin.listen({ port: port + 100, host }, (err, address) => {
        if (err) {
            logger.error('Admin Router Error');
            console.log(err);
            throw err;
        }
        else {
            if (forkId === 0) {
                logger.info(`Admin Router listening on ${address}`);
            }
        }
    });
    (0, routerMsg_1.resolveMessages)(router);
}
class Router {
    config;
    logger;
    forkId;
    app;
    // For viewing error logs
    admin;
    messages;
    constructor(config, forkId = 0) {
        this.config = config;
        this.logger = (0, logger_1.getLogger)(`[Router ${forkId} (${config.chainId})]`, config.logLevel);
        this.forkId = forkId;
        const app = (0, fastify_1.fastify)({
            trustProxy: config.reverseProxy ? 1 : false,
            ignoreTrailingSlash: true,
        });
        const admin = (0, fastify_1.fastify)();
        this.app = app;
        this.admin = admin;
        this.messages = [];
        listenRouter(this);
    }
}
exports.Router = Router;
