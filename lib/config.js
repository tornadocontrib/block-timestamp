"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
const process_1 = __importDefault(require("process"));
const os_1 = __importDefault(require("os"));
require("dotenv/config");
function getConfig() {
    return {
        host: process_1.default.env.HOST || '0.0.0.0',
        port: Number(process_1.default.env.PORT || 3000),
        workers: Number(process_1.default.env.WORKERS || os_1.default.cpus().length),
        reverseProxy: process_1.default.env.REVERSE_PROXY === 'true',
        logLevel: process_1.default.env.LOG_LEVEL || undefined,
        chainId: Number(process_1.default.env.CHAIN_ID || 1),
        rpcUrl: process_1.default.env.RPC_URL || 'http://localhost:8545',
        mongoUrl: process_1.default.env.MONGO_URL || 'mongodb://127.0.0.1:27017/ethBlocks',
        readOnly: process_1.default.env.READ_ONLY === 'true' ? true : false,
        startBlock: Number(process_1.default.env.START_BLOCK || 0),
        syncInterval: Number(process_1.default.env.SYNC_INTERVAL || 1),
        maxRetry: Number(process_1.default.env.MAX_RETRY || 3),
        retryAfter: Number(process_1.default.env.RETRY_AFTER || 200),
        blockQueue: Number(process_1.default.env.BLOCK_QUEUE || 10),
        blockConcurrency: Number(process_1.default.env.BLOCK_CONCURRENCY || 10),
        blockBatch: Number(process_1.default.env.BLOCK_BATCH || 100),
        maxReturn: Number(process_1.default.env.MAX_RETURN || 100),
    };
}
