"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncManager = exports.getLatestLocalBlock = void 0;
exports.getProvider = getProvider;
exports.getBlockChunks = getBlockChunks;
exports.syncBlocks = syncBlocks;
exports.syncAllBlocks = syncAllBlocks;
exports.startSync = startSync;
const ethers_1 = require("ethers");
const p_queue_1 = __importDefault(require("p-queue"));
const db_1 = require("./db");
const logger_1 = require("./logger");
const utils_1 = require("./utils");
const error_1 = require("./error");
/**
 * Create static ethers provider
 */
async function getProvider(syncManager) {
    const { config: { chainId, rpcUrl, syncInterval }, logger, } = syncManager;
    const staticNetwork = await new ethers_1.JsonRpcProvider(rpcUrl).getNetwork();
    if (Number(staticNetwork.chainId) !== chainId) {
        const errMsg = `Wrong network for ${rpcUrl}, wants ${chainId} have ${Number(staticNetwork.chainId)}`;
        throw new Error(errMsg);
    }
    syncManager.provider = new ethers_1.JsonRpcProvider(rpcUrl, staticNetwork, {
        staticNetwork,
        pollingInterval: syncInterval * 1000,
    });
    logger.info(`Connected with ${rpcUrl} (ChainID: ${chainId})`);
}
function getBlockChunks(syncManager, startBlock, endBlock) {
    const { config: { blockBatch }, } = syncManager;
    let toSync = [];
    for (let i = startBlock; i < endBlock + 1; i += blockBatch) {
        const j = i + blockBatch - 1 > endBlock ? endBlock : i + blockBatch - 1;
        toSync.push((0, utils_1.range)(i, j).reverse());
    }
    toSync = toSync.reverse();
    return toSync;
}
/**
 * Sync blocks
 */
async function syncBlocks(syncManager, blockNumbers, priority = 0) {
    const { config: { readOnly, maxRetry, retryAfter }, provider, blockQueue, localBlock, logger, } = syncManager;
    const blocks = (await Promise.all(blockNumbers.map(async (b) => {
        let count = 0;
        let errorObject;
        while (count < maxRetry + 1) {
            try {
                const block = await blockQueue.add(() => provider.getBlock(b), { priority });
                if (!block) {
                    const errMsg = `Block ${b} not found`;
                    throw new Error(errMsg);
                }
                return {
                    hash: block.hash,
                    number: block.number,
                    timestamp: block.timestamp,
                };
            }
            catch (e) {
                errorObject = e;
                count++;
                await (0, utils_1.sleep)(retryAfter);
            }
        }
        throw errorObject;
    }))).flat();
    if (!readOnly) {
        await db_1.Block.insertMany(blocks);
    }
    const firstBlock = Number(blocks[blocks.length - 1].number);
    const lastBlock = Number(blocks[0].number);
    const lastBlockTimestamp = `(${Math.floor(Date.now() / 1000) - Number(blocks[0].timestamp || 0)} sec old)`;
    logger.info(`Processed ${firstBlock !== lastBlock
        ? `${blocks.length} blocks (${firstBlock} ~ ${lastBlock}) ${lastBlockTimestamp}`
        : `new block (${firstBlock}) ${lastBlockTimestamp}`}`);
    if (!localBlock || localBlock < lastBlock) {
        syncManager.localBlock = lastBlock;
    }
}
/**
 * Create sync chunk and resolve it
 */
async function syncAllBlocks(syncManager, startBlock, endBlock, priority) {
    const blockChunks = getBlockChunks(syncManager, startBlock, endBlock);
    for (const blocks of blockChunks) {
        await syncBlocks(syncManager, blocks, priority);
    }
    if (blockChunks.length > 1) {
        syncManager.logger.info(`Initial Sync of ${startBlock} ~ ${endBlock} completed`);
    }
}
/**
 * Get latest block of mongoDB
 */
const getLatestLocalBlock = () => db_1.Block.find({})
    .sort({ number: -1 })
    .select('number -_id')
    .limit(1)
    .exec()
    .then((b) => Number(b?.[0]?.number));
exports.getLatestLocalBlock = getLatestLocalBlock;
/**
 * Init sync loop
 */
async function startSync(syncManager) {
    await getProvider(syncManager);
    let startBlock = 0, endBlock = 0;
    const { config: { readOnly, mongoUrl, startBlock: configStartBlock, syncInterval, chainId }, provider, logger, } = syncManager;
    if (!readOnly) {
        await (0, db_1.connectDB)(mongoUrl);
        startBlock = await (0, exports.getLatestLocalBlock)();
        if (startBlock) {
            startBlock += 1;
        }
    }
    if (!endBlock) {
        endBlock = await provider.getBlockNumber();
    }
    if (!startBlock) {
        startBlock = configStartBlock;
    }
    console.log({
        config: syncManager.config,
        startBlock,
        endBlock,
    });
    if (startBlock < endBlock) {
        syncAllBlocks(syncManager, startBlock, endBlock);
    }
    setInterval(async () => {
        try {
            const blockNum = await provider.getBlockNumber();
            const shouldSkipSync = syncManager.onSync || !syncManager.localBlock || syncManager.localBlock >= blockNum;
            if (shouldSkipSync) {
                return;
            }
            syncManager.onSync = true;
            await syncAllBlocks(syncManager, syncManager.localBlock + 1, blockNum, 1);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (err) {
            logger.error(`Failed to sync new blocks: ${err.message}`);
            syncManager.errors.push((0, error_1.newError)(`SyncManager(${chainId})`, err));
        }
        syncManager.onSync = false;
    }, syncInterval * 1000);
}
class SyncManager {
    config;
    logger;
    provider;
    blockQueue;
    localBlock;
    onSync;
    errors;
    constructor(config) {
        this.config = config;
        this.logger = (0, logger_1.getLogger)(`[SyncManager (${config.chainId})]`, config.logLevel);
        this.provider = new ethers_1.JsonRpcProvider(config.rpcUrl);
        this.blockQueue = new p_queue_1.default({
            interval: 1000,
            intervalCap: config.blockQueue,
            concurrency: config.blockConcurrency,
        });
        this.localBlock = 0;
        this.onSync = false;
        this.errors = [];
    }
    startSync() {
        return startSync(this);
    }
}
exports.SyncManager = SyncManager;
