import process from 'process';
import os from 'os';
import 'dotenv/config';

export interface Config {
    /**
     * Router config
     */
    host: string;
    port: number;
    workers: number;
    reverseProxy: boolean;
    logLevel?: string;

    /**
     * Connection config (Required)
     */
    chainId: number;
    rpcUrl: string;
    mongoUrl: string; // Define different DB per coin

    /**
     * Sync config
     */
    readOnly: boolean;
    startBlock: number;
    syncInterval: number;

    /**
     * Queue & Retries
     */
    maxRetry: number;
    retryAfter: number;
    blockQueue: number;
    blockConcurrency: number;
    blockBatch: number;
    maxReturn: number;
}

export function getConfig(): Config {
    return {
        host: process.env.HOST || '0.0.0.0',
        port: Number(process.env.PORT || 3000),
        workers: Number(process.env.WORKERS || os.cpus().length),
        reverseProxy: process.env.REVERSE_PROXY === 'true',
        logLevel: process.env.LOG_LEVEL || undefined,

        chainId: Number(process.env.CHAIN_ID || 1),
        rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
        mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/ethBlocks',

        readOnly: process.env.READ_ONLY === 'true' ? true : false,
        startBlock: Number(process.env.START_BLOCK || 0),
        syncInterval: Number(process.env.SYNC_INTERVAL || 1),

        maxRetry: Number(process.env.MAX_RETRY || 3),
        retryAfter: Number(process.env.RETRY_AFTER || 200),
        blockQueue: Number(process.env.BLOCK_QUEUE || 10),
        blockConcurrency: Number(process.env.BLOCK_CONCURRENCY || 10),
        blockBatch: Number(process.env.BLOCK_BATCH || 100),
        maxReturn: Number(process.env.MAX_RETURN || 100),
    };
}
