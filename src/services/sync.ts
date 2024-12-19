import { JsonRpcProvider } from 'ethers';
import PQueue from 'p-queue';
import type { Logger } from 'winston';

import { connectDB, Block } from './db';
import { getLogger } from './logger';
import { range, sleep } from './utils';
import { ErrorMessages, newError } from './error';
import type { Config } from '../config';

/**
 * Create static ethers provider
 */
export async function getProvider(syncManager: SyncManager) {
    const {
        config: { chainId, rpcUrl, syncInterval },
        logger,
    } = syncManager;

    const staticNetwork = await new JsonRpcProvider(rpcUrl).getNetwork();

    if (Number(staticNetwork.chainId) !== chainId) {
        const errMsg = `Wrong network for ${rpcUrl}, wants ${chainId} have ${Number(staticNetwork.chainId)}`;
        throw new Error(errMsg);
    }

    syncManager.provider = new JsonRpcProvider(rpcUrl, staticNetwork, {
        staticNetwork,
        pollingInterval: syncInterval * 1000,
    });

    logger.info(`Connected with ${rpcUrl} (ChainID: ${chainId})`);
}

export function getBlockChunks(syncManager: SyncManager, startBlock: number, endBlock: number): number[][] {
    const {
        config: { blockBatch },
    } = syncManager;

    let toSync: number[][] = [];

    for (let i = startBlock; i < endBlock + 1; i += blockBatch) {
        const j = i + blockBatch - 1 > endBlock ? endBlock : i + blockBatch - 1;

        toSync.push(range(i, j).reverse());
    }

    toSync = toSync.reverse();

    return toSync;
}

/**
 * Sync blocks
 */
export async function syncBlocks(syncManager: SyncManager, blockNumbers: number[], priority = 0) {
    const {
        config: { readOnly, maxRetry, retryAfter },
        provider,
        blockQueue,
        localBlock,
        logger,
    } = syncManager;

    const blocks = (
        await Promise.all(
            blockNumbers.map(async (b) => {
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
                    } catch (e) {
                        errorObject = e;
                        count++;
                        await sleep(retryAfter);
                    }
                }

                throw errorObject;
            }),
        )
    ).flat();

    if (!readOnly) {
        await Block.insertMany(blocks);
    }

    const firstBlock = Number(blocks[blocks.length - 1].number);
    const lastBlock = Number(blocks[0].number);
    const lastBlockTimestamp = `(${Math.floor(Date.now() / 1000) - Number(blocks[0].timestamp || 0)} sec old)`;

    logger.info(
        `Processed ${
            firstBlock !== lastBlock
                ? `${blocks.length} blocks (${firstBlock} ~ ${lastBlock}) ${lastBlockTimestamp}`
                : `new block (${firstBlock}) ${lastBlockTimestamp}`
        }`,
    );

    if (!localBlock || localBlock < lastBlock) {
        syncManager.localBlock = lastBlock;
    }
}

/**
 * Create sync chunk and resolve it
 */
export async function syncAllBlocks(syncManager: SyncManager, startBlock: number, endBlock: number, priority?: number) {
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
export const getLatestLocalBlock = () =>
    Block.find({})
        .sort({ number: -1 })
        .select('number -_id')
        .limit(1)
        .exec()
        .then((b) => Number(b?.[0]?.number));

/**
 * Init sync loop
 */
export async function startSync(syncManager: SyncManager) {
    await getProvider(syncManager);

    let startBlock = 0,
        endBlock = 0;

    const {
        config: { readOnly, mongoUrl, startBlock: configStartBlock, syncInterval, chainId },
        provider,
        logger,
    } = syncManager;

    if (!readOnly) {
        await connectDB(mongoUrl);
        startBlock = await getLatestLocalBlock();

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
        } catch (err: any) {
            logger.error(`Failed to sync new blocks: ${err.message}`);
            syncManager.errors.push(newError(`SyncManager(${chainId})`, err));
        }

        syncManager.onSync = false;
    }, syncInterval * 1000);
}

export class SyncManager {
    config: Config;
    logger: Logger;

    provider: JsonRpcProvider;
    blockQueue: PQueue;

    localBlock: number;
    onSync: boolean;
    errors: ErrorMessages[];

    constructor(config: Config) {
        this.config = config;
        this.logger = getLogger(`[SyncManager (${config.chainId})]`, config.logLevel);

        this.provider = new JsonRpcProvider(config.rpcUrl);
        this.blockQueue = new PQueue({
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
