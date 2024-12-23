import { JsonRpcProvider } from 'ethers';
import PQueue from 'p-queue';
import type { Logger } from 'winston';
import { ErrorMessages } from './error';
import type { Config } from '../config';
/**
 * Create static ethers provider
 */
export declare function getProvider(syncManager: SyncManager): Promise<void>;
export declare function getBlockChunks(syncManager: SyncManager, startBlock: number, endBlock: number): number[][];
/**
 * Sync blocks
 */
export declare function syncBlocks(syncManager: SyncManager, blockNumbers: number[], priority?: number): Promise<void>;
/**
 * Create sync chunk and resolve it
 */
export declare function syncAllBlocks(syncManager: SyncManager, startBlock: number, endBlock: number, priority?: number): Promise<void>;
/**
 * Get latest block of mongoDB
 */
export declare const getLatestLocalBlock: () => Promise<number>;
/**
 * Init sync loop
 */
export declare function startSync(syncManager: SyncManager): Promise<void>;
export declare class SyncManager {
    config: Config;
    logger: Logger;
    provider: JsonRpcProvider;
    blockQueue: PQueue;
    localBlock: number;
    onSync: boolean;
    errors: ErrorMessages[];
    constructor(config: Config);
    startSync(): Promise<void>;
}
